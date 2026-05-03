import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildKey, presignPut } from "@/lib/s3";

interface KindRule {
  maxBytes: number;
  types: string[];
  extByType: Record<string, string>;
}

const KIND_RULES: Record<"bg" | "hover" | "main", KindRule> = {
  bg: {
    maxBytes: 5 * 1024 * 1024,
    types: ["image/jpeg", "image/png", "image/webp"],
    extByType: {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    },
  },
  hover: {
    maxBytes: 10 * 1024 * 1024,
    types: ["video/mp4", "video/webm"],
    extByType: { "video/mp4": "mp4", "video/webm": "webm" },
  },
  main: {
    maxBytes: 100 * 1024 * 1024,
    types: ["video/mp4", "video/webm"],
    extByType: { "video/mp4": "mp4", "video/webm": "webm" },
  },
};

const schema = z.object({
  projectId: z.string().min(1),
  reelId: z.string().min(1),
  kind: z.enum(["bg", "hover", "main"]),
  contentType: z.string().min(1),
  size: z.number().int().positive(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const { projectId, reelId, kind, contentType, size } = parsed.data;
  const rules = KIND_RULES[kind];
  if (!rules.types.includes(contentType)) {
    return NextResponse.json(
      { error: "unsupported_content_type", allowed: rules.types },
      { status: 400 },
    );
  }
  if (size > rules.maxBytes) {
    return NextResponse.json(
      { error: "file_too_large", maxBytes: rules.maxBytes },
      { status: 400 },
    );
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, userId: session.user.id },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "project_not_found" }, { status: 404 });
  }

  const reel = await prisma.reel.findFirst({
    where: { id: reelId, projectId },
    select: { id: true },
  });
  if (!reel) {
    return NextResponse.json({ error: "reel_not_found" }, { status: 404 });
  }

  const ext = rules.extByType[contentType] || "bin";
  const key = buildKey({
    userId: session.user.id,
    projectId,
    reelId,
    kind,
    ext,
    id: nanoid(10),
  });

  const { url, publicUrl } = await presignPut({ key, contentType });

  return NextResponse.json({ uploadUrl: url, key, publicUrl });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteObject } from "@/lib/s3";

const buttonSchema = z.object({
  enabled: z.boolean(),
  text: z.string().max(120).default(""),
  url: z.string().max(2048).default(""),
  fontSize: z.number().int().min(8).max(40),
  textColor: z.string(),
  bgColor: z.string(),
  bgHoverColor: z.string(),
  radius: z.number().int().min(0).max(40),
  widthMode: z.enum(["auto", "stretch"]).default("auto"),
});

const updateSchema = z.object({
  title: z.string().max(200).optional(),
  bgImageKey: z.string().nullable().optional(),
  hoverVideoKey: z.string().nullable().optional(),
  mainVideoKey: z.string().nullable().optional(),
  button: buttonSchema.nullable().optional(),
  order: z.number().int().min(0).optional(),
});

interface Params {
  params: Promise<{ id: string; reelId: string }>;
}

async function findReel(userId: string, projectId: string, reelId: string) {
  return prisma.reel.findFirst({
    where: { id: reelId, projectId, project: { userId } },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, reelId } = await params;
  const reel = await findReel(session.user.id, id, reelId);
  if (!reel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.order !== undefined) data.order = parsed.data.order;
  if (parsed.data.button !== undefined) data.button = parsed.data.button;

  for (const field of ["bgImageKey", "hoverVideoKey", "mainVideoKey"] as const) {
    if (parsed.data[field] !== undefined) {
      const oldKey = (reel as Record<string, unknown>)[field] as string | null;
      if (oldKey && oldKey !== parsed.data[field]) {
        try {
          await deleteObject(oldKey);
        } catch {
          // ignore S3 cleanup failure
        }
      }
      data[field] = parsed.data[field];
    }
  }

  const updated = await prisma.reel.update({ where: { id: reelId }, data });
  return NextResponse.json({ reel: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id, reelId } = await params;
  const reel = await findReel(session.user.id, id, reelId);
  if (!reel) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  for (const key of [reel.bgImageKey, reel.hoverVideoKey, reel.mainVideoKey]) {
    if (key) {
      try {
        await deleteObject(key);
      } catch {
        // noop
      }
    }
  }
  await prisma.reel.delete({ where: { id: reelId } });
  return NextResponse.json({ ok: true });
}

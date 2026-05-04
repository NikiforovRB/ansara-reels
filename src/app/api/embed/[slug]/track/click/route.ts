import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { fallbackViewerHash, resolveViewer, viewerCookieHeader } from "@/lib/viewer";

const schema = z.object({ reelId: z.string().min(1) });

interface Params {
  params: Promise<{ slug: string }>;
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export async function POST(req: Request, { params }: Params) {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
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

  const reel = await prisma.reel.findFirst({
    where: { id: parsed.data.reelId, projectId: project.id },
    select: { id: true },
  });
  if (!reel) {
    return NextResponse.json({ error: "reel_not_found" }, { status: 404 });
  }

  let viewerHash: string;
  let cookieHeader: string | null = null;
  try {
    const resolved = await resolveViewer(project.id);
    viewerHash = resolved.hash;
    if (resolved.shouldSetCookie && resolved.cookieValue) {
      cookieHeader = viewerCookieHeader(resolved.cookieValue);
    }
  } catch {
    viewerHash = await fallbackViewerHash(project.id);
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  await prisma.reelClick.upsert({
    where: {
      reelId_viewerHash_day: { reelId: reel.id, viewerHash, day: today },
    },
    create: { reelId: reel.id, viewerHash, day: today },
    update: {},
  });

  const res = NextResponse.json({ ok: true });
  if (cookieHeader) res.headers.set("Set-Cookie", cookieHeader);
  return res;
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { mergeSettings } from "@/lib/settings";
import { S3_PREFIX, deletePrefix } from "@/lib/s3";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  settings: z.unknown().optional(),
});

interface Params {
  params: Promise<{ id: string }>;
}

async function ensureOwnership(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  return !!project;
}

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const project = await prisma.project.findFirst({
    where: { id, userId: session.user.id },
    include: {
      reels: { orderBy: { order: "asc" } },
    },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({
    project: {
      ...project,
      settings: mergeSettings(project.settings),
    },
  });
}

export async function PATCH(req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await ensureOwnership(session.user.id, id))) {
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
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const data: { name?: string; settings?: object } = {};
  if (parsed.data.name) data.name = parsed.data.name.trim();
  if (parsed.data.settings !== undefined) {
    data.settings = mergeSettings(parsed.data.settings) as unknown as object;
  }

  const updated = await prisma.project.update({
    where: { id },
    data,
    select: { id: true, name: true, slug: true, settings: true },
  });
  return NextResponse.json({
    project: { ...updated, settings: mergeSettings(updated.settings) },
  });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!(await ensureOwnership(session.user.id, id))) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  // Best-effort S3 cleanup: drop the entire project folder.
  const prefix = `${S3_PREFIX}/${session.user.id}/${id}/`;
  try {
    await deletePrefix(prefix);
  } catch (err) {
    console.error("s3 cleanup failed", err);
  }
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

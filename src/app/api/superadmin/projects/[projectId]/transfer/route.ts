import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/superadmin";

interface Params {
  params: Promise<{ projectId: string }>;
}

const schema = z.object({
  targetUserId: z.string().min(1),
});

export async function POST(req: Request, { params }: Params) {
  if (!(await requireSuperadmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { projectId } = await params;

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

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, userId: true },
  });
  if (!project) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const target = await prisma.user.findUnique({
    where: { id: parsed.data.targetUserId },
    select: { id: true },
  });
  if (!target) {
    return NextResponse.json({ error: "target_not_found" }, { status: 404 });
  }

  if (project.userId === target.id) {
    return NextResponse.json({ error: "same_owner" }, { status: 400 });
  }

  // Note: stored S3 keys keep the original owner's path segment; public URLs
  // remain valid, and deletion is key-based, so this is safe after transfer.
  await prisma.project.update({
    where: { id: projectId },
    data: { userId: target.id },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/superadmin";
import { deleteObject } from "@/lib/s3";

interface Params {
  params: Promise<{ userId: string }>;
}

const updateSchema = z
  .object({
    email: z.string().email().max(254).optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((d) => d.email !== undefined || d.password !== undefined, {
    message: "nothing_to_update",
  });

export async function PATCH(req: Request, { params }: Params) {
  if (!(await requireSuperadmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { userId } = await params;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!target) {
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

  const data: { email?: string; passwordHash?: string } = {};
  if (parsed.data.email !== undefined) {
    const email = parsed.data.email.toLowerCase().trim();
    const clash = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
      select: { id: true },
    });
    if (clash) {
      return NextResponse.json({ error: "email_taken" }, { status: 409 });
    }
    data.email = email;
  }
  if (parsed.data.password !== undefined) {
    data.passwordHash = await bcrypt.hash(parsed.data.password, 12);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await requireSuperadmin();
  if (!session) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const { userId } = await params;

  if (session.user?.id === userId) {
    return NextResponse.json({ error: "cannot_delete_self" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      projects: {
        select: {
          reels: {
            select: {
              bgImageKey: true,
              hoverVideoKey: true,
              mainVideoKey: true,
            },
          },
        },
      },
    },
  });
  if (!target) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Best-effort S3 cleanup: delete every stored file owned by this user's
  // projects. We delete by exact stored keys (rather than a userId prefix)
  // so transferred projects' files are handled by their current owner.
  const keys: string[] = [];
  for (const p of target.projects) {
    for (const r of p.reels) {
      if (r.bgImageKey) keys.push(r.bgImageKey);
      if (r.hoverVideoKey) keys.push(r.hoverVideoKey);
      if (r.mainVideoKey) keys.push(r.mainVideoKey);
    }
  }
  await Promise.all(
    keys.map((k) =>
      deleteObject(k).catch((err) => {
        console.error("s3 cleanup failed", k, err);
      }),
    ),
  );

  // Cascade removes projects, reels, views and clicks.
  await prisma.user.delete({ where: { id: userId } });
  return NextResponse.json({ ok: true });
}

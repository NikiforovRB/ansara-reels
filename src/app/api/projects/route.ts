import { NextResponse } from "next/server";
import { z } from "zod";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SETTINGS } from "@/lib/settings";

const createSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { reels: true } },
    },
  });
  return NextResponse.json({ projects });
}

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
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const project = await prisma.project.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name.trim(),
      slug: nanoid(12),
      settings: DEFAULT_SETTINGS as unknown as object,
    },
    select: { id: true, name: true, slug: true },
  });
  return NextResponse.json({ project }, { status: 201 });
}

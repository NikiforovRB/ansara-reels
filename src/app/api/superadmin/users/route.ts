import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSuperadmin } from "@/lib/superadmin";

const schema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
});

export async function POST(req: Request) {
  if (!(await requireSuperadmin())) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return NextResponse.json({ error: "email_taken" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await prisma.user.create({
    data: { email, passwordHash },
    select: { id: true, email: true, createdAt: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}

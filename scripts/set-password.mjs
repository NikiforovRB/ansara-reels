import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error("Usage: node scripts/set-password.mjs <email> <password>");
  process.exit(1);
}

const prisma = new PrismaClient();
const passwordHash = await bcrypt.hash(password, 12);

const user = await prisma.user.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash },
  create: { email: email.toLowerCase(), passwordHash },
  select: { id: true, email: true, createdAt: true },
});

console.log("OK:", user);
await prisma.$disconnect();

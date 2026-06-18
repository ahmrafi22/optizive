import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../prisma/generated/prisma/client.js";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

async function seed() {
  if (!process.env.DATABASE_URL) {
    console.error("Missing DATABASE_URL.");
    process.exit(1);
  }

  const adapter = new PrismaNeon(
    { connectionString: process.env.DATABASE_URL },
    { schema: process.env.DATABASE_SCHEMA ?? "public" },
  );
  const prisma = new PrismaClient({ adapter });

  const email = "admin@optzive.com";
  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${existing.id}`);
    await prisma.$disconnect();
    return;
  }

  const password = await bcrypt.hash("admin123", 12);

  const admin = await prisma.user.create({
    data: {
      id: randomUUID(),
      name: "Admin",
      email,
      username: "admin_optzive",
      password,
      role: "ADMIN",
      onboarded: true,
      isVerified: true,
      banned: false,
    },
  });

  console.log(`Admin user created:`);
  console.log(`  ID:       ${admin.id}`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: admin123`);
  console.log(`  Role:     ADMIN`);

  await prisma.$disconnect();
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}

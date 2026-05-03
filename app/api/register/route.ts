import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "@/lib/prisma";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as RegisterPayload | null;

  if (!body) {
    return NextResponse.json({ message: "Invalid payload" }, { status: 400 });
  }

  const name = body.name?.trim();
  const email = body.email?.trim();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json(
      { message: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const existingUser = await prisma.user.findFirst({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "User already exists" },
      { status: 409 }
    );
  }

  // Generate username from email + timestamp
  const username = email.split("@")[0] + "_" + Date.now();

  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      id: randomUUID(),
      name,
      username,
      email,
      password: hashedPassword,
      role: "NONE",
      onboarded: false,
    },
  });

  return NextResponse.json({ ok: true });
}

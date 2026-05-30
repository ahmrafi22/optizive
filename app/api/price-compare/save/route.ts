import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productName, category, info, city, country, data } = await req.json();

  const result = await prisma.priceCompareResult.create({
    data: {
      userId: session.user.id,
      productName,
      category,
      info: info || null,
      city: city || null,
      country,
      data,
    },
  });

  return NextResponse.json(result);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await prisma.priceCompareResult.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      productName: true,
      category: true,
      country: true,
      createdAt: true,
    },
  });

  return NextResponse.json(results);
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { isDemoUserId } from "@/backend/demo/demo-store";
import { demoPriceCompareSave, demoPriceCompareList } from "@/backend/demo/demo-store-api";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { productName, category, info, city, country, data } = await req.json();

  if (isDemoUserId(session.user.id)) {
    const saved = demoPriceCompareSave({ productName, category, info, city, country, data });
    return NextResponse.json(saved);
  }

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

  if (isDemoUserId(session.user.id)) {
    return NextResponse.json(demoPriceCompareList());
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

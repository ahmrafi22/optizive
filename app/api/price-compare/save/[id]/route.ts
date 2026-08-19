import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { isDemoUserId } from "@/backend/demo/demo-store";
import { demoPriceCompareGet } from "@/backend/demo/demo-store-api";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (isDemoUserId(session.user.id)) {
    const demo = demoPriceCompareGet(id);
    if (!demo) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(demo);
  }

  const result = await prisma.priceCompareResult.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(result);
}

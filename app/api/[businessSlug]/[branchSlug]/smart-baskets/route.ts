import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyStoreApiKey, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string }> }) {
  const { businessSlug, branchSlug } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  const baskets = await prisma.smartBasket.findMany({
    where: { ownerId: store.ownerId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  await logApiHit(store.id, "/smart-baskets", "GET", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    baskets: baskets.map((b) => ({
      id: b.id,
      title: b.title,
      description: b.description,
      isPublic: b.isPublic,
      publicId: b.publicId,
      baseTotal: b.baseTotal,
      customTotal: b.customTotal,
      itemCount: b._count.items,
      createdAt: b.createdAt.toISOString(),
    })),
  });
}

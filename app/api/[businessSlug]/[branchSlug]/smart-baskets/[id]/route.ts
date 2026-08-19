import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { verifyStoreApiKey, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import { demoGetSmartBasketDetail } from "@/backend/demo/demo-smart-basket";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string; id: string }> }) {
  const { businessSlug, branchSlug, id } = await params;
  const { store, error } = await verifyStoreApiKey(businessSlug, branchSlug, req.headers.get("x-api-key"));
  if (!store) return jsonError(error!, 401);

  if (store.ownerId === DEMO_USER_ID) {
    const basket = demoGetSmartBasketDetail(id);
    if (!basket) return jsonError("Smart basket not found", 404);
    await logApiHit(store.id, `/smart-baskets/${id}`, "GET", 200, req.headers.get("x-forwarded-for"));
    return jsonOk({
      basket: {
        id: basket.id,
        title: basket.title,
        description: basket.description,
        isPublic: basket.isPublic,
        publicId: basket.publicId,
        baseTotal: basket.baseTotal,
        customTotal: basket.customTotal,
        sourceCategory: basket.sourceCategory,
        createdAt: basket.createdAt,
        items: basket.items.map((i) => ({
          id: i.id,
          productId: i.productId,
          productName: i.name,
          price: i.sellingPrice,
          quantity: i.quantity,
          unit: i.unit,
          image: i.imageLink,
          role: i.role,
          reason: i.reason,
        })),
      },
    });
  }

  const basket = await prisma.smartBasket.findFirst({
    where: { id, ownerId: store.ownerId },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          product: { select: { id: true, name: true, sellingPrice: true, quantity: true, unit: true, imageLink: true } },
        },
      },
    },
  });

  if (!basket) return jsonError("Smart basket not found", 404);

  await logApiHit(store.id, `/smart-baskets/${id}`, "GET", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    basket: {
      id: basket.id,
      title: basket.title,
      description: basket.description,
      isPublic: basket.isPublic,
      publicId: basket.publicId,
      baseTotal: basket.baseTotal,
      customTotal: basket.customTotal,
      sourceCategory: basket.sourceCategory,
      createdAt: basket.createdAt.toISOString(),
      items: basket.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        productName: i.product.name,
        price: i.product.sellingPrice,
        quantity: i.quantity,
        unit: i.product.unit,
        image: i.product.imageLink,
        role: i.role,
        reason: i.reason,
      })),
    },
  });
}

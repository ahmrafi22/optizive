import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveStore, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";

interface PriceItem {
  productId: string;
  quantity: number;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string }> }) {
  const { businessSlug, branchSlug } = await params;
  const resolved = await resolveStore(businessSlug, branchSlug);
  if (!resolved) return jsonError("Business or branch not found", 404);
  if (!resolved.isActive) return jsonError("Branch is not active", 403);

  let body: { items?: PriceItem[]; discount?: number };
  try {
    body = await req.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    return jsonError("items must be a non-empty array");
  }

  const productIds = body.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, ownerId: resolved.ownerId, isActive: true },
    select: { id: true, name: true, sellingPrice: true, quantity: true, unit: true },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));
  const errors: { productId: string; error: string }[] = [];
  const lineItems: { productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number; unit: string }[] = [];

  for (const item of body.items) {
    const product = productMap.get(item.productId);
    if (!product) {
      errors.push({ productId: item.productId, error: "Product not found or inactive" });
      continue;
    }
    if (item.quantity <= 0) {
      errors.push({ productId: item.productId, error: "Quantity must be positive" });
      continue;
    }
    lineItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.sellingPrice,
      totalPrice: product.sellingPrice * item.quantity,
      unit: product.unit,
    });
  }

  const subtotal = lineItems.reduce((s, i) => s + i.totalPrice, 0);
  const discount = Math.min(Math.max(0, body.discount || 0), subtotal);
  const total = subtotal - discount;

  await logApiHit(resolved.storeId, "/check-price", "POST", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    items: lineItems,
    subtotal,
    discount,
    total,
    currency: "BDT",
    errors: errors.length > 0 ? errors : undefined,
  });
}

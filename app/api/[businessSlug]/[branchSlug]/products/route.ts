import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { resolveStore, jsonOk, jsonError, logApiHit } from "@/backend/store/api-auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessSlug: string; branchSlug: string }> }) {
  const { businessSlug, branchSlug } = await params;
  const resolved = await resolveStore(businessSlug, branchSlug);
  if (!resolved) return jsonError("Business or branch not found", 404);
  if (!resolved.isActive) return jsonError("Branch is not active", 403);

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const category = searchParams.get("category");
  const search = searchParams.get("search");

  const where: any = { ownerId: resolved.ownerId, isActive: true };
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        sellingPrice: true,
        quantity: true,
        unit: true,
        imageLink: true,
        category: true,
        sku: true,
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
  ]);

  await logApiHit(resolved.storeId, "/products", "GET", 200, req.headers.get("x-forwarded-for"));

  return jsonOk({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.sellingPrice,
      stock: p.quantity,
      unit: p.unit,
      image: p.imageLink,
      category: p.category,
      sku: p.sku,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

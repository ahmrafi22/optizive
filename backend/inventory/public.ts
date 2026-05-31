"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getExpiryStatus } from "@/backend/expiry-utils";
import type { ExpiryStatus } from "@/backend/expiry-utils";

export type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  minStock: number | null;
  sku: string | null;
  barcode: string | null;
  imageLink: string | null;
  expiryDate: string | null;
  batchNumber: string | null;
  createdAt: string;
  updatedAt: string;
  stockStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
  margin: number;
  value: number;
  owner: {
    name: string;
    profileImage: string | null;
    businessName: string | null;
  };
};

export type PublicSalesData = {
  date: string;
  sales: number;
  revenue: number;
};

function getStockStatus(product: {
  isActive: boolean;
  quantity: number;
  minStock: number | null;
}): "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE" {
  if (!product.isActive) return "INACTIVE";
  if (product.quantity <= 0) return "OUT_OF_STOCK";
  if (product.minStock !== null && product.quantity <= product.minStock) return "LOW_STOCK";
  return "IN_STOCK";
}

export async function getPublicProductById(productId: string): Promise<PublicProduct | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      owner: {
        select: {
          name: true,
          profileImage: true,
          businessName: true,
        },
      },
    },
  });

  if (!product) return null;

  const stockStatus = getStockStatus({
    isActive: product.isActive,
    quantity: product.quantity,
    minStock: product.minStock,
  });

  const expiryDateStr = product.expiryDate ? product.expiryDate.toISOString() : null;
  const margin = Number((product.sellingPrice - product.costPrice).toFixed(2));
  const value = Number((product.sellingPrice * product.quantity).toFixed(2));

  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    category: product.category ?? null,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    quantity: product.quantity,
    unit: product.unit,
    minStock: product.minStock,
    sku: product.sku ?? null,
    barcode: product.barcode ?? null,
    imageLink: product.imageLink ?? null,
    expiryDate: expiryDateStr,
    batchNumber: product.batchNumber ?? null,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    stockStatus,
    expiryStatus: getExpiryStatus(expiryDateStr),
    daysUntilExpiry: expiryDateStr
      ? Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
    margin,
    value,
    owner: product.owner,
  };
}

export async function getPublicProductSales(productId: string, days: number = 7): Promise<PublicSalesData[]> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, ownerId: true },
  });

  if (!product) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const salesData = await prisma.$queryRaw<
    Array<{
      date: Date;
      totalQuantity: number;
      totalRevenue: number;
    }>
  >`
    SELECT
      DATE("Sale"."createdAt") as date,
      COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity",
      COALESCE(SUM("SaleItem"."totalPrice"), 0) as "totalRevenue"
    FROM "SaleItem"
    INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
    WHERE "SaleItem"."productId" = ${productId}
      AND "Sale"."ownerId" = ${product.ownerId}
      AND "Sale"."createdAt" >= ${startDate}
    GROUP BY DATE("Sale"."createdAt")
    ORDER BY date ASC
  `;

  const dataMap = new Map<string, { sales: number; revenue: number }>();
  salesData.forEach((row) => {
    const dateStr = row.date.toISOString().split("T")[0];
    dataMap.set(dateStr, {
      sales: Number(row.totalQuantity),
      revenue: Number(row.totalRevenue),
    });
  });

  const result: PublicSalesData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    const data = dataMap.get(dateStr) || { sales: 0, revenue: 0 };
    result.push({ date: dateStr, sales: data.sales, revenue: data.revenue });
  }

  return result;
}

export async function updatePublicProduct(
  productId: string,
  data: {
    quantity?: number;
    expiryDate?: string | null;
    batchNumber?: string | null;
    name?: string;
    description?: string | null;
    category?: string | null;
  }
): Promise<PublicProduct | null> {
  const existing = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });

  if (!existing) return null;

  const updateData: Record<string, unknown> = {};
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.expiryDate !== undefined) updateData.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  if (data.batchNumber !== undefined) updateData.batchNumber = data.batchNumber || null;
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description || null;
  if (data.category !== undefined) updateData.category = data.category || null;

  await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  return getPublicProductById(productId);
}

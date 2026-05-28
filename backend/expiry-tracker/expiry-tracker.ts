"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import { getExpiryStatus } from "@/backend/expiry-utils";
import type { ExpiryStatus } from "@/backend/expiry-utils";
import type { Category, StockUnit } from "@/prisma/generated/prisma/client";

export interface ExpiryProduct {
  id: string;
  name: string;
  description: string | null;
  category: Category | null;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: StockUnit;
  imageLink: string | null;
  isActive: boolean;
  expiryDate: string | null;
  batchNumber: string | null;
  expiryStatus: ExpiryStatus;
  daysUntilExpiry: number | null;
  stockStatus: string;
  dailySellRate: number;
  daysUntilSoldOut: number | null;
  isAtRisk: boolean;
  riskScore: number;
  suggestedDiscount: number | null;
  suggestedBundleWith: string[];
  value: number;
  margin: number;
}

export interface ExpiryDashboardStats {
  totalExpirable: number;
  expired: number;
  expiringSoon: number;
  expiring: number;
  fresh: number;
  atRisk: number;
  totalValueAtRisk: number;
  potentialLoss: number;
}

export interface ClearanceSuggestion {
  type: "DISCOUNT" | "BUNDLE";
  productId: string;
  productName: string;
  imageLink: string | null;
  sellingPrice: number;
  suggestedPrice: number | null;
  discountPercent: number | null;
  bundleWith: string | null;
  bundleWithName: string | null;
  reason: string;
  urgency: "HIGH" | "MEDIUM" | "LOW";
  savingsAmount: number | null;
}

export async function getExpiryDashboardStats(): Promise<ExpiryDashboardStats | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const allProducts = await prisma.product.findMany({
    where: { ownerId: userId, isActive: true },
    select: {
      id: true,
      expiryDate: true,
      sellingPrice: true,
      quantity: true,
    },
  });

  let expired = 0, expiringSoon = 0, expiring = 0, fresh = 0, totalExpirable = 0;
  let totalValueAtRisk = 0;

  allProducts.forEach((p) => {
    if (!p.expiryDate) return;
    totalExpirable++;
    const status = getExpiryStatus(p.expiryDate?.toISOString() ?? null);
    if (status === "EXPIRED") {
      expired++;
      totalValueAtRisk += p.sellingPrice * p.quantity;
    } else if (status === "EXPIRING_SOON") {
      expiringSoon++;
      totalValueAtRisk += p.sellingPrice * p.quantity;
    } else if (status === "EXPIRING") {
      expiring++;
    } else {
      fresh++;
    }
  });

  return {
    totalExpirable,
    expired,
    expiringSoon,
    expiring,
    fresh,
    atRisk: expired + expiringSoon,
    totalValueAtRisk,
    potentialLoss: totalValueAtRisk * 0.7,
  };
}

export async function getExpiringProducts(): Promise<ExpiryProduct[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: {
      ownerId: userId,
      isActive: true,
      expiryDate: { not: null, lte: thirtyDaysFromNow },
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
    take: 50,
  });

  const productIds = products.map((p) => p.id);
  const salesData = await getSalesVelocity(productIds, userId);

  return products.map((product) => {
    const expiryDate = product.expiryDate!;
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dailySellRate = salesData.get(product.id) ?? 0;
    const daysUntilSoldOut = dailySellRate > 0 ? Math.ceil(product.quantity / dailySellRate) : null;

    const riskScore = calculateRiskScore(daysUntilExpiry, daysUntilSoldOut, dailySellRate, product.quantity);
    const isAtRisk = riskScore > 0.3;
    const suggestedDiscount = isAtRisk ? calculateSuggestedDiscount(daysUntilExpiry) : null;

    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category: product.category,
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      quantity: product.quantity,
      unit: product.unit,
      imageLink: product.imageLink,
      isActive: product.isActive,
      expiryDate: expiryDate.toISOString(),
      batchNumber: product.batchNumber,
      expiryStatus: getExpiryStatus(expiryDate.toISOString()),
      daysUntilExpiry,
      stockStatus: product.quantity <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
      dailySellRate,
      daysUntilSoldOut,
      isAtRisk,
      riskScore,
      suggestedDiscount,
      suggestedBundleWith: [],
      value: product.sellingPrice * product.quantity,
      margin: Number((product.sellingPrice - product.costPrice).toFixed(2)),
    };
  });
}

export async function predictAtRiskProducts(): Promise<ExpiryProduct[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const now = new Date();
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const products = await prisma.product.findMany({
    where: {
      ownerId: userId,
      isActive: true,
      expiryDate: { not: null, gte: now, lte: ninetyDaysFromNow },
      quantity: { gt: 0 },
    },
    orderBy: { expiryDate: "asc" },
    take: 100,
  });

  const productIds = products.map((p) => p.id);
  const salesData = await getSalesVelocity(productIds, userId);

  const scored: ExpiryProduct[] = [];

  for (const product of products) {
    const expiryDate = product.expiryDate!;
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const dailySellRate = salesData.get(product.id) ?? 0;
    const daysUntilSoldOut = dailySellRate > 0 ? Math.ceil(product.quantity / dailySellRate) : null;

    const riskScore = calculateRiskScore(daysUntilExpiry, daysUntilSoldOut, dailySellRate, product.quantity);
    const isAtRisk = riskScore > 0.3;

    if (isAtRisk) {
      scored.push({
        id: product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        quantity: product.quantity,
        unit: product.unit,
        imageLink: product.imageLink,
        isActive: product.isActive,
        expiryDate: expiryDate.toISOString(),
        batchNumber: product.batchNumber,
        expiryStatus: getExpiryStatus(expiryDate.toISOString()),
        daysUntilExpiry,
        stockStatus: product.quantity <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
        dailySellRate,
        daysUntilSoldOut,
        isAtRisk: true,
        riskScore,
        suggestedDiscount: calculateSuggestedDiscount(daysUntilExpiry),
        suggestedBundleWith: [],
        value: product.sellingPrice * product.quantity,
        margin: Number((product.sellingPrice - product.costPrice).toFixed(2)),
      });
    }
  }

  return scored.sort((a, b) => b.riskScore - a.riskScore);
}

export async function getClearanceSuggestions(): Promise<ClearanceSuggestion[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const atRiskProducts = await predictAtRiskProducts();
  if (atRiskProducts.length === 0) return [];

  const suggestions: ClearanceSuggestion[] = [];

  const popularProducts = await prisma.product.findMany({
    where: { ownerId: userId, isActive: true, quantity: { gt: 0 } },
    select: { id: true, name: true, imageLink: true, sellingPrice: true },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  for (const product of atRiskProducts.slice(0, 10)) {
    const discountPercent = product.suggestedDiscount ?? 0;
    const suggestedPrice = Number((product.sellingPrice * (1 - discountPercent / 100)).toFixed(2));
    const savingsAmount = Number((product.sellingPrice - suggestedPrice).toFixed(2));

    const urgency = product.daysUntilExpiry !== null
      ? product.daysUntilExpiry <= 3 ? "HIGH" as const
        : product.daysUntilExpiry <= 14 ? "MEDIUM" as const
        : "LOW" as const
      : "LOW" as const;

    suggestions.push({
      type: "DISCOUNT",
      productId: product.id,
      productName: product.name,
      imageLink: product.imageLink,
      sellingPrice: product.sellingPrice,
      suggestedPrice,
      discountPercent,
      bundleWith: null,
      bundleWithName: null,
      reason: product.daysUntilExpiry !== null
        ? `Expires in ${product.daysUntilExpiry} days. ${dailySellRateText(product.dailySellRate, product.daysUntilSoldOut)}`
        : "At risk of expiry",
      urgency,
      savingsAmount,
    });

    if (popularProducts.length > 0) {
      const bundleTarget = popularProducts[Math.floor(Math.random() * popularProducts.length)];
      const bundlePrice = Number((product.sellingPrice + bundleTarget.sellingPrice * 0.8).toFixed(2));
      const bundleSavings = Number((product.sellingPrice + bundleTarget.sellingPrice - bundlePrice).toFixed(2));

      suggestions.push({
        type: "BUNDLE",
        productId: product.id,
        productName: product.name,
        imageLink: product.imageLink,
        sellingPrice: product.sellingPrice,
        suggestedPrice: bundlePrice,
        discountPercent: null,
        bundleWith: bundleTarget.id,
        bundleWithName: bundleTarget.name,
        reason: `Bundle "${product.name}" with popular item "${bundleTarget.name}" at 20% off the add-on`,
        urgency,
        savingsAmount: bundleSavings,
      });
    }
  }

  return suggestions;
}

async function getSalesVelocity(
  productIds: string[],
  userId: string,
): Promise<Map<string, number>> {
  if (productIds.length === 0) return new Map();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const salesRows = await prisma.$queryRaw<Array<{
    productId: string;
    totalQuantity: number;
    daysWithSales: number;
  }>>(
    Prisma.sql`
      SELECT
        "SaleItem"."productId",
        COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity",
        COUNT(DISTINCT DATE("Sale"."createdAt")) as "daysWithSales"
      FROM "SaleItem"
      INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
      WHERE "SaleItem"."productId" IN (${Prisma.join(productIds)})
        AND "Sale"."ownerId" = ${userId}
        AND "Sale"."createdAt" >= ${thirtyDaysAgo}
      GROUP BY "SaleItem"."productId"
    `,
  );

  const velocity = new Map<string, number>();
  productIds.forEach((id) => velocity.set(id, 0));

  salesRows.forEach((row) => {
    const totalQty = Number(row.totalQuantity);
    const daysWithSales = Number(row.daysWithSales);
    const avgDaily = daysWithSales > 0 ? totalQty / 30 : 0;
    velocity.set(row.productId, avgDaily);
  });

  return velocity;
}

function calculateRiskScore(
  daysUntilExpiry: number,
  daysUntilSoldOut: number | null,
  dailySellRate: number,
  stock: number,
): number {
  if (daysUntilExpiry <= 0) return 1;
  if (dailySellRate <= 0) {
    if (stock > 0) return 0.7;
    return 0;
  }
  if (daysUntilSoldOut === null) return 0.5;

  const ratio = daysUntilSoldOut / daysUntilExpiry;
  if (ratio >= 1) return 0;
  if (ratio <= 0) return 1;

  return Number((1 - ratio).toFixed(2));
}

function calculateSuggestedDiscount(daysUntilExpiry: number): number {
  if (daysUntilExpiry <= 3) return 50;
  if (daysUntilExpiry <= 7) return 35;
  if (daysUntilExpiry <= 14) return 25;
  if (daysUntilExpiry <= 21) return 15;
  return 10;
}

function dailySellRateText(rate: number, daysUntilSoldOut: number | null): string {
  if (rate <= 0) return "No recent sales.";
  if (daysUntilSoldOut !== null) {
    return `Sells ${rate.toFixed(1)}/day — will last ~${daysUntilSoldOut} days.`;
  }
  return `Sells ${rate.toFixed(1)}/day.`;
}

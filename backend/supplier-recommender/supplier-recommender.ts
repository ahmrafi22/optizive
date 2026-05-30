"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@/prisma/generated/prisma/client";
import type { SupplierTag } from "@/prisma/generated/prisma/client";
import type {
  SupplierSummary,
  SupplierDetail,
  SupplierProduct,
  SupplierSearchFilters,
  SupplierSearchResponse,
  RestockSuggestion,
  BulkDiscountAlert,
} from "./types";

const RECOMMENDATION_LIMIT = 20;
const DEFAULT_PAGE_SIZE = 20;

const DELIVERY_SPEED_SCORES: Record<string, number> = {
  SAME_DAY: 100,
  NEXT_DAY: 80,
  TWO_THREE_DAYS: 60,
  WITHIN_WEEK: 40,
  FLEXIBLE: 30,
};

const DISTANCE_SCORES: Record<string, number> = {
  NEIGHBORHOOD: 100,
  LOCAL: 80,
  CITY: 60,
  REGIONAL: 40,
  NATIONWIDE: 20,
  INTERNATIONAL: 10,
};

const SERVICE_AREA_SCORES: Record<string, number> = {
  LOCAL: 100,
  CITY: 80,
  REGIONAL: 60,
  NATIONWIDE: 40,
  INTERNATIONAL: 20,
};

const PRICING_ALIGNMENT: Record<string, Record<string, number>> = {
  BUDGET: { BUDGET: 100, VALUE: 70, MID_RANGE: 40, PREMIUM: 10 },
  VALUE: { BUDGET: 70, VALUE: 100, MID_RANGE: 70, PREMIUM: 30 },
  MID_RANGE: { BUDGET: 30, VALUE: 70, MID_RANGE: 100, PREMIUM: 70 },
  PREMIUM: { BUDGET: 10, VALUE: 30, MID_RANGE: 70, PREMIUM: 100 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function scoreCategory(buyerCategory: string | null, supplierCategory: string | null): number {
  if (!buyerCategory || !supplierCategory) return 30;
  if (buyerCategory === supplierCategory) return 100;
  return 40;
}

function scoreLocation(
  buyerDistrict: string | null,
  supplierDistrict: string | null,
  supplierServiceArea: string | null,
  supplierRadiusKm: number | null,
): number {
  if (buyerDistrict && buyerDistrict === supplierDistrict) return 100;
  if (supplierServiceArea && DISTANCE_SCORES[supplierServiceArea]) {
    return DISTANCE_SCORES[supplierServiceArea] * 0.6;
  }
  if (supplierRadiusKm && supplierRadiusKm > 50) return 50;
  return 20;
}

function scoreDelivery(
  buyerMaxDeliveryTime: string | null,
  supplierDeliveryTime: string | null,
): number {
  if (!buyerMaxDeliveryTime || !supplierDeliveryTime) return 50;
  const buyerScore = DELIVERY_SPEED_SCORES[buyerMaxDeliveryTime] ?? 50;
  const supplierScore = DELIVERY_SPEED_SCORES[supplierDeliveryTime] ?? 50;
  if (supplierScore >= buyerScore) return 100;
  return clamp((supplierScore / Math.max(buyerScore, 1)) * 100, 0, 100);
}

function scorePricing(
  buyerPreference: string | null,
  supplierPricing: string | null,
): number {
  if (!buyerPreference || !supplierPricing) return 50;
  const matrix = PRICING_ALIGNMENT[buyerPreference];
  if (!matrix) return 50;
  return matrix[supplierPricing] ?? 50;
}

function scoreTrust(
  avgRating: number,
  isVerified: boolean,
  totalTransactions: number,
  yearsInBusiness: number | null,
): number {
  const ratingScore = clamp((avgRating / 5) * 100, 0, 100);
  const verifiedScore = isVerified ? 100 : 30;
  const txScore = clamp(Math.log10(totalTransactions + 1) / 3 * 100, 0, 100);
  const yearsScore = yearsInBusiness ? clamp((yearsInBusiness / 20) * 100, 0, 100) : 30;
  return ratingScore * 0.35 + verifiedScore * 0.3 + txScore * 0.2 + yearsScore * 0.15;
}

function scoreTags(supplierTags: string[], bulkDiscountAvailable: boolean | null): number {
  let score = 50;
  if (supplierTags.includes("FAST_DELIVERY")) score += 10;
  if (supplierTags.includes("LOW_PRICE")) score += 10;
  if (supplierTags.includes("PREMIUM_QUALITY")) score += 10;
  if (supplierTags.includes("BULK_DISCOUNT") || bulkDiscountAvailable) score += 15;
  if (supplierTags.includes("FACTORY_DIRECT")) score += 10;
  if (supplierTags.includes("HALAL_CERTIFIED") || supplierTags.includes("BSTI_CERTIFIED")) score += 5;
  return clamp(score, 0, 100);
}

function calculateMatchScore(
  buyer: {
    primaryCategory: string | null;
    district: string | null;
    pricingPreference: string | null;
    maxDeliveryTime: string | null;
  },
  supplier: {
    primaryCategory: string | null;
    district: string | null;
    serviceArea: string | null;
    serviceRadiusKm: number | null;
    deliveryTimeRange: string | null;
    pricingType: string | null;
    avgRating: number;
    isVerified: boolean;
    totalTransactions: number;
    yearsInBusiness: number | null;
    supplierTags: string[];
    bulkDiscountAvailable: boolean | null;
  },
): number {
  const catScore = scoreCategory(buyer.primaryCategory, supplier.primaryCategory);
  const locScore = scoreLocation(buyer.district, supplier.district, supplier.serviceArea, supplier.serviceRadiusKm);
  const delScore = scoreDelivery(buyer.maxDeliveryTime, supplier.deliveryTimeRange);
  const priceScore = scorePricing(buyer.pricingPreference, supplier.pricingType);
  const trustScore = scoreTrust(supplier.avgRating, supplier.isVerified, supplier.totalTransactions, supplier.yearsInBusiness);
  const tagScore = scoreTags(supplier.supplierTags, supplier.bulkDiscountAvailable);

  return Math.round(
    catScore * 0.30 +
    locScore * 0.20 +
    priceScore * 0.15 +
    delScore * 0.15 +
    trustScore * 0.10 +
    tagScore * 0.10,
  );
}

function toSupplierSummary(row: {
  id: string;
  name: string;
  businessName: string | null;
  profileImage: string | null;
  primaryCategory: string | null;
  avgRating: number;
  totalTransactions: number;
  isVerified: boolean;
  deliveryTimeRange: string | null;
  pricingType: string | null;
  supplierTags: string[];
  bulkDiscountAvailable: boolean | null;
  district: string | null;
  area: string | null;
  serviceArea: string | null;
  serviceRadiusKm: number | null;
  _count?: { inventory: number };
}, matchScore?: number): SupplierSummary {
  return {
    id: row.id,
    businessName: row.businessName,
    name: row.name,
    profileImage: row.profileImage,
    primaryCategory: row.primaryCategory,
    avgRating: row.avgRating,
    totalTransactions: row.totalTransactions,
    isVerified: row.isVerified,
    deliveryTimeRange: row.deliveryTimeRange,
    pricingType: row.pricingType,
    supplierTags: row.supplierTags,
    bulkDiscountAvailable: row.bulkDiscountAvailable,
    district: row.district,
    area: row.area,
    serviceArea: row.serviceArea,
    serviceRadiusKm: row.serviceRadiusKm,
    productCount: row._count?.inventory ?? 0,
    matchScore: matchScore ?? 0,
  };
}

export async function getSupplierRecommendations(limit = 6): Promise<SupplierSummary[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      primaryCategory: true,
      district: true,
      pricingPreference: true,
      maxDeliveryTime: true,
      role: true,
    },
  });
  if (!buyer) return [];

  const suppliers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { role: "SUPPLIER" },
        { role: "BOTH" },
      ],
      isActive: true,
      isVerified: true,
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      profileImage: true,
      primaryCategory: true,
      avgRating: true,
      totalTransactions: true,
      isVerified: true,
      deliveryTimeRange: true,
      pricingType: true,
      supplierTags: true,
      bulkDiscountAvailable: true,
      district: true,
      area: true,
      serviceArea: true,
      serviceRadiusKm: true,
      yearsInBusiness: true,
      _count: { select: { inventory: true } },
    },
    take: RECOMMENDATION_LIMIT,
  });

  const scored = suppliers
    .map((s) => ({
      ...s,
      matchScore: calculateMatchScore(buyer, s),
    }))
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);

  return scored.map((s) => ({
    ...toSupplierSummary(s, s.matchScore),
    productCount: s._count?.inventory ?? 0,
  }));
}

export async function searchSuppliers(filters: SupplierSearchFilters): Promise<SupplierSearchResponse> {
  const session = await auth();
  const userId = session?.user?.id;

  const where: Prisma.UserWhereInput = {
    id: userId ? { not: userId } : undefined,
    OR: [
      { role: "SUPPLIER" },
      { role: "BOTH" },
    ],
    isActive: true,
  };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { businessName: { contains: filters.search, mode: "insensitive" } },
      { district: { contains: filters.search, mode: "insensitive" } },
      { area: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters.category) {
    where.primaryCategory = filters.category as any;
  }
  if (filters.district) {
    where.district = filters.district;
  }
  if (filters.pricingType) {
    where.pricingType = filters.pricingType as any;
  }
  if (filters.deliveryTime) {
    where.deliveryTimeRange = filters.deliveryTime as any;
  }
  if (filters.minRating !== undefined) {
    where.avgRating = { gte: filters.minRating };
  }
  if (filters.tags && filters.tags.length > 0) {
    where.supplierTags = { hasSome: filters.tags as SupplierTag[] };
  }
  if (filters.bulkDiscount === true) {
    where.bulkDiscountAvailable = true;
  }

  const pageSize = filters.limit ?? DEFAULT_PAGE_SIZE;
  const offset = filters.offset ?? 0;

  const [rows, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        businessName: true,
        profileImage: true,
        primaryCategory: true,
        avgRating: true,
        totalTransactions: true,
        isVerified: true,
        deliveryTimeRange: true,
        pricingType: true,
        supplierTags: true,
        bulkDiscountAvailable: true,
        district: true,
        area: true,
        serviceArea: true,
        serviceRadiusKm: true,
        yearsInBusiness: true,
        _count: { select: { inventory: true } },
      },
      orderBy: filters.sort === "rating"
        ? { avgRating: "desc" }
        : filters.sort === "delivery"
          ? { deliveryTimeRange: "asc" }
          : filters.sort === "transactions"
            ? { totalTransactions: "desc" }
            : { avgRating: "desc" },
      take: pageSize,
      skip: offset,
    }),
    prisma.user.count({ where }),
  ]);

  const buyer = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { primaryCategory: true, district: true, pricingPreference: true, maxDeliveryTime: true },
      })
    : null;

  const items: SupplierSummary[] = rows.map((s) => {
    const score = buyer
      ? calculateMatchScore(buyer, s)
      : 0;
    return toSupplierSummary(s, score);
  });

  if (buyer) {
    items.sort((a, b) => b.matchScore - a.matchScore);
  }

  const categoryCounts = new Map<string, number>();
  const districtCounts = new Map<string, number>();
  for (const s of rows) {
    if (s.primaryCategory) {
      categoryCounts.set(s.primaryCategory, (categoryCounts.get(s.primaryCategory) ?? 0) + 1);
    }
    if (s.district) {
      districtCounts.set(s.district, (districtCounts.get(s.district) ?? 0) + 1);
    }
  }

  return {
    items,
    totalCount,
    filters: {
      categories: Array.from(categoryCounts.entries()).map(([value, count]) => ({ value, count })),
      districts: Array.from(districtCounts.entries()).map(([value, count]) => ({ value, count })),
    },
  };
}

export async function getSupplierProfile(supplierId: string): Promise<SupplierDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;

  const supplier = await prisma.user.findFirst({
    where: {
      id: supplierId,
      OR: [
        { role: "SUPPLIER" },
        { role: "BOTH" },
      ],
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      profileImage: true,
      primaryCategory: true,
      subCategories: true,
      avgRating: true,
      totalTransactions: true,
      isVerified: true,
      deliveryTimeRange: true,
      pricingType: true,
      supplierTags: true,
      bulkDiscountAvailable: true,
      district: true,
      area: true,
      serviceArea: true,
      serviceRadiusKm: true,
      businessType: true,
      businessSize: true,
      yearsInBusiness: true,
      deliveryMethod: true,
      orderCapacity: true,
      minOrderValue: true,
      maxOrderValue: true,
      paymentTerms: true,
      businessRegistrationId: true,
      lastActiveAt: true,
      _count: { select: { inventory: true } },
    },
  });

  if (!supplier) return null;

  const products = await prisma.product.findMany({
    where: {
      ownerId: supplierId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      description: true,
      category: true,
      sellingPrice: true,
      costPrice: true,
      imageLink: true,
      unit: true,
      quantity: true,
      minStock: true,
      expiryDate: true,
      batchNumber: true,
      barcode: true,
      sku: true,
      isActive: true,
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  const buyer = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { primaryCategory: true, district: true, pricingPreference: true, maxDeliveryTime: true },
      })
    : null;

  const matchScore = buyer
    ? calculateMatchScore(buyer, supplier)
    : 0;

  return {
    id: supplier.id,
    businessName: supplier.businessName,
    name: supplier.name,
    profileImage: supplier.profileImage,
    primaryCategory: supplier.primaryCategory,
    avgRating: supplier.avgRating,
    totalTransactions: supplier.totalTransactions,
    isVerified: supplier.isVerified,
    deliveryTimeRange: supplier.deliveryTimeRange,
    pricingType: supplier.pricingType,
    supplierTags: supplier.supplierTags,
    bulkDiscountAvailable: supplier.bulkDiscountAvailable,
    district: supplier.district,
    area: supplier.area,
    serviceArea: supplier.serviceArea,
    serviceRadiusKm: supplier.serviceRadiusKm,
    productCount: supplier._count?.inventory ?? 0,
    matchScore,
    businessType: supplier.businessType,
    businessSize: supplier.businessSize,
    yearsInBusiness: supplier.yearsInBusiness,
    deliveryMethod: supplier.deliveryMethod,
    orderCapacity: supplier.orderCapacity,
    minOrderValue: supplier.minOrderValue,
    maxOrderValue: supplier.maxOrderValue,
    paymentTerms: supplier.paymentTerms,
    businessRegistrationId: supplier.businessRegistrationId,
    lastActiveAt: supplier.lastActiveAt?.toISOString() ?? null,
    subCategories: supplier.subCategories,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      imageLink: p.imageLink,
      unit: p.unit,
      quantity: p.quantity,
      minStock: p.minStock,
      expiryDate: p.expiryDate?.toISOString() ?? null,
      batchNumber: p.batchNumber,
      barcode: p.barcode,
      sku: p.sku,
      isActive: p.isActive,
    })),
  };
}

export async function getRestockSuggestions(productIds?: string[]): Promise<RestockSuggestion[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { primaryCategory: true, district: true, pricingPreference: true, maxDeliveryTime: true },
  });
  if (!buyer) return [];

  const productFilter = productIds && productIds.length > 0
    ? Prisma.sql`AND p.id = ANY(${productIds})`
    : Prisma.sql``;

  const lowStockRaw = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      category: string | null;
      quantity: number;
      minStock: number | null;
    }>
  >`
    SELECT
      p.id,
      p.name,
      p.category,
      p.quantity,
      p."minStock"
    FROM "Product" p
    WHERE p."ownerId" = ${userId}
      AND p."isActive" = true
      AND p."minStock" IS NOT NULL
      AND p.quantity > 0
      AND p.quantity <= p."minStock"
      ${productFilter}
    ORDER BY (p.quantity::float / NULLIF(p."minStock", 0)::float) ASC
    LIMIT 20
  `;

  if (lowStockRaw.length === 0) return [];

  const lowCategories = [...new Set(lowStockRaw.map((p) => p.category).filter(Boolean))];

  const suppliers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { role: "SUPPLIER" },
        { role: "BOTH" },
      ],
      isActive: true,
      isVerified: true,
      primaryCategory: lowCategories.length > 0 ? { in: lowCategories as any } : undefined,
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      profileImage: true,
      primaryCategory: true,
      avgRating: true,
      totalTransactions: true,
      isVerified: true,
      deliveryTimeRange: true,
      pricingType: true,
      supplierTags: true,
      bulkDiscountAvailable: true,
      district: true,
      area: true,
      serviceArea: true,
      serviceRadiusKm: true,
      yearsInBusiness: true,
      _count: { select: { inventory: true } },
    },
    take: 30,
  });

  const scoredSuppliers = suppliers.map((s) => ({
    ...s,
    matchScore: calculateMatchScore(buyer, s),
  })).filter((s) => s.matchScore > 0).sort((a, b) => b.matchScore - a.matchScore);

  return lowStockRaw.map((product) => ({
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    suppliers: scoredSuppliers
      .filter((s) => !product.category || s.primaryCategory === product.category || !s.primaryCategory)
      .slice(0, 3)
      .map((s) => toSupplierSummary(s, s.matchScore)),
  }));
}

export async function getBulkDiscountAlerts(): Promise<BulkDiscountAlert[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const buyer = await prisma.user.findUnique({
    where: { id: userId },
    select: { primaryCategory: true },
  });
  if (!buyer) return [];

  const suppliers = await prisma.user.findMany({
    where: {
      id: { not: userId },
      OR: [
        { role: "SUPPLIER" },
        { role: "BOTH" },
      ],
      isActive: true,
      isVerified: true,
      bulkDiscountAvailable: true,
      ...(buyer.primaryCategory
        ? { primaryCategory: buyer.primaryCategory as any }
        : {}),
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      primaryCategory: true,
      supplierTags: true,
      avgRating: true,
    },
    orderBy: { avgRating: "desc" },
    take: 10,
  });

  return suppliers.map((s) => ({
    supplierId: s.id,
    supplierName: s.name,
    supplierBusinessName: s.businessName,
    category: s.primaryCategory,
    supplierTags: s.supplierTags,
    avgRating: s.avgRating,
  }));
}

export async function getSupplierDistricts(): Promise<string[]> {
  const rows = await prisma.user.findMany({
    where: {
      OR: [{ role: "SUPPLIER" }, { role: "BOTH" }],
      isActive: true,
      district: { not: null },
    },
    select: { district: true },
    distinct: ["district"],
  });
  return rows.map((r) => r.district!).filter(Boolean);
}

export async function getSupplierCategories(): Promise<{ value: string; count: number }[]> {
  const rows = await prisma.$queryRaw<
    Array<{ value: string; count: number }>
  >`
    SELECT "primaryCategory" as value, COUNT(*)::int as count
    FROM "User"
    WHERE ("role" = 'SUPPLIER' OR "role" = 'BOTH')
      AND "isActive" = true
      AND "primaryCategory" IS NOT NULL
    GROUP BY "primaryCategory"
    ORDER BY count DESC
  `;
  return rows;
}

export interface PublicProductDetail {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  sellingPrice: number;
  costPrice: number;
  imageLink: string | null;
  unit: string;
  quantity: number;
  minStock: number | null;
  expiryDate: string | null;
  batchNumber: string | null;
  barcode: string | null;
  sku: string | null;
  isActive: boolean;
  salesLast30Days: number;
  supplierId: string;
  supplierName: string;
  supplierBusinessName: string | null;
  supplierAvgRating: number;
  supplierDistrict: string | null;
  supplierArea: string | null;
}

export async function getSupplierProductDetail(productId: string): Promise<PublicProductDetail | null> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [product, salesAgg] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        sellingPrice: true,
        costPrice: true,
        imageLink: true,
        unit: true,
        quantity: true,
        minStock: true,
        expiryDate: true,
        batchNumber: true,
        barcode: true,
        sku: true,
        isActive: true,
        owner: {
          select: {
            id: true,
            name: true,
            businessName: true,
            avgRating: true,
            district: true,
            area: true,
          },
        },
      },
    }),
    prisma.saleItem.aggregate({
      where: {
        productId,
        sale: { createdAt: { gte: thirtyDaysAgo } },
      },
      _sum: { quantity: true },
    }),
  ]);

  if (!product || !product.isActive) return null;

  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    imageLink: product.imageLink,
    unit: product.unit,
    quantity: product.quantity,
    minStock: product.minStock,
    expiryDate: product.expiryDate?.toISOString() ?? null,
    batchNumber: product.batchNumber,
    barcode: product.barcode,
    sku: product.sku,
    isActive: product.isActive,
    salesLast30Days: salesAgg._sum.quantity ?? 0,
    supplierId: product.owner.id,
    supplierName: product.owner.name,
    supplierBusinessName: product.owner.businessName,
    supplierAvgRating: product.owner.avgRating,
    supplierDistrict: product.owner.district,
    supplierArea: product.owner.area,
  };
}

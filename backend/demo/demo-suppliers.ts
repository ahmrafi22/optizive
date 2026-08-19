import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import type {
  SupplierSummary,
  SupplierDetail,
  SupplierSearchFilters,
  SupplierSearchResponse,
  RestockSuggestion,
  BulkDiscountAlert,
} from "@/backend/supplier-recommender/types";
import type { PublicProfile, RatingDetail } from "@/backend/rating/rating";
import type { SerializedUser, ProfileUpdatePayload } from "@/backend/user/user";
import type { StoreStats, StoreInfo, ApiHit } from "@/backend/store/store";

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

function scoreDelivery(buyerMaxDeliveryTime: string | null, supplierDeliveryTime: string | null): number {
  if (!buyerMaxDeliveryTime || !supplierDeliveryTime) return 50;
  const buyerScore = DELIVERY_SPEED_SCORES[buyerMaxDeliveryTime] ?? 50;
  const supplierScore = DELIVERY_SPEED_SCORES[supplierDeliveryTime] ?? 50;
  if (supplierScore >= buyerScore) return 100;
  return clamp((supplierScore / Math.max(buyerScore, 1)) * 100, 0, 100);
}

function scorePricing(buyerPreference: string | null, supplierPricing: string | null): number {
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
  const txScore = clamp((Math.log10(totalTransactions + 1) / 3) * 100, 0, 100);
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
  supplier: any,
): number {
  const catScore = scoreCategory(buyer.primaryCategory, supplier.primaryCategory);
  const locScore = scoreLocation(buyer.district, supplier.district, supplier.serviceArea, supplier.serviceRadiusKm);
  const delScore = scoreDelivery(buyer.maxDeliveryTime, supplier.deliveryTimeRange);
  const priceScore = scorePricing(buyer.pricingPreference, supplier.pricingType);
  const trustScore = scoreTrust(supplier.avgRating, supplier.isVerified, supplier.totalTransactions, supplier.yearsInBusiness);
  const tagScore = scoreTags(supplier.supplierTags ?? [], supplier.bulkDiscountAvailable);
  return Math.round(
    catScore * 0.30 +
      locScore * 0.20 +
      priceScore * 0.15 +
      delScore * 0.15 +
      trustScore * 0.10 +
      tagScore * 0.10,
  );
}

function toSupplierSummary(s: any, matchScore: number): SupplierSummary {
  return {
    id: s.id,
    businessName: s.businessName,
    name: s.name,
    profileImage: s.profileImage,
    primaryCategory: s.primaryCategory,
    avgRating: s.avgRating,
    totalTransactions: s.totalTransactions,
    isVerified: s.isVerified,
    deliveryTimeRange: s.deliveryTimeRange,
    pricingType: s.pricingType,
    supplierTags: s.supplierTags ?? [],
    bulkDiscountAvailable: s.bulkDiscountAvailable,
    district: s.district,
    area: s.area,
    serviceArea: s.serviceArea,
    serviceRadiusKm: s.serviceRadiusKm,
    productCount: getDemoStore().products.filter((p) => p.ownerId === s.id && p.isActive).length,
    matchScore,
  };
}

function demoBuyerProfile() {
  const u = getDemoStore().users.find((x) => x.id === DEMO_USER_ID);
  return {
    primaryCategory: u?.primaryCategory ?? null,
    district: u?.district ?? null,
    pricingPreference: u?.pricingPreference ?? null,
    maxDeliveryTime: u?.maxDeliveryTime ?? null,
  };
}

function demoSuppliers() {
  return getDemoStore().users.filter(
    (u) => u.id !== DEMO_USER_ID && (u.role === "SUPPLIER" || u.role === "BOTH") && u.isActive,
  );
}

export function demoGetSupplierRecommendations(limit = 6): SupplierSummary[] {
  const buyer = demoBuyerProfile();
  return demoSuppliers()
    .map((s) => ({ ...s, matchScore: calculateMatchScore(buyer, s) }))
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit)
    .map((s) => toSupplierSummary(s, s.matchScore));
}

export function demoSearchSuppliers(filters: SupplierSearchFilters): SupplierSearchResponse {
  let rows = demoSuppliers();

  if (filters.search) {
    const q = filters.search.toLowerCase();
    rows = rows.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.businessName?.toLowerCase().includes(q) ||
        s.district?.toLowerCase().includes(q) ||
        s.area?.toLowerCase().includes(q),
    );
  }
  if (filters.category) rows = rows.filter((s) => s.primaryCategory === filters.category);
  if (filters.district) rows = rows.filter((s) => s.district === filters.district);
  if (filters.pricingType) rows = rows.filter((s) => s.pricingType === filters.pricingType);
  if (filters.deliveryTime) rows = rows.filter((s) => s.deliveryTimeRange === filters.deliveryTime);
  const minRating = filters.minRating;
  if (minRating !== undefined) rows = rows.filter((s) => s.avgRating >= minRating);
  if (filters.tags && filters.tags.length > 0)
    rows = rows.filter((s) => (s.supplierTags ?? []).some((t: string) => filters.tags!.includes(t)));
  if (filters.bulkDiscount === true) rows = rows.filter((s) => s.bulkDiscountAvailable);

  const pageSize = filters.limit ?? 20;
  const offset = filters.offset ?? 0;
  const totalCount = rows.length;

  const buyer = demoBuyerProfile();
  const items = rows.map((s) => toSupplierSummary(s, calculateMatchScore(buyer, s)));
  items.sort((a, b) => b.matchScore - a.matchScore);

  const categoryCounts = new Map<string, number>();
  const districtCounts = new Map<string, number>();
  for (const s of rows) {
    if (s.primaryCategory) categoryCounts.set(s.primaryCategory, (categoryCounts.get(s.primaryCategory) ?? 0) + 1);
    if (s.district) districtCounts.set(s.district, (districtCounts.get(s.district) ?? 0) + 1);
  }

  return {
    items: items.slice(offset, offset + pageSize),
    totalCount,
    filters: {
      categories: Array.from(categoryCounts.entries()).map(([value, count]) => ({ value, count })),
      districts: Array.from(districtCounts.entries()).map(([value, count]) => ({ value, count })),
    },
  };
}

export function demoGetSupplierProfile(supplierId: string): SupplierDetail | null {
  const store = getDemoStore();
  const supplier = demoSuppliers().find((s) => s.id === supplierId);
  if (!supplier) return null;

  const salesCount = store.sales.filter((s) => s.ownerId === supplierId).length;
  const purchasesCount = store.sales.filter((s) => s.buyerId === supplierId).length;
  const buyer = demoBuyerProfile();

  const products = store.products
    .filter((p) => p.ownerId === supplierId && p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .slice(0, 50)
    .map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      category: p.category ?? null,
      sellingPrice: p.sellingPrice,
      costPrice: p.costPrice,
      imageLink: p.imageLink ?? null,
      unit: p.unit,
      quantity: p.quantity,
      minStock: p.minStock ?? null,
      expiryDate: p.expiryDate ? p.expiryDate.toISOString() : null,
      batchNumber: p.batchNumber ?? null,
      barcode: p.barcode ?? null,
      sku: p.sku ?? null,
      isActive: p.isActive,
    }));

  return {
    id: supplier.id,
    businessName: supplier.businessName,
    name: supplier.name,
    profileImage: supplier.profileImage,
    primaryCategory: supplier.primaryCategory,
    avgRating: supplier.avgRating,
    totalTransactions: salesCount + purchasesCount,
    isVerified: supplier.isVerified,
    deliveryTimeRange: supplier.deliveryTimeRange,
    pricingType: supplier.pricingType,
    supplierTags: supplier.supplierTags ?? [],
    bulkDiscountAvailable: supplier.bulkDiscountAvailable,
    district: supplier.district,
    area: supplier.area,
    serviceArea: supplier.serviceArea,
    serviceRadiusKm: supplier.serviceRadiusKm,
    productCount: products.length,
    matchScore: calculateMatchScore(buyer, supplier),
    businessType: supplier.businessType,
    businessSize: supplier.businessSize,
    yearsInBusiness: supplier.yearsInBusiness,
    deliveryMethod: supplier.deliveryMethod,
    orderCapacity: supplier.orderCapacity,
    minOrderValue: supplier.minOrderValue,
    maxOrderValue: supplier.maxOrderValue,
    paymentTerms: supplier.paymentTerms,
    businessRegistrationId: supplier.businessRegistrationId,
    lastActiveAt: supplier.lastActiveAt ? supplier.lastActiveAt.toISOString() : null,
    subCategories: supplier.subCategories ?? [],
    products,
  };
}

export function demoGetRestockSuggestions(productIds?: string[]): RestockSuggestion[] {
  const store = getDemoStore();
  const lowStock = store.products
    .filter(
      (p) =>
        p.ownerId === DEMO_USER_ID &&
        p.isActive &&
        p.minStock !== null &&
        p.quantity > 0 &&
        p.quantity <= p.minStock &&
        (!productIds || productIds.length === 0 || productIds.includes(p.id)),
    )
    .sort((a, b) => a.quantity / a.minStock - b.quantity / b.minStock)
    .slice(0, 20);

  if (lowStock.length === 0) return [];

  const lowCategories = [...new Set(lowStock.map((p) => p.category).filter(Boolean))];
  const buyer = demoBuyerProfile();
  const suppliers = demoSuppliers()
    .filter((s) => s.isVerified && (!lowCategories.length || lowCategories.includes(s.primaryCategory)))
    .map((s) => ({ ...s, matchScore: calculateMatchScore(buyer, s) }))
    .filter((s) => s.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);

  return lowStock.map((product) => ({
    productId: product.id,
    productName: product.name,
    productCategory: product.category ?? null,
    suppliers: suppliers
      .filter((s) => !product.category || s.primaryCategory === product.category || !s.primaryCategory)
      .slice(0, 3)
      .map((s) => toSupplierSummary(s, s.matchScore)),
  }));
}

export function demoGetBulkDiscountAlerts(): BulkDiscountAlert[] {
  const buyer = demoBuyerProfile();
  return demoSuppliers()
    .filter((s) => s.isVerified && s.bulkDiscountAvailable && (!buyer.primaryCategory || s.primaryCategory === buyer.primaryCategory))
    .sort((a, b) => b.avgRating - a.avgRating)
    .slice(0, 10)
    .map((s) => ({
      supplierId: s.id,
      supplierName: s.name,
      supplierBusinessName: s.businessName,
      category: s.primaryCategory,
      supplierTags: s.supplierTags ?? [],
      avgRating: s.avgRating,
    }));
}

export function demoGetSupplierDistricts(): string[] {
  return [...new Set(demoSuppliers().map((s) => s.district).filter(Boolean))] as string[];
}

export function demoGetSupplierCategories(): { value: string; count: number }[] {
  const counts = new Map<string, number>();
  demoSuppliers().forEach((s) => {
    if (s.primaryCategory) counts.set(s.primaryCategory, (counts.get(s.primaryCategory) ?? 0) + 1);
  });
  return Array.from(counts.entries())
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count);
}

export function demoGetSupplierProductDetail(productId: string): any {
  const store = getDemoStore();
  const product = store.products.find((p) => p.id === productId && p.isActive);
  if (!product) return null;
  const owner = store.users.find((u) => u.id === product.ownerId);
  const start = Date.now() - 30 * 86400000;
  let salesLast30Days = 0;
  store.saleItems.forEach((it) => {
    if (it.productId !== productId) return;
    const sale = store.sales.find((s) => s.id === it.saleId);
    if (sale && sale.createdAt.getTime() >= start) salesLast30Days += it.quantity;
  });
  return {
    id: product.id,
    name: product.name,
    description: product.description ?? null,
    category: product.category ?? null,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    imageLink: product.imageLink ?? null,
    unit: product.unit,
    quantity: product.quantity,
    minStock: product.minStock ?? null,
    expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
    batchNumber: product.batchNumber ?? null,
    barcode: product.barcode ?? null,
    sku: product.sku ?? null,
    isActive: product.isActive,
    salesLast30Days,
    supplierId: owner?.id ?? "",
    supplierName: owner?.name ?? "",
    supplierBusinessName: owner?.businessName ?? null,
    supplierAvgRating: owner?.avgRating ?? 0,
    supplierDistrict: owner?.district ?? null,
    supplierArea: owner?.area ?? null,
  };
}

// ---------------------------------------------------------------------------
// Rating + public profile
// ---------------------------------------------------------------------------

function serializePublicProfile(u: any): PublicProfile {
  const store = getDemoStore();
  const ratings = store.ratings.filter((r) => r.rateeId === u.id);
  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach((r) => {
    breakdown[r.score] = (breakdown[r.score] ?? 0) + 1;
  });
  return {
    id: u.id,
    name: u.name,
    phone: u.phone ?? null,
    email: u.email ?? null,
    username: u.username ?? null,
    profileImage: u.profileImage ?? null,
    businessName: u.businessName ?? null,
    role: u.role,
    businessType: u.businessType ?? null,
    businessSize: u.businessSize ?? null,
    district: u.district ?? null,
    area: u.area ?? null,
    primaryCategory: u.primaryCategory ?? null,
    subCategories: u.subCategories ?? [],
    isVerified: u.isVerified,
    yearsInBusiness: u.yearsInBusiness ?? null,
    avgRating: u.avgRating ?? 0,
    totalTransactions:
      (u.totalTransactions ?? 0) +
      store.sales.filter((s) => s.ownerId === u.id).length +
      store.sales.filter((s) => s.buyerId === u.id).length,
    businessRegistrationId: u.businessRegistrationId ?? null,
    paymentTerms: u.paymentTerms ?? null,
    minOrderValue: u.minOrderValue ?? null,
    maxOrderValue: u.maxOrderValue ?? null,
    isActive: u.isActive,
    lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    monthlyPurchaseRange: u.monthlyPurchaseRange ?? null,
    pricingPreference: u.pricingPreference ?? null,
    negotiationPreference: u.negotiationPreference ?? null,
    maxDeliveryTime: u.maxDeliveryTime ?? null,
    preferredDistance: u.preferredDistance ?? null,
    buyingPriority: u.buyingPriority ?? null,
    restockFrequency: u.restockFrequency ?? null,
    serviceArea: u.serviceArea ?? null,
    serviceRadiusKm: u.serviceRadiusKm ?? null,
    deliveryMethod: u.deliveryMethod ?? null,
    deliveryTimeRange: u.deliveryTimeRange ?? null,
    pricingType: u.pricingType ?? null,
    bulkDiscountAvailable: u.bulkDiscountAvailable ?? null,
    orderCapacity: u.orderCapacity ?? null,
    supplierTags: u.supplierTags ?? [],
    totalRatings: ratings.length,
    ratingBreakdown: breakdown,
  };
}

export function demoGetPublicProfile(userId: string): PublicProfile | null {
  const u = getDemoStore().users.find((x) => x.id === userId);
  return u ? serializePublicProfile(u) : null;
}

export function demoGetUserRatings(userId: string): RatingDetail[] {
  const store = getDemoStore();
  return store.ratings
    .filter((r) => r.rateeId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50)
    .map((r) => {
      const rater = store.users.find((u) => u.id === r.raterId);
      return {
        id: r.id,
        score: r.score,
        comment: r.comment ?? null,
        createdAt: r.createdAt.toISOString(),
        rater: {
          id: rater?.id ?? r.raterId,
          name: rater?.name ?? "Unknown",
          businessName: rater?.businessName ?? null,
          profileImage: rater?.profileImage ?? null,
        },
      };
    });
}

let demoRatingSeq = { n: 45 };

export function demoSubmitRating(input: { rateeId: string; score: number; comment?: string }): { ok: boolean; message?: string } {
  const store = getDemoStore();
  if (input.rateeId === DEMO_USER_ID) return { ok: false, message: "Cannot rate yourself" };
  const score = Math.round(input.score);
  if (score < 1 || score > 5) return { ok: false, message: "Score must be 1-5" };
  if (!store.users.some((u) => u.id === input.rateeId)) return { ok: false, message: "User not found" };

  const existing = store.ratings.find((r) => r.raterId === DEMO_USER_ID && r.rateeId === input.rateeId);
  if (existing) {
    existing.score = score;
    existing.comment = input.comment?.trim() || null;
  } else {
    store.ratings.push({
      id: `demo-r-${String(++demoRatingSeq.n).padStart(2, "0")}`,
      createdAt: new Date(),
      raterId: DEMO_USER_ID,
      rateeId: input.rateeId,
      score,
      comment: input.comment?.trim() || null,
    });
  }

  const all = store.ratings.filter((r) => r.rateeId === input.rateeId);
  const avg = all.reduce((s, r) => s + r.score, 0) / all.length;
  const ratee = store.users.find((u) => u.id === input.rateeId);
  if (ratee) ratee.avgRating = Math.round(avg * 10) / 10;
  return { ok: true };
}

export function demoHasRatedUser(rateeId: string): boolean {
  return getDemoStore().ratings.some((r) => r.raterId === DEMO_USER_ID && r.rateeId === rateeId);
}

export function demoGetMyRating(rateeId: string): { score: number; comment: string | null } | null {
  const r = getDemoStore().ratings.find((x) => x.raterId === DEMO_USER_ID && x.rateeId === rateeId);
  return r ? { score: r.score, comment: r.comment ?? null } : null;
}

// ---------------------------------------------------------------------------
// User profile
// ---------------------------------------------------------------------------

function serializeDemoUser(u: any): SerializedUser {
  return {
    id: u.id,
    name: u.name,
    phone: u.phone ?? null,
    email: u.email ?? null,
    username: u.username ?? null,
    profileImage: u.profileImage ?? null,
    businessName: u.businessName ?? null,
    role: u.role,
    businessType: u.businessType ?? null,
    businessSize: u.businessSize ?? null,
    district: u.district ?? null,
    area: u.area ?? null,
    primaryCategory: u.primaryCategory ?? null,
    subCategories: u.subCategories ?? [],
    isVerified: u.isVerified,
    yearsInBusiness: u.yearsInBusiness ?? null,
    avgRating: u.avgRating ?? 0,
    totalTransactions:
      (u.totalTransactions ?? 0) +
      getDemoStore().sales.filter((s) => s.ownerId === u.id).length +
      getDemoStore().sales.filter((s) => s.buyerId === u.id).length,
    businessRegistrationId: u.businessRegistrationId ?? null,
    paymentTerms: u.paymentTerms ?? null,
    minOrderValue: u.minOrderValue ?? null,
    maxOrderValue: u.maxOrderValue ?? null,
    isActive: u.isActive,
    lastActiveAt: u.lastActiveAt ? u.lastActiveAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    monthlyPurchaseRange: u.monthlyPurchaseRange ?? null,
    pricingPreference: u.pricingPreference ?? null,
    negotiationPreference: u.negotiationPreference ?? null,
    maxDeliveryTime: u.maxDeliveryTime ?? null,
    preferredDistance: u.preferredDistance ?? null,
    buyingPriority: u.buyingPriority ?? null,
    restockFrequency: u.restockFrequency ?? null,
    serviceArea: u.serviceArea ?? null,
    serviceRadiusKm: u.serviceRadiusKm ?? null,
    deliveryMethod: u.deliveryMethod ?? null,
    deliveryTimeRange: u.deliveryTimeRange ?? null,
    pricingType: u.pricingType ?? null,
    bulkDiscountAvailable: u.bulkDiscountAvailable ?? null,
    orderCapacity: u.orderCapacity ?? null,
    supplierTags: u.supplierTags ?? [],
  };
}

export function demoGetProfile(): SerializedUser | null {
  const u = getDemoStore().users.find((x) => x.id === DEMO_USER_ID);
  return u ? serializeDemoUser(u) : null;
}

export function demoUpdateProfile(payload: ProfileUpdatePayload): { ok: boolean; message?: string } {
  const store = getDemoStore();
  const u = store.users.find((x) => x.id === DEMO_USER_ID);
  if (!u) return { ok: false, message: "Unauthorized" };
  const name = payload.name?.trim();
  if (!name) return { ok: false, message: "Name is required" };

  const nullableString = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    return typeof v === "string" ? v.trim() : null;
  };
  const nullableNumber = (v: unknown) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };
  const nullableBoolean = (v: unknown) => {
    if (v === null || v === undefined || v === "") return null;
    if (v === true || v === false) return v;
    if (v === "true") return true;
    if (v === "false") return false;
    return null;
  };

  u.name = name;
  u.phone = nullableString(payload.phone);
  u.email = nullableString(payload.email);
  u.username = nullableString(payload.username);
  u.businessName = nullableString(payload.businessName);
  u.businessType = nullableString(payload.businessType);
  u.businessSize = nullableString(payload.businessSize);
  u.district = nullableString(payload.district);
  u.area = nullableString(payload.area);
  u.primaryCategory = nullableString(payload.primaryCategory);
  if (Array.isArray(payload.subCategories)) u.subCategories = payload.subCategories;
  u.yearsInBusiness = nullableNumber(payload.yearsInBusiness);
  u.businessRegistrationId = nullableString(payload.businessRegistrationId);
  u.paymentTerms = nullableString(payload.paymentTerms);
  u.minOrderValue = nullableNumber(payload.minOrderValue);
  u.maxOrderValue = nullableNumber(payload.maxOrderValue);
  u.monthlyPurchaseRange = nullableString(payload.monthlyPurchaseRange);
  u.pricingPreference = nullableString(payload.pricingPreference);
  u.negotiationPreference = nullableString(payload.negotiationPreference);
  u.maxDeliveryTime = nullableString(payload.maxDeliveryTime);
  u.preferredDistance = nullableString(payload.preferredDistance);
  u.buyingPriority = nullableString(payload.buyingPriority);
  u.restockFrequency = nullableString(payload.restockFrequency);
  u.serviceArea = nullableString(payload.serviceArea);
  u.serviceRadiusKm = nullableNumber(payload.serviceRadiusKm);
  u.deliveryMethod = nullableString(payload.deliveryMethod);
  u.deliveryTimeRange = nullableString(payload.deliveryTimeRange);
  u.pricingType = nullableString(payload.pricingType);
  u.bulkDiscountAvailable = nullableBoolean(payload.bulkDiscountAvailable);
  u.orderCapacity = nullableString(payload.orderCapacity);
  if (Array.isArray(payload.supplierTags)) u.supplierTags = payload.supplierTags;
  return { ok: true };
}

export function demoUploadProfileImage(): { ok: boolean; url?: string; message?: string } {
  const u = getDemoStore().users.find((x) => x.id === DEMO_USER_ID);
  if (!u) return { ok: false, message: "Unauthorized" };
  const url = `https://picsum.photos/seed/rafi-ahmed-demo/200/200`;
  u.profileImage = url;
  return { ok: true, url };
}

export function demoDeleteProfileImage(): { ok: boolean; message?: string } {
  const u = getDemoStore().users.find((x) => x.id === DEMO_USER_ID);
  if (!u) return { ok: false, message: "Unauthorized" };
  u.profileImage = null;
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Store management (API keys, branches, logs)
// ---------------------------------------------------------------------------

export function demoGetUserStores(): StoreStats {
  const store = getDemoStore();
  const stores = store.stores.filter((s) => s.ownerId === DEMO_USER_ID);
  const logs = store.apiLogs.filter((l) => stores.some((s) => s.id === l.storeId));
  const user = store.users.find((u) => u.id === DEMO_USER_ID);

  const recentHits: ApiHit[] = logs
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10)
    .map((l) => ({
      id: l.id,
      endpoint: l.endpoint,
      method: l.method,
      statusCode: l.statusCode,
      createdAt: l.createdAt.toISOString(),
    }));

  return {
    totalStores: stores.length,
    activeStores: stores.filter((s) => s.isActive).length,
    totalApiHits: logs.length,
    errorHits: logs.filter((l) => l.statusCode >= 400).length,
    recentHits,
    businessSlug: user?.businessSlug ?? null,
    stores: stores.map((s): StoreInfo => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      apiKey: s.apiKey,
      isActive: s.isActive,
      termsAccepted: s.termsAccepted,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

export function demoEnsureMainStore(): StoreStats {
  return demoGetUserStores();
}

export function demoCreateStore(name: string): { success: boolean; error?: string; store?: StoreInfo } {
  const store = getDemoStore();
  if (!name || name.trim().length < 2) {
    return { success: false, error: "Branch name must be at least 2 characters" };
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  if (!slug) return { success: false, error: "Invalid branch name" };

  const existing = store.stores.find((s) => s.ownerId === DEMO_USER_ID && s.slug === slug);
  const finalSlug = existing ? `${slug}-${Math.random().toString(16).slice(2, 6)}` : slug;

  const created = {
    id: `demo-store-${store.stores.length + 1}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    ownerId: DEMO_USER_ID,
    name: name.trim(),
    slug: finalSlug,
    apiKey: `sk_demo_${Math.random().toString(16).slice(2, 50)}`,
    isActive: false,
    termsAccepted: false,
  };
  store.stores.push(created);

  return {
    success: true,
    store: {
      id: created.id,
      name: created.name,
      slug: created.slug,
      apiKey: created.apiKey,
      isActive: created.isActive,
      termsAccepted: created.termsAccepted,
      createdAt: created.createdAt.toISOString(),
    },
  };
}

export function demoUpdateBusinessSlug(newSlug: string): { success: boolean; error?: string } {
  const slug = newSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
  if (!slug || slug.length < 2) return { success: false, error: "Slug must be at least 2 characters" };
  const store = getDemoStore();
  const taken = store.users.some((u) => u.businessSlug === slug && u.id !== DEMO_USER_ID);
  if (taken) return { success: false, error: "This business slug is already taken" };
  const user = store.users.find((u) => u.id === DEMO_USER_ID);
  if (user) user.businessSlug = slug;
  return { success: true };
}

export function demoAcceptTerms(storeId: string): { success: boolean; error?: string } {
  const store = getDemoStore();
  const s = store.stores.find((x) => x.id === storeId && x.ownerId === DEMO_USER_ID);
  if (!s) return { success: false, error: "Store not found" };
  s.termsAccepted = true;
  s.isActive = true;
  return { success: true };
}

export function demoToggleStoreStatus(storeId: string, isActive: boolean): { success: boolean; error?: string } {
  const store = getDemoStore();
  const s = store.stores.find((x) => x.id === storeId && x.ownerId === DEMO_USER_ID);
  if (!s) return { success: false, error: "Store not found" };
  if (isActive && !s.termsAccepted) return { success: false, error: "Terms must be accepted first" };
  s.isActive = isActive;
  return { success: true };
}

export function demoRegenerateApiKey(storeId: string): { success: boolean; error?: string; apiKey?: string } {
  const store = getDemoStore();
  const s = store.stores.find((x) => x.id === storeId && x.ownerId === DEMO_USER_ID);
  if (!s) return { success: false, error: "Store not found" };
  const apiKey = `sk_demo_${Math.random().toString(16).slice(2, 50)}`;
  s.apiKey = apiKey;
  return { success: true, apiKey };
}

export function demoDeleteStore(storeId: string): { success: boolean; error?: string } {
  const store = getDemoStore();
  const idx = store.stores.findIndex((x) => x.id === storeId && x.ownerId === DEMO_USER_ID);
  if (idx === -1) return { success: false, error: "Store not found" };
  store.stores.splice(idx, 1);
  store.apiLogs = store.apiLogs.filter((l) => l.storeId !== storeId);
  return { success: true };
}
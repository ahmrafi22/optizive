import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import { getExpiryStatus } from "@/backend/expiry-utils";
import type { ExpiryStatus } from "@/backend/expiry-utils";
import type {
  InventoryProduct,
  InventoryQuery,
  InventoryResponse,
  InventoryStats,
  InventoryStockStatus,
  UpdateProductPayload,
  CreateProductPayload,
  ProductSalesData,
  MonthlyComparisonData,
} from "@/backend/inventory/inventory";
import type {
  ExpiryProduct,
  ExpiryDashboardStats,
  ClearanceSuggestion,
} from "@/backend/expiry-tracker/expiry-tracker";
import type { PublicProduct, PublicSalesData } from "@/backend/inventory/public";

const DAY = 86400000;

function getStockStatus(p: {
  isActive: boolean;
  quantity: number;
  minStock: number | null;
}): InventoryStockStatus {
  if (!p.isActive) return "INACTIVE";
  if (p.quantity <= 0) return "OUT_OF_STOCK";
  if (p.minStock !== null && p.quantity <= p.minStock) return "LOW_STOCK";
  return "IN_STOCK";
}

function serializeProduct(p: any): InventoryProduct {
  const expiryDateStr = p.expiryDate ? p.expiryDate.toISOString() : null;
  const margin = Number((p.sellingPrice - p.costPrice).toFixed(2));
  const value = Number((p.sellingPrice * p.quantity).toFixed(2));
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    category: p.category ?? null,
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice,
    quantity: p.quantity,
    unit: p.unit,
    minStock: p.minStock ?? null,
    sku: p.sku ?? null,
    barcode: p.barcode ?? null,
    imageLink: p.imageLink ?? null,
    isActive: p.isActive,
    expiryDate: expiryDateStr,
    batchNumber: p.batchNumber ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    stockStatus: getStockStatus(p),
    expiryStatus: getExpiryStatus(expiryDateStr),
    daysUntilExpiry: expiryDateStr
      ? Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / DAY)
      : null,
    margin,
    value,
  };
}

function buildSalesHistoryForProducts(productIds: string[], days: number) {
  const store = getDemoStore();
  const historyMap = new Map<string, ProductSalesData[]>();
  if (productIds.length === 0) return historyMap;

  const start = Date.now() - days * DAY;
  const grouped = new Map<string, Map<string, { sales: number; revenue: number }>>();

  store.saleItems.forEach((it) => {
    if (!productIds.includes(it.productId)) return;
    const sale = store.sales.find((s) => s.id === it.saleId);
    if (!sale || sale.ownerId !== DEMO_USER_ID) return;
    const t = sale.createdAt.getTime();
    if (t < start) return;
    const key = sale.createdAt.toISOString().split("T")[0];
    const productMap = grouped.get(it.productId) ?? new Map();
    const entry = productMap.get(key) ?? { sales: 0, revenue: 0 };
    entry.sales += it.quantity;
    entry.revenue += it.totalPrice ?? 0;
    productMap.set(key, entry);
    grouped.set(it.productId, productMap);
  });

  productIds.forEach((productId) => {
    const dataMap = grouped.get(productId) ?? new Map();
    const series: ProductSalesData[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const key = d.toISOString().split("T")[0];
      const data = dataMap.get(key) ?? { sales: 0, revenue: 0 };
      series.push({ date: key, sales: data.sales, revenue: data.revenue });
    }
    historyMap.set(productId, series);
  });

  return historyMap;
}

export function demoGetInventoryStats(): InventoryStats {
  const store = getDemoStore();
  const products = store.products.filter((p) => p.ownerId === DEMO_USER_ID);
  const now = Date.now();
  const sevenDays = now + 7 * DAY;

  let totalValue = 0, lowStock = 0, outOfStock = 0, inactive = 0, expiringSoon = 0, expired = 0;
  products.forEach((p) => {
    totalValue += (p.sellingPrice ?? 0) * p.quantity;
    if (!p.isActive) inactive++;
    else {
      if (p.quantity <= 0) outOfStock++;
      else if (p.minStock !== null && p.quantity <= p.minStock) lowStock++;
      if (p.expiryDate) {
        const t = p.expiryDate.getTime();
        if (t <= now) expired++;
        else if (t <= sevenDays) expiringSoon++;
      }
    }
  });

  return {
    totalValue: Math.round(totalValue * 100) / 100,
    totalProducts: products.length,
    lowStock,
    outOfStock,
    inactive,
    expiringSoon,
    expired,
  };
}

export function demoListInventoryProducts(query: InventoryQuery): InventoryResponse {
  const store = getDemoStore();
  const search = query.search?.trim() ?? "";
  const category = query.category ?? "ALL";
  const status = query.status ?? "ALL";
  const expiryStatus = query.expiryStatus ?? "ALL";
  const sort = query.sort ?? "updated";
  const order = query.order ?? "desc";
  const activeOnly = query.activeOnly ?? false;
  const baseLimit = query.limit ?? 20;
  const limit = status === "LOW_STOCK" ? Math.min(baseLimit * 3, 100) : Math.min(baseLimit, 100);
  const offset = query.offset ?? 0;

  let items = store.products.filter((p) => p.ownerId === DEMO_USER_ID);

  if (search) {
    const q = search.toLowerCase();
    items = items.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q),
    );
  }
  if (category !== "ALL") items = items.filter((p) => p.category === category);
  const minPrice = query.minPrice ?? undefined;
  const maxPrice = query.maxPrice ?? undefined;
  if (minPrice !== undefined) items = items.filter((p) => p.sellingPrice >= minPrice);
  if (maxPrice !== undefined) items = items.filter((p) => p.sellingPrice <= maxPrice);

  if (status === "INACTIVE") items = items.filter((p) => !p.isActive);
  else if (status === "IN_STOCK") items = items.filter((p) => p.isActive && p.quantity > 0);
  else if (status === "LOW_STOCK")
    items = items.filter((p) => p.isActive && p.minStock !== null && p.quantity > 0 && p.quantity <= p.minStock);
  else if (status === "OUT_OF_STOCK") items = items.filter((p) => p.isActive && p.quantity <= 0);
  else if (activeOnly) items = items.filter((p) => p.isActive);

  if (expiryStatus !== "ALL") {
    const now = Date.now();
    const seven = now + 7 * DAY;
    const thirty = now + 30 * DAY;
    items = items.filter((p) => {
      if (!p.expiryDate) return expiryStatus === "NO_EXPIRY";
      const t = p.expiryDate.getTime();
      if (expiryStatus === "EXPIRED") return t <= now;
      if (expiryStatus === "EXPIRING_SOON") return t > now && t <= seven;
      if (expiryStatus === "EXPIRING") return t > seven && t <= thirty;
      if (expiryStatus === "FRESH") return t > thirty;
      return true;
    });
  }

  const dir = order === "asc" ? 1 : -1;
  items = items.slice().sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name) * dir;
    if (sort === "price") return (a.sellingPrice - b.sellingPrice) * dir;
    if (sort === "quantity") return (a.quantity - b.quantity) * dir;
    if (sort === "expiryDate") {
      const ta = a.expiryDate?.getTime() ?? Infinity;
      const tb = b.expiryDate?.getTime() ?? Infinity;
      return (ta - tb) * dir;
    }
    return (a.updatedAt.getTime() - b.updatedAt.getTime()) * dir;
  });

  const overallCount = items.length;
  const filtered = status === "LOW_STOCK"
    ? items.filter((p) => p.minStock !== null && p.quantity > 0 && p.quantity <= p.minStock)
    : items;
  const totalCount = status === "LOW_STOCK" ? filtered.length : filtered.length;
  const page = filtered.slice(offset, offset + limit);

  const historyMap = buildSalesHistoryForProducts(page.map((p) => p.id), 30);

  return {
    items: page.map((p) => ({ ...serializeProduct(p), salesHistory: historyMap.get(p.id) ?? [] })),
    totalCount,
    overallCount,
    categories: Object.values([
      "GROCERIES", "FMCG", "FRESH_PRODUCE", "AGRO_PRODUCTS", "FISHERY_SEAFOOD",
      "MEAT_POULTRY", "DAIRY", "ELECTRONICS", "MOBILE_ACCESSORIES", "CLOTHING",
      "TEXTILES_APPAREL", "FOOTWEAR", "BEAUTY_PERSONAL_CARE", "HOME_APPLIANCE",
      "FURNITURE", "HARDWARE", "CONSTRUCTION_MATERIALS", "AUTO_PARTS", "PHARMACY",
      "STATIONERY", "OFFICE_SUPPLIES", "PACKAGING", "CHEMICALS", "PLASTICS",
      "RESTAURANT_SUPPLY", "HOSPITALITY_SUPPLY", "OTHER",
    ] as const).map((value) => ({
      value,
      label: String(value).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    })),
  };
}

export function demoGetProductById(productId: string): InventoryProduct | null {
  const store = getDemoStore();
  const p = store.products.find((x) => x.id === productId && x.ownerId === DEMO_USER_ID);
  return p ? serializeProduct(p) : null;
}

export function demoGetProductSalesHistory(productId: string, days = 30): ProductSalesData[] {
  const store = getDemoStore();
  if (!store.products.some((p) => p.id === productId && p.ownerId === DEMO_USER_ID)) return [];
  return buildSalesHistoryForProducts([productId], days).get(productId) ?? [];
}

export function demoGetProductMonthlyComparison(productId: string, months = 6): MonthlyComparisonData[] {
  const store = getDemoStore();
  if (!store.products.some((p) => p.id === productId && p.ownerId === DEMO_USER_ID)) return [];

  const now = new Date();
  const currentMap = new Map<number, number>();
  const previousMap = new Map<number, number>();

  store.saleItems.forEach((it) => {
    if (it.productId !== productId) return;
    const sale = store.sales.find((s) => s.id === it.saleId);
    if (!sale || sale.ownerId !== DEMO_USER_ID) return;
    const d = sale.createdAt;
    if (d > now) return;
    if (d >= new Date(now.getFullYear(), now.getMonth() - months + 1, 1)) {
      currentMap.set(d.getMonth() + 1, (currentMap.get(d.getMonth() + 1) ?? 0) + it.quantity);
    } else if (d >= new Date(now.getFullYear() - 1, now.getMonth() - months + 1, 1)) {
      previousMap.set(d.getMonth() + 1, (previousMap.get(d.getMonth() + 1) ?? 0) + it.quantity);
    }
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const result: MonthlyComparisonData[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push({
      month: monthNames[d.getMonth()],
      current: currentMap.get(d.getMonth() + 1) ?? 0,
      previous: previousMap.get(d.getMonth() + 1) ?? 0,
    });
  }
  return result;
}

let demoProductSeq = { n: 63 };

export function demoCreateProduct(data: CreateProductPayload): InventoryProduct | null {
  const store = getDemoStore();
  const id = `demo-p-${String(++demoProductSeq.n).padStart(2, "0")}`;
  const now = new Date();
  const p = {
    id,
    createdAt: now,
    updatedAt: now,
    ownerId: DEMO_USER_ID,
    supplierId: null,
    name: data.name.trim(),
    description: data.description?.trim() || null,
    barcode: data.barcode?.trim() || null,
    sku: data.sku?.trim() || null,
    category: data.category ?? null,
    imageLink: data.imageBase64 ? `https://picsum.photos/seed/${id}/600/400` : null,
    costPrice: data.costPrice ?? 0,
    sellingPrice: data.sellingPrice,
    quantity: data.quantity ?? 0,
    unit: data.unit ?? "PCS",
    minStock: data.minStock ?? null,
    expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
    batchNumber: data.batchNumber?.trim() || null,
    isActive: data.isActive ?? true,
  };
  store.products.push(p);
  return serializeProduct(p);
}

export function demoUpdateProduct(productId: string, data: UpdateProductPayload): InventoryProduct | null {
  const store = getDemoStore();
  const p = store.products.find((x) => x.id === productId && x.ownerId === DEMO_USER_ID);
  if (!p) return null;

  if (data.name !== undefined) p.name = data.name;
  if (data.description !== undefined) p.description = data.description;
  if (data.category !== undefined) p.category = data.category;
  if (data.sellingPrice !== undefined) p.sellingPrice = data.sellingPrice;
  if (data.costPrice !== undefined) p.costPrice = data.costPrice;
  if (data.quantity !== undefined) p.quantity = data.quantity;
  if (data.unit !== undefined) p.unit = data.unit;
  if (data.minStock !== undefined) p.minStock = data.minStock;
  if (data.sku !== undefined) p.sku = data.sku;
  if (data.barcode !== undefined) p.barcode = data.barcode;
  if (data.expiryDate !== undefined) p.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  if (data.batchNumber !== undefined) p.batchNumber = data.batchNumber;
  if (data.isActive !== undefined) p.isActive = data.isActive;
  p.updatedAt = new Date();
  return serializeProduct(p);
}

// ---------------------------------------------------------------------------
// Public product helpers (store-facing pages / public routes)
// ---------------------------------------------------------------------------

function serializePublicProduct(p: any): PublicProduct {
  const expiryDateStr = p.expiryDate ? p.expiryDate.toISOString() : null;
  const owner = p.owner ?? { name: "", profileImage: null, businessName: null };
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    category: p.category ?? null,
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice,
    quantity: p.quantity,
    unit: p.unit,
    minStock: p.minStock ?? null,
    sku: p.sku ?? null,
    barcode: p.barcode ?? null,
    imageLink: p.imageLink ?? null,
    expiryDate: expiryDateStr,
    batchNumber: p.batchNumber ?? null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    stockStatus: getStockStatus(p),
    expiryStatus: getExpiryStatus(expiryDateStr),
    daysUntilExpiry: expiryDateStr
      ? Math.ceil((new Date(expiryDateStr).getTime() - Date.now()) / DAY)
      : null,
    margin: Number((p.sellingPrice - p.costPrice).toFixed(2)),
    value: Number((p.sellingPrice * p.quantity).toFixed(2)),
    owner,
  };
}

export function demoGetPublicProductById(productId: string): PublicProduct | null {
  const store = getDemoStore();
  const p = store.products.find((x) => x.id === productId);
  if (!p) return null;
  const owner = store.users.find((u) => u.id === p.ownerId);
  return serializePublicProduct({ ...p, owner });
}

export function demoGetPublicProductSales(productId: string, days = 7): PublicSalesData[] {
  const store = getDemoStore();
  const product = store.products.find((p) => p.id === productId);
  if (!product) return [];

  const start = Date.now() - days * DAY;
  const dataMap = new Map<string, { sales: number; revenue: number }>();
  store.saleItems.forEach((it) => {
    if (it.productId !== productId) return;
    const sale = store.sales.find((s) => s.id === it.saleId);
    if (!sale || sale.ownerId !== product.ownerId) return;
    if (sale.createdAt.getTime() < start) return;
    const key = sale.createdAt.toISOString().split("T")[0];
    const entry = dataMap.get(key) ?? { sales: 0, revenue: 0 };
    entry.sales += it.quantity;
    entry.revenue += it.totalPrice ?? 0;
    dataMap.set(key, entry);
  });

  const result: PublicSalesData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = d.toISOString().split("T")[0];
    const data = dataMap.get(key) ?? { sales: 0, revenue: 0 };
    result.push({ date: key, sales: data.sales, revenue: data.revenue });
  }
  return result;
}

export function demoUpdatePublicProduct(
  productId: string,
  data: {
    quantity?: number;
    expiryDate?: string | null;
    batchNumber?: string | null;
    name?: string;
    description?: string | null;
    category?: string | null;
  },
): PublicProduct | null {
  const store = getDemoStore();
  const p = store.products.find((x) => x.id === productId);
  if (!p) return null;
  if (data.quantity !== undefined) p.quantity = data.quantity;
  if (data.expiryDate !== undefined) p.expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;
  if (data.batchNumber !== undefined) p.batchNumber = data.batchNumber || null;
  if (data.name !== undefined) p.name = data.name;
  if (data.description !== undefined) p.description = data.description || null;
  if (data.category !== undefined) p.category = data.category || null;
  p.updatedAt = new Date();
  return demoGetPublicProductById(productId);
}

// ---------------------------------------------------------------------------
// Expiry tracker
// ---------------------------------------------------------------------------

function getSalesVelocityMap(productIds: string[]): Map<string, number> {
  const store = getDemoStore();
  const velocity = new Map<string, number>();
  productIds.forEach((id) => velocity.set(id, 0));
  if (productIds.length === 0) return velocity;

  const start = Date.now() - 30 * DAY;
  const totals = new Map<string, number>();
  store.saleItems.forEach((it) => {
    if (!productIds.includes(it.productId)) return;
    const sale = store.sales.find((s) => s.id === it.saleId);
    if (!sale || sale.ownerId !== DEMO_USER_ID || sale.createdAt.getTime() < start) return;
    totals.set(it.productId, (totals.get(it.productId) ?? 0) + it.quantity);
  });
  totals.forEach((qty, id) => velocity.set(id, qty / 30));
  return velocity;
}

function calculateRiskScore(
  daysUntilExpiry: number,
  daysUntilSoldOut: number | null,
  dailySellRate: number,
  stock: number,
): number {
  if (daysUntilExpiry <= 0) return 1;
  if (dailySellRate <= 0) return stock > 0 ? 0.7 : 0;
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

function serializeExpiryProduct(p: any, velocity: Map<string, number>): ExpiryProduct {
  const now = Date.now();
  const expiryDate = p.expiryDate!;
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now) / DAY);
  const dailySellRate = velocity.get(p.id) ?? 0;
  const daysUntilSoldOut = dailySellRate > 0 ? Math.ceil(p.quantity / dailySellRate) : null;
  const riskScore = calculateRiskScore(daysUntilExpiry, daysUntilSoldOut, dailySellRate, p.quantity);
  return {
    id: p.id,
    name: p.name,
    description: p.description ?? null,
    category: p.category ?? null,
    sellingPrice: p.sellingPrice,
    costPrice: p.costPrice,
    quantity: p.quantity,
    unit: p.unit,
    imageLink: p.imageLink ?? null,
    isActive: p.isActive,
    expiryDate: expiryDate.toISOString(),
    batchNumber: p.batchNumber ?? null,
    expiryStatus: getExpiryStatus(expiryDate.toISOString()),
    daysUntilExpiry,
    stockStatus: p.quantity <= 0 ? "OUT_OF_STOCK" : "IN_STOCK",
    dailySellRate,
    daysUntilSoldOut,
    isAtRisk: riskScore > 0.3,
    riskScore,
    suggestedDiscount: riskScore > 0.3 ? calculateSuggestedDiscount(daysUntilExpiry) : null,
    suggestedBundleWith: [],
    value: p.sellingPrice * p.quantity,
    margin: Number((p.sellingPrice - p.costPrice).toFixed(2)),
  };
}

export function demoGetExpiryDashboardStats(): ExpiryDashboardStats {
  const store = getDemoStore();
  const now = Date.now();
  const seven = now + 7 * DAY;
  const thirty = now + 30 * DAY;
  const products = store.products.filter((p) => p.ownerId === DEMO_USER_ID && p.isActive);

  let expired = 0, expiringSoon = 0, expiring = 0, fresh = 0, totalExpirable = 0, totalValueAtRisk = 0;
  products.forEach((p) => {
    if (!p.expiryDate) return;
    totalExpirable++;
    const t = p.expiryDate.getTime();
    if (t <= now) {
      expired++;
      totalValueAtRisk += p.sellingPrice * p.quantity;
    } else if (t <= seven) {
      expiringSoon++;
      totalValueAtRisk += p.sellingPrice * p.quantity;
    } else if (t <= thirty) expiring++;
    else fresh++;
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

export function demoGetExpiringProducts(): ExpiryProduct[] {
  const store = getDemoStore();
  const now = Date.now();
  const thirty = now + 30 * DAY;
  const products = store.products
    .filter(
      (p) =>
        p.ownerId === DEMO_USER_ID &&
        p.isActive &&
        p.expiryDate &&
        p.expiryDate.getTime() <= thirty &&
        p.quantity > 0,
    )
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
    .slice(0, 50);

  const velocity = getSalesVelocityMap(products.map((p) => p.id));
  return products.map((p) => serializeExpiryProduct(p, velocity));
}

export function demoPredictAtRiskProducts(): ExpiryProduct[] {
  const store = getDemoStore();
  const now = Date.now();
  const ninety = now + 90 * DAY;
  const products = store.products
    .filter(
      (p) =>
        p.ownerId === DEMO_USER_ID &&
        p.isActive &&
        p.expiryDate &&
        p.expiryDate.getTime() >= now &&
        p.expiryDate.getTime() <= ninety &&
        p.quantity > 0,
    )
    .sort((a, b) => a.expiryDate.getTime() - b.expiryDate.getTime())
    .slice(0, 100);

  const velocity = getSalesVelocityMap(products.map((p) => p.id));
  return products
    .map((p) => serializeExpiryProduct(p, velocity))
    .filter((p) => p.isAtRisk)
    .sort((a, b) => b.riskScore - a.riskScore);
}

export function demoGetClearanceSuggestions(): ClearanceSuggestion[] {
  const store = getDemoStore();
  const atRisk = demoPredictAtRiskProducts();
  if (atRisk.length === 0) return [];

  const popular = store.products
    .filter((p) => p.ownerId === DEMO_USER_ID && p.isActive && p.quantity > 0)
    .slice(0, 10);

  const suggestions: ClearanceSuggestion[] = [];
  atRisk.slice(0, 10).forEach((product) => {
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
        ? `Expires in ${product.daysUntilExpiry} days. ${
            product.dailySellRate <= 0
              ? "No recent sales."
              : product.daysUntilSoldOut !== null
                ? `Sells ${product.dailySellRate.toFixed(1)}/day — will last ~${product.daysUntilSoldOut} days.`
                : `Sells ${product.dailySellRate.toFixed(1)}/day.`
          }`
        : "At risk of expiry",
      urgency,
      savingsAmount,
    });

    if (popular.length > 0) {
      const bundleTarget = popular[Math.floor(Math.random() * popular.length)];
      const bundlePrice = Number((product.sellingPrice + bundleTarget.sellingPrice * 0.8).toFixed(2));
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
        savingsAmount: Number((product.sellingPrice + bundleTarget.sellingPrice - bundlePrice).toFixed(2)),
      });
    }
  });

  return suggestions;
}
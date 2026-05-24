"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { Category, StockUnit, Prisma } from "@/prisma/generated/prisma/client";
import { uploadImage, deleteImageByUrl } from "@/lib/cloudinary";

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";

export interface ProductSalesData {
  date: string;
  sales: number;
  revenue: number;
}

export interface InventoryQuery {
  search?: string;
  category?: Category | "ALL";
  status?: InventoryStockStatus | "ALL";
  sort?: "updated" | "name" | "price" | "quantity";
  order?: "asc" | "desc";
  minPrice?: number | null;
  maxPrice?: number | null;
  activeOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  description: string | null;
  category: Category | null;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: StockUnit;
  minStock: number | null;
  sku: string | null;
  barcode: string | null;
  imageLink: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus: InventoryStockStatus;
  margin: number;
  value: number;
  salesHistory?: ProductSalesData[];
}

export interface InventoryCategoryOption {
  value: Category;
  label: string;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string | null;
  category?: Category | null;
  sellingPrice?: number;
  costPrice?: number;
  quantity?: number;
  unit?: StockUnit;
  minStock?: number | null;
  sku?: string | null;
  barcode?: string | null;
  isActive?: boolean;
  imageBase64?: string | null;
}

export interface InventoryStats {
  totalValue: number;
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  inactive: number;
}

export interface InventoryResponse {
  items: InventoryProduct[];
  totalCount: number;
  overallCount: number;
  categories: InventoryCategoryOption[];
  stats?: InventoryStats;
}

const CATEGORY_LABELS: Record<Category, string> = {
  [Category.GROCERIES]: "Groceries",
  [Category.FMCG]: "FMCG",
  [Category.FRESH_PRODUCE]: "Fresh Produce",
  [Category.AGRO_PRODUCTS]: "Agro Products",
  [Category.FISHERY_SEAFOOD]: "Fishery & Seafood",
  [Category.MEAT_POULTRY]: "Meat & Poultry",
  [Category.DAIRY]: "Dairy",
  [Category.ELECTRONICS]: "Electronics",
  [Category.MOBILE_ACCESSORIES]: "Mobile Accessories",
  [Category.CLOTHING]: "Clothing",
  [Category.TEXTILES_APPAREL]: "Textiles & Apparel",
  [Category.FOOTWEAR]: "Footwear",
  [Category.BEAUTY_PERSONAL_CARE]: "Beauty & Personal Care",
  [Category.HOME_APPLIANCE]: "Home Appliance",
  [Category.FURNITURE]: "Furniture",
  [Category.HARDWARE]: "Hardware",
  [Category.CONSTRUCTION_MATERIALS]: "Construction Materials",
  [Category.AUTO_PARTS]: "Auto Parts",
  [Category.PHARMACY]: "Pharmacy",
  [Category.STATIONERY]: "Stationery",
  [Category.OFFICE_SUPPLIES]: "Office Supplies",
  [Category.PACKAGING]: "Packaging",
  [Category.CHEMICALS]: "Chemicals",
  [Category.PLASTICS]: "Plastics",
  [Category.RESTAURANT_SUPPLY]: "Restaurant Supply",
  [Category.HOSPITALITY_SUPPLY]: "Hospitality Supply",
  [Category.OTHER]: "Other",
};

function getCategoryOptions(): InventoryCategoryOption[] {
  return Object.values(Category).map((value) => ({
    value,
    label: CATEGORY_LABELS[value] ?? "Other",
  }));
}

function getStockStatus(product: {
  isActive: boolean;
  quantity: number;
  minStock: number | null;
}): InventoryStockStatus {
  if (!product.isActive) return "INACTIVE";
  if (product.quantity <= 0) return "OUT_OF_STOCK";
  if (product.minStock !== null && product.quantity <= product.minStock) return "LOW_STOCK";
  return "IN_STOCK";
}

function buildSearchWhere(search: string) {
  if (!search) return undefined;
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { sku: { contains: search, mode: "insensitive" as const } },
      { barcode: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

async function getSalesHistoryForProducts(
  productIds: string[],
  userId: string,
  days: number,
): Promise<Map<string, ProductSalesData[]>> {
  const historyMap = new Map<string, ProductSalesData[]>();
  if (productIds.length === 0) return historyMap;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const salesRows = await prisma.$queryRaw<Array<{
    productId: string;
    date: Date;
    totalQuantity: number;
    totalRevenue: number;
  }>>(
    Prisma.sql`
      SELECT
        "SaleItem"."productId" as "productId",
        DATE("Sale"."createdAt") as "date",
        COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity",
        COALESCE(SUM("SaleItem"."totalPrice"), 0) as "totalRevenue"
      FROM "SaleItem"
      INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
      WHERE "SaleItem"."productId" IN (${Prisma.join(productIds)})
        AND "Sale"."ownerId" = ${userId}
        AND "Sale"."createdAt" >= ${startDate}
      GROUP BY "SaleItem"."productId", DATE("Sale"."createdAt")
      ORDER BY "SaleItem"."productId", date ASC
    `,
  );

  const grouped = new Map<string, Map<string, { sales: number; revenue: number }>>();
  salesRows.forEach((row) => {
    const dateStr = row.date.toISOString().split("T")[0];
    const productMap = grouped.get(row.productId) ?? new Map();
    productMap.set(dateStr, {
      sales: Number(row.totalQuantity),
      revenue: Number(row.totalRevenue),
    });
    grouped.set(row.productId, productMap);
  });

  productIds.forEach((productId) => {
    const dataMap = grouped.get(productId) ?? new Map();
    const series: ProductSalesData[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const data = dataMap.get(dateStr) || { sales: 0, revenue: 0 };

      series.push({
        date: dateStr,
        sales: data.sales,
        revenue: data.revenue,
      });
    }

    historyMap.set(productId, series);
  });

  return historyMap;
}

export async function getInventoryStats(): Promise<InventoryStats | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const statsResult = await prisma.$queryRaw<Array<{
    totalValue: number;
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    inactive: number;
  }>>(
    Prisma.sql`
      SELECT
        COALESCE(SUM("sellingPrice" * "quantity"), 0) as "totalValue",
        COUNT(*) as "totalProducts",
        COUNT(*) FILTER (WHERE "isActive" = false) as "inactive",
        COUNT(*) FILTER (WHERE "isActive" = true AND "quantity" <= 0) as "outOfStock",
        COUNT(*) FILTER (WHERE "isActive" = true AND "minStock" IS NOT NULL AND "quantity" > 0 AND "quantity" <= "minStock") as "lowStock"
      FROM "Product"
      WHERE "ownerId" = ${userId}
    `,
  );

  const serverStats = Array.isArray(statsResult) ? statsResult[0] : statsResult;

  return {
    totalValue: Number(serverStats?.totalValue) || 0,
    totalProducts: Number(serverStats?.totalProducts) || 0,
    lowStock: Number(serverStats?.lowStock) || 0,
    outOfStock: Number(serverStats?.outOfStock) || 0,
    inactive: Number(serverStats?.inactive) || 0,
  };
}

export async function listInventoryProducts(query: InventoryQuery): Promise<InventoryResponse | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const search = query.search?.trim() ?? "";
  const category = query.category ?? "ALL";
  const status = query.status ?? "ALL";
  const sort = query.sort ?? "updated";
  const order = query.order ?? "desc";
  const activeOnly = query.activeOnly ?? false;
  const baseLimit = query.limit ?? 20;
  const limit = status === "LOW_STOCK" ? Math.min(baseLimit * 3, 100) : Math.min(baseLimit, 100);
  const offset = query.offset ?? 0;
  const sellingPriceFilter: { gte?: number; lte?: number } = {};

  if (query.minPrice !== null && query.minPrice !== undefined) {
    sellingPriceFilter.gte = query.minPrice;
  }

  if (query.maxPrice !== null && query.maxPrice !== undefined) {
    sellingPriceFilter.lte = query.maxPrice;
  }

  const searchWhere = buildSearchWhere(search);
  
  const where: any = {
    ownerId: userId,
    ...(searchWhere ? searchWhere : {}),
    ...(category !== "ALL" ? { category } : {}),
    ...(Object.keys(sellingPriceFilter).length > 0 ? { sellingPrice: sellingPriceFilter } : {}),
  };

  // Apply status filters
  if (status === "INACTIVE") {
    where.isActive = false;
  } else if (status === "IN_STOCK") {
    where.isActive = true;
    where.quantity = { gt: 0 };
  } else if (status === "LOW_STOCK") {
    where.isActive = true;
    where.minStock = { not: null };
    where.quantity = { gt: 0 };
  } else if (status === "OUT_OF_STOCK") {
    where.isActive = true;
    where.quantity = { lte: 0 };
  } else if (activeOnly) {
    // Only apply activeOnly filter when no specific status is selected
    where.isActive = true;
  }

  const orderBy =
    sort === "name"
      ? { name: order }
      : sort === "price"
      ? { sellingPrice: order }
      : sort === "quantity"
      ? { quantity: order }
      : { updatedAt: order };

  const [items, rawCount, overallCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
    }),
    prisma.product.count({ where }),
    prisma.product.count({ where: { ownerId: userId } }),
  ]);

  const filteredItems =
    status === "LOW_STOCK"
      ? items.filter((item) => item.minStock !== null && item.quantity > 0 && item.quantity <= item.minStock)
      : items;

  const totalCount = status === "LOW_STOCK" ? filteredItems.length : rawCount;

  const salesHistoryByProduct = await getSalesHistoryForProducts(
    filteredItems.map((item) => item.id),
    userId,
    30,
  );

  const products = filteredItems.map((product) => {
    const stockStatus = getStockStatus({
      isActive: product.isActive,
      quantity: product.quantity,
      minStock: product.minStock,
    });
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
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
      stockStatus,
      margin,
      value,
      salesHistory: salesHistoryByProduct.get(product.id) ?? [],
    } satisfies InventoryProduct;
  });

  return {
    items: products,
    totalCount,
    overallCount,
    categories: getCategoryOptions(),
  };
}

export async function getProductById(productId: string): Promise<InventoryProduct | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const product = await prisma.product.findUnique({
    where: { id: productId, ownerId: userId },
  });

  if (!product) return null;

  const stockStatus = getStockStatus({
    isActive: product.isActive,
    quantity: product.quantity,
    minStock: product.minStock,
  });

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
    isActive: product.isActive,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
    stockStatus,
    margin,
    value,
  };
}

export interface MonthlyComparisonData {
  month: string;
  current: number;
  previous: number;
}

export async function getProductSalesHistory(
  productId: string,
  days: number = 30
): Promise<ProductSalesData[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  // Verify product ownership
  const product = await prisma.product.findUnique({
    where: { id: productId, ownerId: userId },
    select: { id: true },
  });

  if (!product) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch sales data grouped by date
  const salesData = await prisma.$queryRaw<Array<{
    date: Date;
    totalQuantity: number;
    totalRevenue: number;
  }>>`
    SELECT 
      DATE("Sale"."createdAt") as date,
      COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity",
      COALESCE(SUM("SaleItem"."totalPrice"), 0) as "totalRevenue"
    FROM "SaleItem"
    INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
    WHERE "SaleItem"."productId" = ${productId}
      AND "Sale"."ownerId" = ${userId}
      AND "Sale"."createdAt" >= ${startDate}
    GROUP BY DATE("Sale"."createdAt")
    ORDER BY date ASC
  `;

  // Create a map of existing data
  const dataMap = new Map<string, { sales: number; revenue: number }>();
  salesData.forEach((row) => {
    const dateStr = row.date.toISOString().split('T')[0];
    dataMap.set(dateStr, {
      sales: Number(row.totalQuantity),
      revenue: Number(row.totalRevenue),
    });
  });

  // Fill in missing dates with zero values
  const result: ProductSalesData[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const data = dataMap.get(dateStr) || { sales: 0, revenue: 0 };
    
    result.push({
      date: dateStr,
      sales: data.sales,
      revenue: data.revenue,
    });
  }

  return result;
}

export async function getProductMonthlyComparison(
  productId: string,
  months: number = 6
): Promise<MonthlyComparisonData[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  // Verify product ownership
  const product = await prisma.product.findUnique({
    where: { id: productId, ownerId: userId },
    select: { id: true },
  });

  if (!product) return [];

  const now = new Date();
  const currentYearStart = new Date(now);
  currentYearStart.setMonth(now.getMonth() - months + 1);
  currentYearStart.setDate(1);
  currentYearStart.setHours(0, 0, 0, 0);

  const previousYearStart = new Date(currentYearStart);
  previousYearStart.setFullYear(previousYearStart.getFullYear() - 1);

  const previousYearEnd = new Date(now);
  previousYearEnd.setFullYear(previousYearEnd.getFullYear() - 1);

  // Fetch current year data
  const currentYearData = await prisma.$queryRaw<Array<{
    month: number;
    year: number;
    totalQuantity: number;
  }>>`
    SELECT 
      EXTRACT(MONTH FROM "Sale"."createdAt")::int as month,
      EXTRACT(YEAR FROM "Sale"."createdAt")::int as year,
      COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity"
    FROM "SaleItem"
    INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
    WHERE "SaleItem"."productId" = ${productId}
      AND "Sale"."ownerId" = ${userId}
      AND "Sale"."createdAt" >= ${currentYearStart}
      AND "Sale"."createdAt" <= ${now}
    GROUP BY EXTRACT(MONTH FROM "Sale"."createdAt"), EXTRACT(YEAR FROM "Sale"."createdAt")
    ORDER BY year, month
  `;

  // Fetch previous year data
  const previousYearData = await prisma.$queryRaw<Array<{
    month: number;
    year: number;
    totalQuantity: number;
  }>>`
    SELECT 
      EXTRACT(MONTH FROM "Sale"."createdAt")::int as month,
      EXTRACT(YEAR FROM "Sale"."createdAt")::int as year,
      COALESCE(SUM("SaleItem"."quantity"), 0) as "totalQuantity"
    FROM "SaleItem"
    INNER JOIN "Sale" ON "SaleItem"."saleId" = "Sale"."id"
    WHERE "SaleItem"."productId" = ${productId}
      AND "Sale"."ownerId" = ${userId}
      AND "Sale"."createdAt" >= ${previousYearStart}
      AND "Sale"."createdAt" <= ${previousYearEnd}
    GROUP BY EXTRACT(MONTH FROM "Sale"."createdAt"), EXTRACT(YEAR FROM "Sale"."createdAt")
    ORDER BY year, month
  `;

  // Create maps for easy lookup
  const currentMap = new Map<number, number>();
  currentYearData.forEach((row) => {
    currentMap.set(row.month, Number(row.totalQuantity));
  });

  const previousMap = new Map<number, number>();
  previousYearData.forEach((row) => {
    previousMap.set(row.month, Number(row.totalQuantity));
  });

  // Generate result for the last N months
  const result: MonthlyComparisonData[] = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);
    const monthNum = date.getMonth() + 1; // 1-12
    const monthName = monthNames[date.getMonth()];

    result.push({
      month: monthName,
      current: currentMap.get(monthNum) || 0,
      previous: previousMap.get(monthNum) || 0,
    });
  }

  return result;
}

export async function updateProduct(
  productId: string,
  data: UpdateProductPayload,
): Promise<InventoryProduct | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const existing = await prisma.product.findUnique({
    where: { id: productId, ownerId: userId },
    select: { id: true, imageLink: true },
  });
  if (!existing) return null;

  let imageLink = existing.imageLink;

  if (data.imageBase64 === null) {
    if (imageLink) {
      await deleteImageByUrl(imageLink).catch(() => {});
    }
    imageLink = null;
  } else if (data.imageBase64) {
    if (imageLink) {
      await deleteImageByUrl(imageLink).catch(() => {});
    }
    imageLink = await uploadImage(data.imageBase64, "products", {
      width: 800,
      height: 800,
      crop: "fill",
    });
  }

  const updateData: Record<string, unknown> = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.sellingPrice !== undefined) updateData.sellingPrice = data.sellingPrice;
  if (data.costPrice !== undefined) updateData.costPrice = data.costPrice;
  if (data.quantity !== undefined) updateData.quantity = data.quantity;
  if (data.unit !== undefined) updateData.unit = data.unit;
  if (data.minStock !== undefined) updateData.minStock = data.minStock;
  if (data.sku !== undefined) updateData.sku = data.sku;
  if (data.barcode !== undefined) updateData.barcode = data.barcode;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (imageLink !== existing.imageLink) updateData.imageLink = imageLink;

  const updated = await prisma.product.update({
    where: { id: productId },
    data: updateData,
  });

  const stockStatus = getStockStatus({
    isActive: updated.isActive,
    quantity: updated.quantity,
    minStock: updated.minStock,
  });

  const margin = Number((updated.sellingPrice - updated.costPrice).toFixed(2));
  const value = Number((updated.sellingPrice * updated.quantity).toFixed(2));

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description ?? null,
    category: updated.category ?? null,
    sellingPrice: updated.sellingPrice,
    costPrice: updated.costPrice,
    quantity: updated.quantity,
    unit: updated.unit,
    minStock: updated.minStock,
    sku: updated.sku ?? null,
    barcode: updated.barcode ?? null,
    imageLink: updated.imageLink ?? null,
    isActive: updated.isActive,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
    stockStatus,
    margin,
    value,
  };
}

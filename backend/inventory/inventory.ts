"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { Category, StockUnit } from "@/prisma/generated/prisma/client";

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";

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
}

export interface InventoryCategoryOption {
  value: Category;
  label: string;
}

export interface InventoryResponse {
  items: InventoryProduct[];
  totalCount: number;
  overallCount: number;
  categories: InventoryCategoryOption[];
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
    } satisfies InventoryProduct;
  });

  return {
    items: products,
    totalCount,
    overallCount,
    categories: getCategoryOptions(),
  };
}

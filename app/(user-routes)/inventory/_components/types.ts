import {
  LuGrid2X2,
  LuGrid3X3,
  LuList,
} from "react-icons/lu";

export type InventoryStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "INACTIVE";

export type InventoryProduct = {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  stockStatus: InventoryStockStatus;
  margin: number;
  value: number;
  salesHistory?: ProductSalesData[];
};

export type ProductSalesData = {
  date: string;
  sales: number;
  revenue: number;
};

export type InventoryCategoryOption = {
  value: string;
  label: string;
};

export type ViewMode = "grid" | "large" | "list";

export type StatusFilter = "ALL" | InventoryStockStatus;

export type SortOption = {
  value: "updated" | "name" | "price" | "quantity";
  order: "asc" | "desc";
  label: string;
};

export type InventoryStats = {
  totalValue: number;
  totalProducts: number;
  lowStock: number;
  outOfStock: number;
  inactive: number;
};

export const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "IN_STOCK", label: "In stock" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "INACTIVE", label: "Inactive" },
];

export const SORT_OPTIONS: SortOption[] = [
  { value: "updated", order: "desc", label: "Recently updated" },
  { value: "name", order: "asc", label: "Name A-Z" },
  { value: "price", order: "desc", label: "Price high to low" },
  { value: "price", order: "asc", label: "Price low to high" },
  { value: "quantity", order: "desc", label: "Quantity high to low" },
];

export const VIEW_OPTIONS: { value: ViewMode; label: string; Icon: typeof LuGrid3X3 }[] = [
  { value: "grid", label: "Grid", Icon: LuGrid3X3 },
  { value: "large", label: "Large", Icon: LuGrid2X2 },
  { value: "list", label: "List", Icon: LuList },
];

export const CATEGORIES = [
  "GROCERIES",
  "FMCG",
  "FRESH_PRODUCE",
  "AGRO_PRODUCTS",
  "FISHERY_SEAFOOD",
  "MEAT_POULTRY",
  "DAIRY",
  "ELECTRONICS",
  "MOBILE_ACCESSORIES",
  "CLOTHING",
  "TEXTILES_APPAREL",
  "FOOTWEAR",
  "BEAUTY_PERSONAL_CARE",
  "HOME_APPLIANCE",
  "FURNITURE",
  "HARDWARE",
  "CONSTRUCTION_MATERIALS",
  "AUTO_PARTS",
  "PHARMACY",
  "STATIONERY",
  "OFFICE_SUPPLIES",
  "PACKAGING",
  "CHEMICALS",
  "PLASTICS",
  "RESTAURANT_SUPPLY",
  "HOSPITALITY_SUPPLY",
  "OTHER",
] as const;

export const STOCK_UNITS = [
  "PCS",
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "METER",
  "BOX",
  "PACK",
  "DOZEN",
  "BOTTLE",
  "CAN",
  "ROLL",
] as const;

export const STATUS_BADGES: Record<InventoryStockStatus, string> = {
  IN_STOCK: "border-emerald-400/30 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300",
  LOW_STOCK: "border-amber-400/30 bg-amber-400/10 text-amber-700 dark:text-amber-300",
  OUT_OF_STOCK: "border-rose-400/30 bg-rose-400/10 text-rose-700 dark:text-rose-300",
  INACTIVE: "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted)",
};

export const CATEGORY_PALETTES: Record<string, { from: string; to: string }> = {
  GROCERIES: { from: "#fff44f", to: "#f7d96c" },
  FMCG: { from: "#4ecdc4", to: "#8be0d9" },
  FRESH_PRODUCE: { from: "#7bd389", to: "#b7f7c2" },
  AGRO_PRODUCTS: { from: "#f6c177", to: "#fcd4a2" },
  FISHERY_SEAFOOD: { from: "#60a5fa", to: "#93c5fd" },
  MEAT_POULTRY: { from: "#f97316", to: "#fdba74" },
  DAIRY: { from: "#fef3c7", to: "#fde68a" },
  ELECTRONICS: { from: "#22d3ee", to: "#67e8f9" },
  MOBILE_ACCESSORIES: { from: "#a78bfa", to: "#c4b5fd" },
  CLOTHING: { from: "#f472b6", to: "#fbcfe8" },
  TEXTILES_APPAREL: { from: "#d946ef", to: "#f0abfc" },
  FOOTWEAR: { from: "#94a3b8", to: "#cbd5f5" },
  BEAUTY_PERSONAL_CARE: { from: "#fb7185", to: "#fecdd3" },
  HOME_APPLIANCE: { from: "#38bdf8", to: "#bae6fd" },
  FURNITURE: { from: "#a3e635", to: "#d9f99d" },
  HARDWARE: { from: "#facc15", to: "#fde047" },
  CONSTRUCTION_MATERIALS: { from: "#f59e0b", to: "#fcd34d" },
  AUTO_PARTS: { from: "#fb7185", to: "#fda4af" },
  PHARMACY: { from: "#34d399", to: "#a7f3d0" },
  STATIONERY: { from: "#f472b6", to: "#fbcfe8" },
  OFFICE_SUPPLIES: { from: "#818cf8", to: "#c7d2fe" },
  PACKAGING: { from: "#fcd34d", to: "#fde68a" },
  CHEMICALS: { from: "#22c55e", to: "#bbf7d0" },
  PLASTICS: { from: "#38bdf8", to: "#bae6fd" },
  RESTAURANT_SUPPLY: { from: "#f97316", to: "#fdba74" },
  HOSPITALITY_SUPPLY: { from: "#c084fc", to: "#e9d5ff" },
  OTHER: { from: "#94a3b8", to: "#e2e8f0" },
};

export function formatCategory(value: string | null) {
  if (!value) return "Uncategorized";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(value));
}

/**
 * Generates the demo dataset JSON files under data/demo/.
 *
 * The demo login (demo@optizive.app) is served entirely from these files
 * (plus an in-memory mutation layer) — nothing is written to the database.
 *
 * Dates are stored as relative tokens so the data always looks current:
 *   "T-3d"  → 3 days ago      "T+7d" → 7 days from now
 *   "T-5h"  → 5 hours ago     "T+2h" → 2 hours from now
 *
 * Run: npx tsx scripts/generate-demo-data.ts
 */

import { mkdirSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "demo");

// ---------------------------------------------------------------------------
// Deterministic RNG (mulberry32)
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260817);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const pickWeighted = <T,>(arr: T[], weights: number[]): T => {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = rand() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
};

const pad = (n: number) => String(n).padStart(2, "0");
const fmtDate = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const token = (days: number, hours = 0) => {
  const d = days !== 0 ? `T${days >= 0 ? "+" : ""}${days}d` : "";
  const h = hours !== 0 ? `${hours >= 0 ? "+" : ""}${hours}h` : "";
  return d + h || "T0d";
};
const isoAgo = (days: number) => token(-days);

const DEMO_USER_ID = "demo-user";
const DEMO_BUSINESS_SLUG = "dhaka-metro-mart";
const DEMO_STORE_SLUG = "main-branch";
const DEMO_STORE_API_KEY = "sk_demo_6f8a2c1e9d4b7a3f0e5c8d2b1a6f4e0d9c3b7a5f";

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

interface User {
  id: string;
  createdAt: string;
  updatedAt: string;
  onboarded: boolean;
  name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  password: string | null;
  profileImage: string | null;
  businessName: string | null;
  businessSlug: string | null;
  role: string;
  businessType: string | null;
  businessSize: string | null;
  district: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  primaryCategory: string | null;
  subCategories: string[];
  monthlyPurchaseRange: string | null;
  pricingPreference: string | null;
  negotiationPreference: string | null;
  maxDeliveryTime: string | null;
  preferredDistance: string | null;
  buyingPriority: string | null;
  restockFrequency: string | null;
  serviceArea: string | null;
  serviceRadiusKm: number | null;
  deliveryMethod: string | null;
  deliveryTimeRange: string | null;
  pricingType: string | null;
  bulkDiscountAvailable: boolean | null;
  orderCapacity: string | null;
  supplierTags: string[];
  isVerified: boolean;
  banned: boolean;
  yearsInBusiness: number | null;
  avgRating: number;
  totalTransactions: number;
  businessRegistrationId: string | null;
  paymentTerms: string | null;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  isActive: boolean;
  lastActiveAt: string | null;
}

const SUPPLIER_TAGS = [
  "FAST_DELIVERY",
  "BULK_DISCOUNT",
  "PREMIUM_QUALITY",
  "LOW_PRICE",
  "FACTORY_DIRECT",
  "CASH_ON_DELIVERY",
  "VAT_INVOICE",
  "HALAL_CERTIFIED",
  "BSTI_CERTIFIED",
  "COLD_CHAIN",
  "SAMPLE_AVAILABLE",
] as const;

const DEMO_USER: User = {
  id: DEMO_USER_ID,
  createdAt: isoAgo(520),
  updatedAt: "T-6h",
  onboarded: true,
  name: "Rafi Ahmed",
  phone: "+8801712-445566",
  email: "demo@optizive.app",
  username: "rafi-demo",
  password: null,
  profileImage: `https://picsum.photos/seed/rafi-ahmed-demo/200/200`,
  businessName: "Dhaka Metro Mart",
  businessSlug: DEMO_BUSINESS_SLUG,
  role: "BOTH",
  businessType: "RETAILER",
  businessSize: "MEDIUM",
  district: "Dhaka",
  area: "Mirpur-10",
  latitude: 23.8069,
  longitude: 90.3687,
  primaryCategory: "GROCERIES",
  subCategories: ["GROCERIES", "FMCG", "DAIRY", "FRESH_PRODUCE", "MEAT_POULTRY"],
  monthlyPurchaseRange: "BDT 2,00,000 - 5,00,000",
  pricingPreference: "VALUE",
  negotiationPreference: "FLEXIBLE",
  maxDeliveryTime: "NEXT_DAY",
  preferredDistance: "CITY",
  buyingPriority: "QUALITY",
  restockFrequency: "Weekly",
  serviceArea: "CITY",
  serviceRadiusKm: 12,
  deliveryMethod: "BOTH",
  deliveryTimeRange: "NEXT_DAY",
  pricingType: "VALUE",
  bulkDiscountAvailable: true,
  orderCapacity: "MEDIUM",
  supplierTags: ["FAST_DELIVERY", "BULK_DISCOUNT", "HALAL_CERTIFIED", "VAT_INVOICE"],
  isVerified: true,
  banned: false,
  yearsInBusiness: 8,
  avgRating: 4.6,
  totalTransactions: 412,
  businessRegistrationId: "DCC-TRADE-8899123",
  paymentTerms: "7 days credit for regular buyers",
  minOrderValue: 5000,
  maxOrderValue: 500000,
  isActive: true,
  lastActiveAt: "T-2h",
};

function supplier(
  id: string,
  name: string,
  businessName: string,
  district: string,
  area: string,
  primaryCategory: string,
  tags: string[],
  extra: Partial<User> = {},
): User {
  return {
    id,
    createdAt: isoAgo(randInt(300, 900)),
    updatedAt: token(-randInt(1, 10)),
    onboarded: true,
    name,
    phone: `+8801${randInt(300000000, 999999999)}`,
    email: `${id}@optizive.app`,
    username: id,
    password: null,
    profileImage: `https://picsum.photos/seed/${id}/200/200`,
    businessName,
    businessSlug: id,
    role: "SUPPLIER",
    businessType: pick(["WHOLESALER", "DISTRIBUTOR", "MANUFACTURER", "TRADER", "AGRO_PROCESSOR"]),
    businessSize: pick(["SMALL", "MEDIUM", "MEDIUM", "LARGE"]),
    district,
    area,
    latitude: null,
    longitude: null,
    primaryCategory,
    subCategories: [primaryCategory],
    monthlyPurchaseRange: null,
    pricingPreference: null,
    negotiationPreference: null,
    maxDeliveryTime: null,
    preferredDistance: null,
    buyingPriority: null,
    restockFrequency: null,
    serviceArea: pick(["CITY", "REGIONAL", "NATIONWIDE"]),
    serviceRadiusKm: randInt(20, 200),
    deliveryMethod: pick(["COURIER", "BOTH", "FREIGHT", "SELF"]),
    deliveryTimeRange: pick(["SAME_DAY", "NEXT_DAY", "TWO_THREE_DAYS", "WITHIN_WEEK"]),
    pricingType: pick(["BUDGET", "VALUE", "MID_RANGE", "PREMIUM"]),
    bulkDiscountAvailable: tags.includes("BULK_DISCOUNT"),
    orderCapacity: pick(["SMALL", "MEDIUM", "LARGE"]),
    supplierTags: tags,
    isVerified: true,
    banned: false,
    yearsInBusiness: randInt(4, 22),
    avgRating: Math.round((4 + rand() * 1) * 10) / 10,
    totalTransactions: randInt(120, 2600),
    businessRegistrationId: `BD-BIN-${randInt(100000, 999999)}`,
    paymentTerms: pick(["Cash on delivery", "7 days credit", "14 days credit", "50% advance"]),
    minOrderValue: randInt(2000, 20000),
    maxOrderValue: randInt(200000, 2000000),
    isActive: true,
    lastActiveAt: token(-randInt(1, 30), 0),
    ...extra,
  };
}

const SUPPLIERS: User[] = [
  supplier("demo-supplier-1", "Karim Hossain", "Karim Agro Traders", "Khulna", "Daulatpur", "AGRO_PRODUCTS",
    ["BULK_DISCOUNT", "FACTORY_DIRECT", "LOW_PRICE", "BSTI_CERTIFIED"]),
  supplier("demo-supplier-2", "Abdul Latif", "Bashundhara Food & Beverage", "Dhaka", "Tejgaon", "FMCG",
    ["BULK_DISCOUNT", "PREMIUM_QUALITY", "VAT_INVOICE", "FAST_DELIVERY"]),
  supplier("demo-supplier-3", "Mokbul Hossain", "Fresh Catch Fisheries", "Chattogram", "Kotowali", "FISHERY_SEAFOOD",
    ["COLD_CHAIN", "FAST_DELIVERY", "HALAL_CERTIFIED", "SAMPLE_AVAILABLE"], { avgRating: 4.8 }),
  supplier("demo-supplier-4", "Shafiqur Rahman", "ACI Poultry & Meat", "Dhaka", "Savar", "MEAT_POULTRY",
    ["HALAL_CERTIFIED", "BSTI_CERTIFIED", "COLD_CHAIN", "FAST_DELIVERY"]),
  supplier("demo-supplier-5", "Nurjahan Begum", "Arong Dairy & Milk", "Rajshahi", "Boalia", "DAIRY",
    ["PREMIUM_QUALITY", "COLD_CHAIN", "VAT_INVOICE"], { avgRating: 4.7 }),
  supplier("demo-supplier-6", "Jahangir Alam", "Bengal Rice & Grains", "Dinajpur", "Sadar", "GROCERIES",
    ["BULK_DISCOUNT", "FACTORY_DIRECT", "LOW_PRICE"], { avgRating: 4.4 }),
  supplier("demo-supplier-7", "Rashida Khatun", "Pran Agro Ltd", "Narayanganj", "Rupganj", "AGRO_PRODUCTS",
    ["BULK_DISCOUNT", "BSTI_CERTIFIED", "FACTORY_DIRECT"], { avgRating: 4.3 }),
  supplier("demo-supplier-8", "Kawsar Ali", "Meghna Vegetable Supply", "Dhaka", "Gabtoli", "FRESH_PRODUCE",
    ["FAST_DELIVERY", "LOW_PRICE", "SAMPLE_AVAILABLE"], { avgRating: 4.2 }),
  supplier("demo-supplier-9", "Hasina Akter", "Swadesh Spice House", "Bogra", "Sadar", "GROCERIES",
    ["PREMIUM_QUALITY", "BULK_DISCOUNT", "HALAL_CERTIFIED"], { avgRating: 4.5 }),
  supplier("demo-supplier-10", "Rahim Uddin", "Rahim Electronics Wholesale", "Dhaka", "Elektrnik Market", "ELECTRONICS",
    ["VAT_INVOICE", "FAST_DELIVERY", "SAMPLE_AVAILABLE"], { avgRating: 4.1 }),
  supplier("demo-supplier-11", "Jamal Sheikh", "Jamuna Confectionery", "Gazipur", "Tongi", "FMCG",
    ["BULK_DISCOUNT", "LOW_PRICE", "FAST_DELIVERY"], { avgRating: 4.0 }),
  supplier("demo-supplier-12", "Laila Parvin", "Padma Oil & Ghee Traders", "Barishal", "Sadar", "GROCERIES",
    ["BULK_DISCOUNT", "FACTORY_DIRECT", "VAT_INVOICE"], { avgRating: 4.5 }),
  supplier("demo-supplier-13", "Tanjil Ahmed", "Sylhet Tea & Beverages", "Sylhet", "Zindabazar", "GROCERIES",
    ["PREMIUM_QUALITY", "HALAL_CERTIFIED", "VAT_INVOICE"], { avgRating: 4.6 }),
];

function buyer(id: string, name: string, businessName: string, district: string, area: string): User {
  return supplier(id, name, businessName, district, area, "GROCERIES",
    ["BULK_DISCOUNT"], { role: "STORE_OWNER", businessType: "RETAILER", supplierTags: [] });
}

const BUYERS: User[] = [
  buyer("demo-buyer-1", "Salma Akter", "Mirpur Kitchen", "Dhaka", "Mirpur-1"),
  buyer("demo-buyer-2", "Hasan Mahmud", "Uttara Fresh Store", "Dhaka", "Uttara Sector-7"),
];

const USERS: User[] = [DEMO_USER, ...SUPPLIERS, ...BUYERS];

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

interface Product {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  supplierId: string | null;
  name: string;
  description: string | null;
  barcode: string | null;
  sku: string | null;
  category: string | null;
  imageLink: string | null;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  unit: string;
  minStock: number | null;
  expiryDate: string | null;
  batchNumber: string | null;
  isActive: boolean;
}

interface ProductDef {
  name: string;
  category: string;
  cost: number;
  price: number;
  unit: string;
  qty: number;
  minStock?: number | null;
  expiryInDays?: number;
  popular?: number;
  inactive?: boolean;
}

const DEMO_PRODUCTS_DEF: ProductDef[] = [
  // ---- Groceries (staples) ----
  { name: "Miniket Rice (25kg bag)", category: "GROCERIES", cost: 1250, price: 1380, unit: "KG", qty: 420, minStock: 100, popular: 10 },
  { name: "Basmati Rice (1kg)", category: "GROCERIES", cost: 165, price: 185, unit: "KG", qty: 140, minStock: 40 },
  { name: "Moong Dal (1kg)", category: "GROCERIES", cost: 145, price: 162, unit: "KG", qty: 90, minStock: 30, popular: 4 },
  { name: "Masoor Dal (1kg)", category: "GROCERIES", cost: 128, price: 145, unit: "KG", qty: 110, minStock: 30, popular: 5 },
  { name: "Sugar (1kg)", category: "GROCERIES", cost: 122, price: 138, unit: "KG", qty: 240, minStock: 60, popular: 7 },
  { name: "Fine Flour (1kg)", category: "GROCERIES", cost: 76, price: 88, unit: "KG", qty: 160, minStock: 40 },
  { name: "Iodized Salt (1kg)", category: "GROCERIES", cost: 28, price: 35, unit: "KG", qty: 500, minStock: 120 },
  { name: "Soybean Oil (5L tin)", category: "GROCERIES", cost: 1080, price: 1180, unit: "LITER", qty: 96, minStock: 30, popular: 9 },
  { name: "Palm Oil (1L bottle)", category: "GROCERIES", cost: 148, price: 165, unit: "LITER", qty: 200, minStock: 60, popular: 6 },
  { name: "Chicken Eggs (30pc tray)", category: "GROCERIES", cost: 360, price: 395, unit: "PACK", qty: 74, minStock: 20, popular: 8 },
  { name: "Chickpeas (1kg)", category: "GROCERIES", cost: 155, price: 172, unit: "KG", qty: 80, minStock: 20 },
  { name: "Bashpata Lentil (2kg)", category: "GROCERIES", cost: 282, price: 315, unit: "KG", qty: 55, minStock: 15 },
  { name: "Turmeric Powder (200g)", category: "GROCERIES", cost: 84, price: 96, unit: "PACK", qty: 120, minStock: 30 },
  { name: "Chili Powder (200g)", category: "GROCERIES", cost: 118, price: 132, unit: "PACK", qty: 100, minStock: 25 },
  { name: "Cumin Powder (100g)", category: "GROCERIES", cost: 74, price: 86, unit: "PACK", qty: 60, minStock: 15 },
  { name: "Black Pepper (50g)", category: "GROCERIES", cost: 105, price: 120, unit: "PACK", qty: 45, minStock: 10 },
  { name: "Bay Leaves (50g)", category: "GROCERIES", cost: 38, price: 46, unit: "PACK", qty: 70, minStock: 20 },
  { name: "Semai (Vermicelli 500g)", category: "GROCERIES", cost: 105, price: 122, unit: "PACK", qty: 130, minStock: 25, popular: 3 },
  { name: "Tea Leaf (500g)", category: "GROCERIES", cost: 215, price: 240, unit: "PACK", qty: 85, minStock: 20 },
  { name: "Khejur Dates (1kg)", category: "GROCERIES", cost: 255, price: 285, unit: "KG", qty: 60, minStock: 15 },
  { name: "Milk Powder (Dano 1kg)", category: "GROCERIES", cost: 905, price: 985, unit: "PACK", qty: 48, minStock: 12, popular: 4 },
  { name: "Onion (1kg)", category: "GROCERIES", cost: 78, price: 92, unit: "KG", qty: 350, minStock: 80, popular: 8 },
  { name: "Potato (1kg)", category: "GROCERIES", cost: 36, price: 44, unit: "KG", qty: 600, minStock: 150, popular: 7 },
  { name: "Garlic (1kg)", category: "GROCERIES", cost: 188, price: 210, unit: "KG", qty: 70, minStock: 20 },
  { name: "Ginger (1kg)", category: "GROCERIES", cost: 160, price: 182, unit: "KG", qty: 55, minStock: 15 },
  { name: "Green Chili (1kg)", category: "GROCERIES", cost: 172, price: 192, unit: "KG", qty: 40, minStock: 12, expiryInDays: 6, popular: 3 },
  // ---- Dairy ----
  { name: "Fresh Milk (1L packet)", category: "DAIRY", cost: 84, price: 95, unit: "LITER", qty: 90, minStock: 25, expiryInDays: 2, popular: 9 },
  { name: "Yogurt (500g cup)", category: "DAIRY", cost: 62, price: 74, unit: "PACK", qty: 65, minStock: 15, expiryInDays: 5 },
  { name: "Butter (200g)", category: "DAIRY", cost: 168, price: 190, unit: "PACK", qty: 40, minStock: 10, expiryInDays: 21 },
  { name: "Cheese Slices (200g)", category: "DAIRY", cost: 186, price: 212, unit: "PACK", qty: 35, minStock: 8, expiryInDays: 25 },
  { name: "Ghee (500g jar)", category: "DAIRY", cost: 705, price: 785, unit: "PACK", qty: 28, minStock: 8, expiryInDays: 90 },
  { name: "Misti Doi (250g)", category: "DAIRY", cost: 46, price: 56, unit: "PACK", qty: 50, minStock: 12, expiryInDays: 3 },
  // ---- FMCG ----
  { name: "Glucose Biscuits (1kg)", category: "FMCG", cost: 142, price: 160, unit: "PACK", qty: 110, minStock: 25, popular: 5 },
  { name: "Chocolate Sandwich Cookies (200g)", category: "FMCG", cost: 78, price: 92, unit: "PACK", qty: 90, minStock: 20, popular: 4 },
  { name: "Instant Noodles (5 pack)", category: "FMCG", cost: 105, price: 122, unit: "PACK", qty: 140, minStock: 30, popular: 4 },
  { name: "Shampoo (340ml)", category: "FMCG", cost: 258, price: 292, unit: "BOTTLE", qty: 55, minStock: 15 },
  { name: "Toilet Soap (4 pack)", category: "FMCG", cost: 138, price: 162, unit: "PACK", qty: 75, minStock: 20 },
  { name: "Detergent Powder (1kg)", category: "FMCG", cost: 188, price: 214, unit: "PACK", qty: 65, minStock: 18, popular: 3 },
  { name: "Toothpaste (100g)", category: "FMCG", cost: 122, price: 142, unit: "PACK", qty: 85, minStock: 20 },
  { name: "Tissue Paper (3 pack)", category: "FMCG", cost: 102, price: 122, unit: "PACK", qty: 60, minStock: 15 },
  { name: "Energy Drink (250ml can)", category: "FMCG", cost: 72, price: 88, unit: "CAN", qty: 120, minStock: 30 },
  // ---- Fresh Produce ----
  { name: "Tomato (1kg)", category: "FRESH_PRODUCE", cost: 102, price: 118, unit: "KG", qty: 75, minStock: 15, expiryInDays: 4, popular: 3 },
  { name: "Eggplant (1kg)", category: "FRESH_PRODUCE", cost: 66, price: 80, unit: "KG", qty: 55, minStock: 12, expiryInDays: 5 },
  { name: "Cucumber (1kg)", category: "FRESH_PRODUCE", cost: 58, price: 70, unit: "KG", qty: 60, minStock: 12, expiryInDays: 4 },
  { name: "Carrot (1kg)", category: "FRESH_PRODUCE", cost: 96, price: 112, unit: "KG", qty: 45, minStock: 10, expiryInDays: 7 },
  { name: "Coriander (200g bunch)", category: "FRESH_PRODUCE", cost: 24, price: 32, unit: "PACK", qty: 80, minStock: 15, expiryInDays: 2 },
  { name: "Ladies Finger (1kg)", category: "FRESH_PRODUCE", cost: 78, price: 92, unit: "KG", qty: 40, minStock: 8, expiryInDays: 4 },
  { name: "Fuji Apple (1kg)", category: "FRESH_PRODUCE", cost: 288, price: 322, unit: "KG", qty: 30, minStock: 8, expiryInDays: 12, popular: 3 },
  { name: "Shobri Banana (dozen)", category: "FRESH_PRODUCE", cost: 118, price: 142, unit: "DOZEN", qty: 50, minStock: 10, expiryInDays: 3, popular: 4 },
  { name: "Lemon (dozen)", category: "FRESH_PRODUCE", cost: 96, price: 118, unit: "DOZEN", qty: 60, minStock: 12, expiryInDays: 10 },
  // ---- Meat & Poultry ----
  { name: "Broiler Chicken (1kg)", category: "MEAT_POULTRY", cost: 188, price: 212, unit: "KG", qty: 70, minStock: 15, expiryInDays: 2, popular: 8 },
  { name: "Beef (1kg)", category: "MEAT_POULTRY", cost: 690, price: 755, unit: "KG", qty: 40, minStock: 10, expiryInDays: 2, popular: 4 },
  { name: "Mutton (1kg)", category: "MEAT_POULTRY", cost: 1080, price: 1160, unit: "KG", qty: 15, minStock: 5, expiryInDays: 2 },
  { name: "Duck (1kg)", category: "MEAT_POULTRY", cost: 460, price: 510, unit: "KG", qty: 0, minStock: 8, expiryInDays: 2 },
  // ---- Fishery ----
  { name: "Rui Fish (1kg)", category: "FISHERY_SEAFOOD", cost: 385, price: 425, unit: "KG", qty: 55, minStock: 12, expiryInDays: 1, popular: 4 },
  { name: "Katla Fish (1kg)", category: "FISHERY_SEAFOOD", cost: 345, price: 385, unit: "KG", qty: 45, minStock: 10, expiryInDays: 1 },
  { name: "Hilsha Fish (1kg)", category: "FISHERY_SEAFOOD", cost: 1280, price: 1420, unit: "KG", qty: 22, minStock: 5, expiryInDays: 1, popular: 2 },
  { name: "Bagda Shrimp (1kg)", category: "FISHERY_SEAFOOD", cost: 1140, price: 1260, unit: "KG", qty: 18, minStock: 5, expiryInDays: 1 },
  { name: "Tilapia Fish (1kg)", category: "FISHERY_SEAFOOD", cost: 228, price: 258, unit: "KG", qty: 60, minStock: 12, expiryInDays: 1 },
  // ---- Agro ----
  { name: "Urea Fertilizer (50kg bag)", category: "AGRO_PRODUCTS", cost: 1240, price: 1360, unit: "KG", qty: 30, minStock: 6 },
  { name: "TSP Fertilizer (50kg bag)", category: "AGRO_PRODUCTS", cost: 1520, price: 1660, unit: "KG", qty: 18, minStock: 5 },
  { name: "BRRI-28 Rice Seeds (1kg)", category: "AGRO_PRODUCTS", cost: 122, price: 142, unit: "KG", qty: 24, minStock: 6 },
  { name: "Vegetable Seeds Pack (mixed)", category: "AGRO_PRODUCTS", cost: 68, price: 86, unit: "PACK", qty: 40, minStock: 10 },
];

const SUPPLIER_PRODUCTS: { ownerId: string; defs: ProductDef[] }[] = [
  {
    ownerId: "demo-supplier-1",
    defs: [
      { name: "Hybrid Aman Paddy Seeds (1kg)", category: "AGRO_PRODUCTS", cost: 128, price: 148, unit: "KG", qty: 300, minStock: 50 },
      { name: "DAP Fertilizer (50kg bag)", category: "AGRO_PRODUCTS", cost: 1680, price: 1820, unit: "KG", qty: 80, minStock: 20 },
      { name: "MOP Fertilizer (50kg bag)", category: "AGRO_PRODUCTS", cost: 1150, price: 1290, unit: "KG", qty: 60, minStock: 15 },
      { name: "Potato Seeds (10kg)", category: "AGRO_PRODUCTS", cost: 480, price: 540, unit: "KG", qty: 120, minStock: 25 },
      { name: "Sunflower Seeds (1kg)", category: "AGRO_PRODUCTS", cost: 210, price: 240, unit: "KG", qty: 90, minStock: 20 },
      { name: "Onion Seed (500g)", category: "AGRO_PRODUCTS", cost: 145, price: 168, unit: "KG", qty: 70, minStock: 15 },
    ],
  },
  {
    ownerId: "demo-supplier-2",
    defs: [
      { name: "Biscuit Multipack (24 pc)", category: "FMCG", cost: 145, price: 168, unit: "PACK", qty: 400, minStock: 80 },
      { name: "Soft Drink (500ml bottle)", category: "FMCG", cost: 28, price: 36, unit: "BOTTLE", qty: 900, minStock: 200 },
      { name: "Cooking Oil (2L pouch)", category: "FMCG", cost: 340, price: 380, unit: "LITER", qty: 150, minStock: 30 },
      { name: "Canned Beans (400g)", category: "FMCG", cost: 95, price: 118, unit: "CAN", qty: 180, minStock: 40 },
      { name: "Chips (50g packet)", category: "FMCG", cost: 16, price: 22, unit: "PACK", qty: 800, minStock: 200 },
      { name: "Ketchup (500g bottle)", category: "FMCG", cost: 128, price: 152, unit: "BOTTLE", qty: 140, minStock: 30 },
    ],
  },
  {
    ownerId: "demo-supplier-3",
    defs: [
      { name: "Premium Rui Fish (1kg)", category: "FISHERY_SEAFOOD", cost: 350, price: 410, unit: "KG", qty: 90, minStock: 15, expiryInDays: 1 },
      { name: "Sea Fish Mixed (1kg)", category: "FISHERY_SEAFOOD", cost: 420, price: 480, unit: "KG", qty: 60, minStock: 10, expiryInDays: 1 },
      { name: "Prawn (Golda 1kg)", category: "FISHERY_SEAFOOD", cost: 1180, price: 1320, unit: "KG", qty: 25, minStock: 5, expiryInDays: 1 },
      { name: "Smoked Hilsa (500g)", category: "FISHERY_SEAFOOD", cost: 650, price: 760, unit: "PACK", qty: 40, minStock: 8, expiryInDays: 30 },
      { name: "Frozen Shrimp Rings (400g)", category: "FISHERY_SEAFOOD", cost: 380, price: 450, unit: "PACK", qty: 55, minStock: 12, expiryInDays: 60 },
    ],
  },
  {
    ownerId: "demo-supplier-4",
    defs: [
      { name: "Broiler Chicks (day-old)", category: "MEAT_POULTRY", cost: 48, price: 62, unit: "PCS", qty: 500, minStock: 100 },
      { name: "Poultry Feed (25kg)", category: "MEAT_POULTRY", cost: 1050, price: 1150, unit: "KG", qty: 70, minStock: 15 },
      { name: "Frozen Chicken Whole (1.2kg)", category: "MEAT_POULTRY", cost: 195, price: 228, unit: "KG", qty: 120, minStock: 25, expiryInDays: 45 },
      { name: "Chicken Sausages (400g)", category: "MEAT_POULTRY", cost: 175, price: 210, unit: "PACK", qty: 85, minStock: 18, expiryInDays: 30 },
      { name: "Duck Eggs (10pc)", category: "MEAT_POULTRY", cost: 105, price: 128, unit: "PACK", qty: 60, minStock: 12, expiryInDays: 12 },
    ],
  },
  {
    ownerId: "demo-supplier-5",
    defs: [
      { name: "Fresh Milk (2L pouch)", category: "DAIRY", cost: 160, price: 182, unit: "LITER", qty: 200, minStock: 40, expiryInDays: 3 },
      { name: "Sweet Yogurt (1kg tub)", category: "DAIRY", cost: 118, price: 142, unit: "PACK", qty: 90, minStock: 20, expiryInDays: 7 },
      { name: "Cottage Cheese (250g)", category: "DAIRY", cost: 145, price: 172, unit: "PACK", qty: 50, minStock: 10, expiryInDays: 10 },
      { name: "Ice Cream (1L tub)", category: "DAIRY", cost: 240, price: 285, unit: "PACK", qty: 60, minStock: 12, expiryInDays: 120 },
      { name: "Laban Drink (500ml)", category: "DAIRY", cost: 45, price: 58, unit: "BOTTLE", qty: 150, minStock: 30, expiryInDays: 6 },
    ],
  },
  {
    ownerId: "demo-supplier-6",
    defs: [
      { name: "Nazirshail Rice (25kg)", category: "GROCERIES", cost: 1600, price: 1750, unit: "KG", qty: 150, minStock: 30 },
      { name: "Chinigura Rice (1kg)", category: "GROCERIES", cost: 240, price: 275, unit: "KG", qty: 100, minStock: 20 },
      { name: "Kataribhog Rice (1kg)", category: "GROCERIES", cost: 260, price: 298, unit: "KG", qty: 80, minStock: 15 },
      { name: "Puffed Rice (1kg)", category: "GROCERIES", cost: 72, price: 88, unit: "KG", qty: 120, minStock: 25 },
      { name: "Wheat (1kg)", category: "GROCERIES", cost: 58, price: 72, unit: "KG", qty: 200, minStock: 40 },
    ],
  },
];

const PRODUCTS: Product[] = [];
let productIndex = 1;
function buildProduct(def: ProductDef, ownerId: string, supplierId: string | null): Product {
  const id = ownerId === DEMO_USER_ID ? `demo-p-${String(productIndex++).padStart(2, "0")}` : `${ownerId}-p-${String(productIndex++).padStart(2, "0")}`;
  const createdDaysAgo = randInt(20, 160);
  return {
    id,
    createdAt: isoAgo(createdDaysAgo),
    updatedAt: token(-randInt(0, 4), 0),
    ownerId,
    supplierId,
    name: def.name,
    description: `${def.name} — stocked by ${ownerId === DEMO_USER_ID ? "Dhaka Metro Mart" : "Optizive partner supplier"}.`,
    barcode: `880${randInt(100000000, 999999999)}`,
    sku: `SKU-${ownerId === DEMO_USER_ID ? "DMM" : "SUP"}${String(productIndex).padStart(4, "0")}`,
    category: def.category,
    imageLink: `https://picsum.photos/seed/demo-${def.name.replace(/\s+/g, "-").toLowerCase()}/600/400`,
    costPrice: def.cost,
    sellingPrice: def.price,
    quantity: def.inactive ? 0 : def.qty,
    unit: def.unit,
    minStock: def.minStock ?? null,
    expiryDate: def.expiryInDays !== undefined ? token(def.expiryInDays) : null,
    batchNumber: def.expiryInDays !== undefined ? `B-${randInt(1000, 9999)}` : null,
    isActive: !def.inactive,
  };
}
DEMO_PRODUCTS_DEF.forEach((d) => PRODUCTS.push(buildProduct(d, DEMO_USER_ID, null)));
SUPPLIER_PRODUCTS.forEach((sp) => sp.defs.forEach((d) => PRODUCTS.push(buildProduct(d, sp.ownerId, sp.ownerId))));

const DEMO_PRODUCTS = PRODUCTS.filter((p) => p.ownerId === DEMO_USER_ID);
const demoProductByName = new Map(DEMO_PRODUCTS.map((p) => [p.name, p]));
const popularProductIds = DEMO_PRODUCTS.filter((p) => {
  const def = DEMO_PRODUCTS_DEF.find((d) => d.name === p.name);
  return def && (def.popular ?? 1) >= 3;
}).map((p) => p.id);

// ---------------------------------------------------------------------------
// Sales
// ---------------------------------------------------------------------------

interface Sale {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  buyerType: string;
  buyerId: string | null;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  paidAmount: number;
  dueAmount: number;
  orderStatus: string;
  deliveryAddress: string | null;
  deliveryDate: string | null;
  notes: string | null;
}

interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

const CUSTOMER_NAMES = [
  "Md. Jahid Hasan", "Nasrin Sultana", "Abdur Rahim", "Farhana Islam", "Tanvir Ahmed",
  "Rokeya Begum", "Shakil Mia", "Ayesha Siddiqua", "Imran Hossain", "Rina Akter",
  "Al Mamun", "Sadia Afrin", "Rasel Kabir", "Mita Chowdhury", "Sabbir Rahman",
  "Jhorna Rani", "Mamunur Rashid", "Shirin Ferdous", "Nazmul Haque", "Tahmina Yasmin",
  "Bakhtiar Alam", "Kohinoor Begum", "Anisur Rahman", "Parvin Sultana", "Shahin Alam",
];

const CUSTOMER_AREAS = ["Mirpur-10", "Pallabi", "Kazipara", "Shewrapara", "Agargaon", "Shyamoli", "Mohammadpur", "Dhanmondi", "Kallyanpur", "Uttara"];

const SALES: Sale[] = [];
const SALE_ITEMS: SaleItem[] = [];
let saleIndex = 1;
let itemIndex = 1;

function buildSale(daysAgo: number, hourOfDay: number): void {
  const saleId = `demo-s-${String(saleIndex++).padStart(4, "0")}`;
  const createdAt = token(-daysAgo, -hourOfDay);

  const itemCount = randInt(1, 4);
  const items: { productId: string; quantity: number; unitPrice: number; totalPrice: number }[] = [];
  const used = new Set<string>();

  for (let i = 0; i < itemCount; i++) {
    let product = pickWeighted(DEMO_PRODUCTS, DEMO_PRODUCTS.map((p) => {
      const def = DEMO_PRODUCTS_DEF.find((d) => d.name === p.name);
      return (def?.popular ?? 1) * (rand() < 0.5 ? 1 : 0.4);
    }));
    if (used.has(product.id)) {
      const fallback = DEMO_PRODUCTS.filter((p) => !used.has(p.id));
      if (fallback.length === 0) break;
      product = pick(fallback);
    }
    used.add(product.id);
    const qty = product.unit === "KG" || product.unit === "LITER"
      ? randInt(1, 10)
      : randInt(1, 24);
    items.push({
      productId: product.id,
      quantity: qty,
      unitPrice: product.sellingPrice,
      totalPrice: Math.round(product.sellingPrice * qty * 100) / 100,
    });
  }

  const totalAmount = Math.round(items.reduce((s, i) => s + i.totalPrice, 0) * 100) / 100;
  const discount = rand() < 0.22 ? Math.round(totalAmount * (rand() * 0.05)) : 0;
  const finalAmount = totalAmount - discount;

  const isPlatform = rand() < 0.32;
  const buyerUser = isPlatform ? pick([...BUYERS, ...SUPPLIERS.slice(0, 5)]) : null;

  const paymentRoll = rand();
  const paymentStatus = paymentRoll < 0.6 ? "PAID" : paymentRoll < 0.78 ? "PARTIAL" : "UNPAID";
  const paidAmount = paymentStatus === "PAID" ? finalAmount : paymentStatus === "PARTIAL" ? Math.round(finalAmount * (0.4 + rand() * 0.5)) : 0;
  const dueAmount = Math.round((finalAmount - paidAmount) * 100) / 100;

  const orderRoll = rand();
  const orderStatus =
    paymentStatus === "UNPAID"
      ? pick(["PENDING", "PENDING", "CONFIRMED"])
      : orderRoll < 0.6
        ? "DELIVERED"
        : orderRoll < 0.75
          ? "SHIPPED"
          : orderRoll < 0.9
            ? "CONFIRMED"
            : "PROCESSING";

  const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const randPart = String.fromCharCode(65 + randInt(0, 25)) + String.fromCharCode(65 + randInt(0, 25)) + String(randInt(100, 999));
  const invoiceNumber = `INV-${y}${m}${dd}-${randPart}`;

  const customerName = buyerUser ? null : pick(CUSTOMER_NAMES);
  const customerPhone = buyerUser ? null : `+8801${randInt(300000000, 999999999)}`;
  const hasDelivery = rand() < 0.3;
  const deliveryDate = hasDelivery ? token(randInt(1, 4)) : null;

  SALES.push({
    id: saleId,
    createdAt,
    updatedAt: createdAt,
    ownerId: DEMO_USER_ID,
    invoiceNumber,
    customerName,
    customerPhone,
    buyerType: buyerUser ? "PLATFORM_USER" : "EXTERNAL",
    buyerId: buyerUser?.id ?? null,
    totalAmount,
    discount,
    finalAmount,
    paymentStatus,
    paidAmount,
    dueAmount,
    orderStatus,
    deliveryAddress: hasDelivery ? `${pick(CUSTOMER_AREAS)}, Dhaka` : null,
    deliveryDate,
    notes: rand() < 0.15 ? "Urgent delivery requested by customer" : null,
  });

  items.forEach((it) => {
    SALE_ITEMS.push({
      id: `demo-si-${String(itemIndex++).padStart(5, "0")}`,
      saleId,
      productId: it.productId,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: it.totalPrice,
    });
  });
}

// ~450 sales over the last 120 days, weighted towards recent days
for (let d = 120; d >= 0; d--) {
  const recency = 1 - d / 120;
  const base = 1.2 + 4.5 * recency;
  const count = Math.max(1, Math.round(base + rand() * 2));
  for (let i = 0; i < count; i++) {
    buildSale(d, randInt(7, 21));
  }
}

// ---------------------------------------------------------------------------
// Chat
// ---------------------------------------------------------------------------

interface Chat {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  title: string;
  messages: { id: string; createdAt: string; role: string; content: string }[];
}

const CHATS: Chat[] = [
  {
    id: "demo-chat-1",
    createdAt: token(-12, 0),
    updatedAt: "T-4h",
    ownerId: DEMO_USER_ID,
    title: "Expiry clearance strategy",
    messages: [
      {
        id: "demo-cm-1-1",
        createdAt: token(-12, 0),
        role: "user",
        content: "I have 65 units of yogurt expiring in 5 days and 40 units of butter expiring in 3 weeks. How should I clear them without losing too much margin?",
      },
      {
        id: "demo-cm-1-2",
        createdAt: token(-12, 0,),
        role: "assistant",
        content: "Here's a clearance plan for your dairy stock:\n\n| Item | Expiry | Suggested | New Price | Margin |\n|------|--------|-----------|-----------|--------|\n| Yogurt 500g | 5 days | 35% off | BDT 48 | ~8% |\n| Butter 200g | 21 days | 15% off now, 25% later | BDT 161 | ~14% |\n\n**Actions:**\n1. **Yogurt** — bundle with glucose biscuits as a \"quick breakfast combo\" at BDT 100 total. Expect to clear in 3 days.\n2. **Butter** — keep at 15% off this week; the expiring-soon window gives you 2 weeks of runway.\n3. Put both items at the counter endcap — impulse sales rise ~20% there.\n\nAfter clearance, cut next dairy order by 25% to avoid the same situation.",
      },
      {
        id: "demo-cm-1-3",
        createdAt: token(-1, 0),
        role: "user",
        content: "The yogurt bundle worked — cleared 48 units yesterday. Should I also discount the cheese slices expiring in 25 days?",
      },
      {
        id: "demo-cm-1-4",
        createdAt: "T-4h",
        role: "assistant",
        content: "Great result! For cheese slices (25 days runway, 35 units):\n\n- **This week:** no discount needed — normal shelf price.\n- **At 14 days left:** apply 15% off.\n- **At 7 days left:** jump to 30% off.\n\nYour daily sell rate is ~2.1 units/day, so 35 units will clear in ~17 days — well inside the window. Keep an eye on the expiry tracker; I'll flag it if the rate slows.",
      },
    ],
  },
  {
    id: "demo-chat-2",
    createdAt: token(-6, 0),
    updatedAt: token(-2, 0),
    ownerId: DEMO_USER_ID,
    title: "Rice supplier comparison",
    messages: [
      {
        id: "demo-cm-2-1",
        createdAt: token(-6, 0),
        role: "user",
        content: "I need a reliable supplier for Miniket rice. Who has the best match for a Dhaka grocery store?",
      },
      {
        id: "demo-cm-2-2",
        createdAt: token(-6, 0),
        role: "assistant",
        content: "Based on your profile (GROCERIES, Dhaka, VALUE pricing, next-day delivery), here are the top rice suppliers:\n\n1. **Bengal Rice & Grains** (Dinajpur) — 96% match. Factory-direct, bulk discounts, BDT 1,750/25kg Nazirshail. 4.4★.\n2. **Karim Agro Traders** (Khulna) — 91% match. Rice seeds + staples, LOW_PRICE tag.\n3. **Padma Oil & Ghee Traders** (Barishal) — 85% match for staple groceries.\n\nTheir delivery is 2-3 days to Dhaka. For your ~420kg Miniket stock, I'd suggest a 25kg trial order first to validate quality consistency before committing to bulk.",
      },
      {
        id: "demo-cm-2-3",
        createdAt: token(-2, 0),
        role: "user",
        content: "How much should I order if I sell ~4 bags/week and lead time is 3 days?",
      },
      {
        id: "demo-cm-2-4",
        createdAt: token(-2, 0),
        role: "assistant",
        content: "Your numbers:\n- Weekly usage: **4 × 25kg bags**\n- Lead time: **3 days** (~0.43 weeks)\n- Safety stock: **1 week** of usage recommended\n\n**Order quantity = (weekly usage × lead time weeks) + safety stock − current stock**\n= (4 × 0.43) + 4 − current\n\nWith 420kg (≈16.8 bags) in stock you're covered for ~4 weeks, so you can wait until stock hits **~6 bags** before reordering **5 bags**. I'd set minStock to 150kg on that product to get the alert earlier.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Smart baskets
// ---------------------------------------------------------------------------

interface SmartBasket {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  publicId: string;
  baseTotal: number;
  customTotal: number | null;
  sourceCategory: string | null;
  bundleId: string | null;
  items: {
    id: string;
    productId: string;
    quantity: number;
    position: number;
    role: string;
    source: string | null;
    reason: string | null;
  }[];
}

const basketDef = (name: string) => name.replace(/\s+/g, "-").toLowerCase();
const pid = (name: string) => {
  const p = demoProductByName.get(name);
  if (!p) throw new Error(`missing demo product: ${name}`);
  return p.id;
};

const SMART_BASKETS: SmartBasket[] = [
  {
    id: "demo-basket-1",
    createdAt: token(-9, 0),
    updatedAt: token(-9, 0),
    ownerId: DEMO_USER_ID,
    title: "Eid Special Household Pack",
    description: "Everything a Dhaka family needs for Eid — rice, semai, oil, dates and milk powder.",
    isPublic: true,
    publicId: "demo-eid-household-pack",
    baseTotal: 0,
    customTotal: 3800,
    sourceCategory: "GROCERIES",
    bundleId: null,
    items: [
      { id: "demo-bi-1-1", productId: pid("Miniket Rice (25kg bag)"), quantity: 1, position: 0, role: "SEED", source: null, reason: null },
      { id: "demo-bi-1-2", productId: pid("Semai (Vermicelli 500g)"), quantity: 3, position: 1, role: "SEED", source: null, reason: null },
      { id: "demo-bi-1-3", productId: pid("Soybean Oil (5L tin)"), quantity: 1, position: 2, role: "SEED", source: null, reason: null },
      { id: "demo-bi-1-4", productId: pid("Khejur Dates (1kg)"), quantity: 2, position: 3, role: "ADDED", source: "RULE", reason: "Frequently bought with semai in Eid season" },
      { id: "demo-bi-1-5", productId: pid("Milk Powder (Dano 1kg)"), quantity: 1, position: 4, role: "ADDED", source: "RULE", reason: "Strong bundle match with household staples" },
      { id: "demo-bi-1-6", productId: pid("Sugar (1kg)"), quantity: 2, position: 5, role: "ADDED", source: "AI", reason: "Pairs with semai for dessert prep" },
    ],
  },
  {
    id: "demo-basket-2",
    createdAt: token(-6, 0),
    updatedAt: token(-6, 0),
    ownerId: DEMO_USER_ID,
    title: "Dairy Refill Bundle",
    description: "Weekly dairy restock — milk, yogurt, ghee and butter for the store shelf.",
    isPublic: false,
    publicId: "demo-dairy-refill",
    baseTotal: 0,
    customTotal: null,
    sourceCategory: "DAIRY",
    bundleId: null,
    items: [
      { id: "demo-bi-2-1", productId: pid("Fresh Milk (1L packet)"), quantity: 12, position: 0, role: "SEED", source: null, reason: null },
      { id: "demo-bi-2-2", productId: pid("Yogurt (500g cup)"), quantity: 6, position: 1, role: "SEED", source: null, reason: null },
      { id: "demo-bi-2-3", productId: pid("Butter (200g)"), quantity: 4, position: 2, role: "SEED", source: null, reason: null },
      { id: "demo-bi-2-4", productId: pid("Ghee (500g jar)"), quantity: 2, position: 3, role: "ADDED", source: "RULE", reason: "High margin dairy add-on" },
      { id: "demo-bi-2-5", productId: pid("Glucose Biscuits (1kg)"), quantity: 4, position: 4, role: "ADDED", source: "AI", reason: "Breakfast combo with milk" },
    ],
  },
  {
    id: "demo-basket-3",
    createdAt: token(-4, 0),
    updatedAt: token(-4, 0),
    ownerId: DEMO_USER_ID,
    title: "Morning Breakfast Basket",
    description: "Quick breakfast essentials for small shops in the area.",
    isPublic: true,
    publicId: "demo-breakfast-basket",
    baseTotal: 0,
    customTotal: null,
    sourceCategory: "GROCERIES",
    bundleId: null,
    items: [
      { id: "demo-bi-3-1", productId: pid("Chicken Eggs (30pc tray)"), quantity: 2, position: 0, role: "SEED", source: null, reason: null },
      { id: "demo-bi-3-2", productId: pid("Tea Leaf (500g)"), quantity: 1, position: 1, role: "SEED", source: null, reason: null },
      { id: "demo-bi-3-3", productId: pid("Fresh Milk (1L packet)"), quantity: 6, position: 2, role: "SEED", source: null, reason: null },
      { id: "demo-bi-3-4", productId: pid("Glucose Biscuits (1kg)"), quantity: 3, position: 3, role: "ADDED", source: "RULE", reason: "Frequently bought with tea" },
      { id: "demo-bi-3-5", productId: pid("Instant Noodles (5 pack)"), quantity: 2, position: 4, role: "ADDED", source: "AI", reason: "Quick breakfast alternative" },
    ],
  },
  {
    id: "demo-basket-4",
    createdAt: token(-2, 0),
    updatedAt: token(-2, 0),
    ownerId: DEMO_USER_ID,
    title: "Fish Market Restock",
    description: "Fresh fish order for the weekend rush.",
    isPublic: false,
    publicId: "demo-fish-restock",
    baseTotal: 0,
    customTotal: null,
    sourceCategory: "FISHERY_SEAFOOD",
    bundleId: null,
    items: [
      { id: "demo-bi-4-1", productId: pid("Rui Fish (1kg)"), quantity: 20, position: 0, role: "SEED", source: null, reason: null },
      { id: "demo-bi-4-2", productId: pid("Katla Fish (1kg)"), quantity: 15, position: 1, role: "SEED", source: null, reason: null },
      { id: "demo-bi-4-3", productId: pid("Tilapia Fish (1kg)"), quantity: 25, position: 2, role: "SEED", source: null, reason: null },
      { id: "demo-bi-4-4", productId: pid("Hilsha Fish (1kg)"), quantity: 5, position: 3, role: "ADDED", source: "RULE", reason: "High-demand weekend item" },
      { id: "demo-bi-4-5", productId: pid("Onion (1kg)"), quantity: 10, position: 4, role: "ADDED", source: "AI", reason: "Cooking staple for fish buyers" },
    ],
  },
  {
    id: "demo-basket-5",
    createdAt: token(-1, 0),
    updatedAt: token(-1, 0),
    ownerId: DEMO_USER_ID,
    title: "Monthly Grocery Restock",
    description: "Core staples restock — rice, dal, oil and salt.",
    isPublic: false,
    publicId: "demo-monthly-restock",
    baseTotal: 0,
    customTotal: null,
    sourceCategory: "GROCERIES",
    bundleId: null,
    items: [
      { id: "demo-bi-5-1", productId: pid("Miniket Rice (25kg bag)"), quantity: 10, position: 0, role: "SEED", source: null, reason: null },
      { id: "demo-bi-5-2", productId: pid("Masoor Dal (1kg)"), quantity: 20, position: 1, role: "SEED", source: null, reason: null },
      { id: "demo-bi-5-3", productId: pid("Soybean Oil (5L tin)"), quantity: 6, position: 2, role: "SEED", source: null, reason: null },
      { id: "demo-bi-5-4", productId: pid("Iodized Salt (1kg)"), quantity: 24, position: 3, role: "ADDED", source: "RULE", reason: "Staple restock pair" },
      { id: "demo-bi-5-5", productId: pid("Potato (1kg)"), quantity: 50, position: 4, role: "ADDED", source: "AI", reason: "Daily-use kitchen staple" },
    ],
  },
];

// fix baseTotal with real prices
SMART_BASKETS.forEach((b) => {
  let total = 0;
  b.items.forEach((it) => {
    const product = PRODUCTS.find((p) => p.id === it.productId)!;
    total += product.sellingPrice * it.quantity;
  });
  b.baseTotal = Math.round(total * 100) / 100;
});

// ---------------------------------------------------------------------------
// Procurement
// ---------------------------------------------------------------------------

interface ProcurementRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  supplierId: string;
  status: string;
  notes: string | null;
  saleId: string | null;
  items: { id: string; productId: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }[];
}

const pByOwnerName = (ownerId: string, name: string) => {
  const p = PRODUCTS.find((x) => x.ownerId === ownerId && x.name === name);
  if (!p) throw new Error(`missing product ${name} for ${ownerId}`);
  return p;
};

const PROCUREMENT: ProcurementRequest[] = [
  {
    id: "demo-pr-1",
    createdAt: token(-3, -5),
    updatedAt: token(-3, 0),
    buyerId: DEMO_USER_ID,
    supplierId: "demo-supplier-1",
    status: "PENDING",
    notes: "Need seeds before the Boro season ends. Please confirm availability.",
    saleId: null,
    items: [
      { id: "demo-pri-1-1", productId: pByOwnerName("demo-supplier-1", "Hybrid Aman Paddy Seeds (1kg)").id, productName: "Hybrid Aman Paddy Seeds (1kg)", quantity: 50, unitPrice: 148, totalPrice: 7400 },
      { id: "demo-pri-1-2", productId: pByOwnerName("demo-supplier-1", "DAP Fertilizer (50kg bag)").id, productName: "DAP Fertilizer (50kg bag)", quantity: 20, unitPrice: 1820, totalPrice: 36400 },
    ],
  },
  {
    id: "demo-pr-2",
    createdAt: token(-10, 0),
    updatedAt: token(-8, 0),
    buyerId: DEMO_USER_ID,
    supplierId: "demo-supplier-4",
    status: "APPROVED",
    notes: "Monthly chicken supply for the meat counter.",
    saleId: "demo-sale-from-pr-2",
    items: [
      { id: "demo-pri-2-1", productId: pByOwnerName("demo-supplier-4", "Frozen Chicken Whole (1.2kg)").id, productName: "Frozen Chicken Whole (1.2kg)", quantity: 60, unitPrice: 228, totalPrice: 13680 },
      { id: "demo-pri-2-2", productId: pByOwnerName("demo-supplier-4", "Chicken Sausages (400g)").id, productName: "Chicken Sausages (400g)", quantity: 30, unitPrice: 210, totalPrice: 6300 },
    ],
  },
  {
    id: "demo-pr-3",
    createdAt: token(-15, 0),
    updatedAt: token(-14, 0),
    buyerId: DEMO_USER_ID,
    supplierId: "demo-supplier-3",
    status: "REJECTED",
    notes: null,
    saleId: null,
    items: [
      { id: "demo-pri-3-1", productId: pByOwnerName("demo-supplier-3", "Prawn (Golda 1kg)").id, productName: "Prawn (Golda 1kg)", quantity: 10, unitPrice: 1320, totalPrice: 13200 },
    ],
  },
  {
    id: "demo-pr-4",
    createdAt: token(-2, -8),
    updatedAt: token(-2, 0),
    buyerId: "demo-buyer-1",
    supplierId: DEMO_USER_ID,
    status: "PENDING",
    notes: "Weekly groceries for our kitchen — need delivery Friday morning.",
    saleId: null,
    items: [
      { id: "demo-pri-4-1", productId: pid("Miniket Rice (25kg bag)"), productName: "Miniket Rice (25kg bag)", quantity: 8, unitPrice: 1380, totalPrice: 11040 },
      { id: "demo-pri-4-2", productId: pid("Soybean Oil (5L tin)"), productName: "Soybean Oil (5L tin)", quantity: 4, unitPrice: 1180, totalPrice: 4720 },
      { id: "demo-pri-4-3", productId: pid("Sugar (1kg)"), productName: "Sugar (1kg)", quantity: 20, unitPrice: 138, totalPrice: 2760 },
    ],
  },
  {
    id: "demo-pr-5",
    createdAt: token(-1, -3),
    updatedAt: token(-1, 0),
    buyerId: "demo-buyer-2",
    supplierId: DEMO_USER_ID,
    status: "PENDING",
    notes: "Restocking for the weekend rush.",
    saleId: null,
    items: [
      { id: "demo-pri-5-1", productId: pid("Broiler Chicken (1kg)"), productName: "Broiler Chicken (1kg)", quantity: 40, unitPrice: 212, totalPrice: 8480 },
      { id: "demo-pri-5-2", productId: pid("Chicken Eggs (30pc tray)"), productName: "Chicken Eggs (30pc tray)", quantity: 15, unitPrice: 395, totalPrice: 5925 },
      { id: "demo-pri-5-3", productId: pid("Fuji Apple (1kg)"), productName: "Fuji Apple (1kg)", quantity: 10, unitPrice: 322, totalPrice: 3220 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Community
// ---------------------------------------------------------------------------

interface CommunityPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  title: string;
  content: string;
  type: string;
  status: string;
  budget: number | null;
  needByDate: string | null;
  image: string | null;
  upvoteCount: number;
  downvoteCount: number;
  commentCount: number;
  categories: string[];
  tags: string[];
  comments: { id: string; createdAt: string; authorId: string; content: string }[];
  votes: { id: string; userId: string; type: string }[];
  fulfillments: {
    id: string;
    createdAt: string;
    supplierId: string;
    message: string;
    price: number | null;
    estimatedDelivery: string | null;
    status: string;
  }[];
}

const POSTS: CommunityPost[] = [
  {
    id: "demo-post-1",
    createdAt: token(-2, -6),
    updatedAt: token(-1, 0),
    authorId: "demo-buyer-1",
    title: "Need 500kg Miniket Rice before Eid",
    content: "We run a kitchen that serves 400+ meals a day. Looking for a verified supplier for **500kg Miniket rice** delivered to Mirpur before Eid. Must have BSTI cert and halal sourcing. Open to long-term contract if quality is consistent.",
    type: "PROCUREMENT",
    status: "OPEN",
    budget: 720000,
    needByDate: token(14),
    image: null,
    upvoteCount: 12,
    downvoteCount: 1,
    commentCount: 0,
    categories: ["GROCERIES"],
    tags: ["rice", "eid-stock"],
    comments: [
      { id: "demo-post-c-1", createdAt: token(-1, -10), authorId: "demo-supplier-6", content: "We supply Nazirshail and Miniket from Dinajpur. Factory-direct pricing — 25kg bag at BDT 1,750. Can deliver 500kg in 3 days." },
      { id: "demo-post-c-2", createdAt: token(-1, -4), authorId: DEMO_USER_ID, content: "I carry Miniket 25kg at BDT 1,380 and can do next-day delivery to Mirpur. Happy to send a sample first." },
    ],
    votes: [
      { id: "demo-post-v-1", userId: DEMO_USER_ID, type: "UPVOTE" },
      { id: "demo-post-v-2", userId: "demo-supplier-2", type: "UPVOTE" },
      { id: "demo-post-v-3", userId: "demo-supplier-4", type: "UPVOTE" },
      { id: "demo-post-v-4", userId: "demo-buyer-2", type: "UPVOTE" },
    ],
    fulfillments: [
      { id: "demo-post-f-1", createdAt: token(-1, -8), supplierId: "demo-supplier-6", message: "Can supply 500kg Miniket from our Dinajpur mill at BDT 1,750/25kg bag. Delivery to Mirpur in 3-4 days via freight.", price: 35000, estimatedDelivery: token(4), status: "PENDING" },
      { id: "demo-post-f-2", createdAt: token(-1, -3), supplierId: "demo-supplier-1", message: "We can arrange Miniket from our Khulna network at BDT 1,720/bag. 5 days lead time.", price: 34400, estimatedDelivery: token(6), status: "PENDING" },
    ],
  },
  {
    id: "demo-post-2",
    createdAt: token(-4, 0),
    updatedAt: token(-3, 0),
    authorId: DEMO_USER_ID,
    title: "Looking for a regular poultry supplier",
    content: "My meat counter sells ~70kg broiler chicken per week. Current supplier is unreliable in the rainy season. Looking for a verified supplier with cold chain and fixed weekly delivery. Halal certified preferred.",
    type: "PROCUREMENT",
    status: "OPEN",
    budget: 60000,
    needByDate: token(7),
    image: null,
    upvoteCount: 8,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["MEAT_POULTRY"],
    tags: ["poultry", "wholesale"],
    comments: [
      { id: "demo-post-c-3", createdAt: token(-3, -6), authorId: "demo-supplier-4", content: "We supply 500+ stores across Dhaka. Broiler at BDT 210/kg with cold-chain vans and halal cert. Weekly orders get priority slots." },
      { id: "demo-post-c-4", createdAt: token(-2, -2), authorId: "demo-buyer-2", content: "+1, ACI has been solid for us for 6 months. Their frozen chicken also helps during load-shedding." },
    ],
    votes: [
      { id: "demo-post-v-5", userId: "demo-supplier-4", type: "UPVOTE" },
      { id: "demo-post-v-6", userId: "demo-buyer-1", type: "UPVOTE" },
      { id: "demo-post-v-7", userId: "demo-supplier-5", type: "UPVOTE" },
    ],
    fulfillments: [
      { id: "demo-post-f-3", createdAt: token(-3, -5), supplierId: "demo-supplier-4", message: "ACI Poultry & Meat — broiler chicken BDT 212/kg, weekly delivery Thursday, halal & BSTI certified, cold chain van.", price: 14840, estimatedDelivery: token(5), status: "PENDING" },
      { id: "demo-post-f-4", createdAt: token(-3, -1), supplierId: "demo-supplier-3", message: "We can't do poultry but can bundle frozen fish for your counter at 10% off first order.", price: null, estimatedDelivery: token(6), status: "PENDING" },
    ],
  },
  {
    id: "demo-post-3",
    createdAt: token(-5, 0),
    updatedAt: token(-5, 0),
    authorId: "demo-buyer-2",
    title: "Bulk fresh fish supply wanted (weekly)",
    content: "Uttara grocery store needing 30-40kg fresh fish weekly (rui, katla, tilapia). Must arrive by 8 AM daily for the fish counter. Considering long-term contract.",
    type: "PROCUREMENT",
    status: "OPEN",
    budget: 45000,
    needByDate: token(10),
    image: null,
    upvoteCount: 6,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["FISHERY_SEAFOOD"],
    tags: ["fresh-fish", "wholesale"],
    comments: [
      { id: "demo-post-c-5", createdAt: token(-4, -8), authorId: "demo-supplier-3", content: "Fresh Catch Fisheries — cold-chain delivery to Uttara by 7:30 AM. Rui BDT 410/kg, katla BDT 385/kg, tilapia BDT 255/kg." },
    ],
    votes: [
      { id: "demo-post-v-8", userId: "demo-supplier-3", type: "UPVOTE" },
      { id: "demo-post-v-9", userId: DEMO_USER_ID, type: "UPVOTE" },
    ],
    fulfillments: [
      { id: "demo-post-f-5", createdAt: token(-4, -7), supplierId: "demo-supplier-3", message: "Can supply 35kg/week from our Chattogram cold chain. 6 AM delivery slot available for Uttara.", price: 14500, estimatedDelivery: token(3), status: "PENDING" },
    ],
  },
  {
    id: "demo-post-4",
    createdAt: token(-6, 0),
    updatedAt: token(-6, 0),
    authorId: DEMO_USER_ID,
    title: "Milk powder price check — who's paying what?",
    content: "We're getting Dano 1kg at BDT 985. Is anyone finding better distributor pricing in Dhaka? Also curious about local brands — any quality concerns?",
    type: "GENERAL",
    status: "OPEN",
    budget: null,
    needByDate: null,
    image: null,
    upvoteCount: 9,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["DAIRY", "GROCERIES"],
    tags: ["dairy"],
    comments: [
      { id: "demo-post-c-6", createdAt: token(-5, -9), authorId: "demo-buyer-1", content: "We pay BDT 972 with monthly volume (>100 packs). Ask for the distributor slab, not the retail rate." },
      { id: "demo-post-c-7", createdAt: token(-5, -5), authorId: "demo-supplier-5", content: "Local brands: Arong 1kg is BDT 940 for us. Quality is consistent. Happy to quote." },
      { id: "demo-post-c-8", createdAt: token(-4, -3), authorId: "demo-supplier-2", content: "Bashundhara Food — we can do BDT 955 for 50+ packs with VAT invoice." },
    ],
    votes: [
      { id: "demo-post-v-10", userId: "demo-buyer-1", type: "UPVOTE" },
      { id: "demo-post-v-11", userId: "demo-supplier-5", type: "UPVOTE" },
      { id: "demo-post-v-12", userId: "demo-supplier-2", type: "UPVOTE" },
      { id: "demo-post-v-13", userId: "demo-buyer-2", type: "UPVOTE" },
    ],
    fulfillments: [],
  },
  {
    id: "demo-post-5",
    createdAt: token(-8, 0),
    updatedAt: token(-7, 0),
    authorId: "demo-buyer-1",
    title: "How do you handle expiry losses on dairy?",
    content: "We lose ~3% of dairy stock to expiry every month. Do you discount early, bundle, or return to supplier? Would love to hear what works in Dhaka.",
    type: "GENERAL",
    status: "OPEN",
    budget: null,
    needByDate: null,
    image: null,
    upvoteCount: 15,
    downvoteCount: 1,
    commentCount: 0,
    categories: ["DAIRY"],
    tags: ["dairy"],
    comments: [
      { id: "demo-post-c-9", createdAt: token(-7, -7), authorId: DEMO_USER_ID, content: "We run the expiry tracker weekly. 35% off at 5 days left clears most of it. Bundling with biscuits works well too." },
      { id: "demo-post-c-10", createdAt: token(-6, -4), authorId: "demo-supplier-5", content: "Our dairy is supplier-managed — we swap near-expiry stock on the next delivery. Ask your distributor for that." },
      { id: "demo-post-c-11", createdAt: token(-5, -2), authorId: "demo-buyer-2", content: "We use the clearance suggestions from OptiBot. It cut our dairy loss from 3% to ~1%." },
    ],
    votes: [
      { id: "demo-post-v-14", userId: DEMO_USER_ID, type: "UPVOTE" },
      { id: "demo-post-v-15", userId: "demo-supplier-5", type: "UPVOTE" },
      { id: "demo-post-v-16", userId: "demo-buyer-2", type: "UPVOTE" },
      { id: "demo-post-v-17", userId: "demo-supplier-4", type: "UPVOTE" },
      { id: "demo-post-v-18", userId: "demo-supplier-6", type: "DOWNVOTE" },
    ],
    fulfillments: [],
  },
  {
    id: "demo-post-6",
    createdAt: token(-9, 0),
    updatedAt: token(-9, 0),
    authorId: DEMO_USER_ID,
    title: "Eid season demand forecasting tips",
    content: "Sharing what worked for us last Eid: semai sales spike 5x in the last 10 days, milk powder 3x, dates 4x. Stock up 2 weeks before, not 1. What are others seeing?",
    type: "GENERAL",
    status: "OPEN",
    budget: null,
    needByDate: null,
    image: null,
    upvoteCount: 11,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["GROCERIES", "FMCG"],
    tags: ["eid-stock"],
    comments: [
      { id: "demo-post-c-12", createdAt: token(-8, -6), authorId: "demo-buyer-2", content: "Same pattern here — plus cooking oil goes up 2.5x. Booking freight early is the real pain point." },
      { id: "demo-post-c-13", createdAt: token(-7, -3), authorId: "demo-supplier-6", content: "We pre-allocate rice stock for Eid orders in the last 3 weeks. Reserve early." },
    ],
    votes: [
      { id: "demo-post-v-19", userId: "demo-buyer-2", type: "UPVOTE" },
      { id: "demo-post-v-20", userId: "demo-supplier-6", type: "UPVOTE" },
      { id: "demo-post-v-21", userId: "demo-buyer-1", type: "UPVOTE" },
    ],
    fulfillments: [],
  },
  {
    id: "demo-post-7",
    createdAt: token(-11, 0),
    updatedAt: token(-10, 0),
    authorId: "demo-supplier-2",
    title: "Surplus packaging boxes — selling below cost",
    content: "300+ double-wall cartons (50x40x30cm) surplus after a campaign. Selling at BDT 25/pc (market ~40). Pickup from Tejgaon. First come first served.",
    type: "GENERAL",
    status: "OPEN",
    budget: null,
    needByDate: null,
    image: null,
    upvoteCount: 5,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["PACKAGING"],
    tags: ["bulk-deal"],
    comments: [
      { id: "demo-post-c-14", createdAt: token(-10, -2), authorId: DEMO_USER_ID, content: "Interested — taking 100. Can I collect tomorrow?" },
    ],
    votes: [
      { id: "demo-post-v-22", userId: DEMO_USER_ID, type: "UPVOTE" },
      { id: "demo-post-v-23", userId: "demo-buyer-1", type: "UPVOTE" },
    ],
    fulfillments: [],
  },
  {
    id: "demo-post-8",
    createdAt: token(-13, 0),
    updatedAt: token(-11, 0),
    authorId: "demo-buyer-1",
    title: "Need egg supply — 50 trays weekly",
    content: "Restaurant in Mirpur needs 50 trays (1500 eggs) weekly. Reliable hatchery or trader? Pricing around BDT 360-380/tray.",
    type: "PROCUREMENT",
    status: "FILLED",
    budget: 19500,
    needByDate: token(5),
    image: null,
    upvoteCount: 7,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["GROCERIES", "MEAT_POULTRY"],
    tags: ["wholesale", "poultry"],
    comments: [
      { id: "demo-post-c-15", createdAt: token(-12, -4), authorId: "demo-supplier-4", content: "We supply 100+ restaurants. Eggs at BDT 375/tray with weekly contract." },
      { id: "demo-post-c-16", createdAt: token(-11, -1), authorId: DEMO_USER_ID, content: "I can do 50 trays/week at BDT 395 — small margin but happy to help out a fellow Mirpur business." },
    ],
    votes: [
      { id: "demo-post-v-24", userId: "demo-supplier-4", type: "UPVOTE" },
      { id: "demo-post-v-25", userId: DEMO_USER_ID, type: "UPVOTE" },
    ],
    fulfillments: [
      { id: "demo-post-f-6", createdAt: token(-12, -3), supplierId: "demo-supplier-4", message: "50 trays/week at BDT 375/tray, delivered every Saturday. Contract pricing available.", price: 18750, estimatedDelivery: token(4), status: "ACCEPTED" },
    ],
  },
  {
    id: "demo-post-9",
    createdAt: token(-14, 0),
    updatedAt: token(-14, 0),
    authorId: "demo-supplier-5",
    title: "Generator battery suppliers in Rajshahi?",
    content: "Our cold storage needs 2 new batteries for the backup generator. Any verified battery distributors in Rajshahi or nearby? Capacity 200Ah.",
    type: "GENERAL",
    status: "OPEN",
    budget: null,
    needByDate: null,
    image: null,
    upvoteCount: 4,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["ELECTRONICS"],
    tags: [],
    comments: [
      { id: "demo-post-c-17", createdAt: token(-13, -5), authorId: "demo-supplier-10", content: "Rahim Electronics — we ship 200Ah batteries nationwide with warranty. BDT 28,500/pc installed." },
    ],
    votes: [
      { id: "demo-post-v-26", userId: "demo-supplier-10", type: "UPVOTE" },
      { id: "demo-post-v-27", userId: "demo-buyer-1", type: "UPVOTE" },
    ],
    fulfillments: [],
  },
  {
    id: "demo-post-10",
    createdAt: token(-2, -9),
    updatedAt: token(-2, 0),
    authorId: DEMO_USER_ID,
    title: "Co-purchase: sharing a container of dates",
    content: "Importing 1 container of premium Khejur dates (2,000kg) before Ramadan. Taking partners at cost + 8% — min 200kg each. BSTI lab-tested. Pickup from Chittagong port or Dhaka delivery.",
    type: "PROCUREMENT",
    status: "OPEN",
    budget: 600000,
    needByDate: token(30),
    image: null,
    upvoteCount: 10,
    downvoteCount: 0,
    commentCount: 0,
    categories: ["GROCERIES"],
    tags: ["bulk-deal", "eid-stock"],
    comments: [
      { id: "demo-post-c-18", createdAt: token(-1, -6), authorId: "demo-buyer-1", content: "In for 300kg. Send the lab report." },
      { id: "demo-post-c-19", createdAt: token(-1, -2), authorId: "demo-buyer-2", content: "Interested — 200kg if the duty math checks out." },
    ],
    votes: [
      { id: "demo-post-v-28", userId: "demo-buyer-1", type: "UPVOTE" },
      { id: "demo-post-v-29", userId: "demo-buyer-2", type: "UPVOTE" },
      { id: "demo-post-v-30", userId: "demo-supplier-12", type: "UPVOTE" },
    ],
    fulfillments: [],
  },
];

// Tag id resolution + comment counts
const TAGS: { id: string; name: string; slug: string }[] = [
  { id: "demo-tag-rice", name: "Rice", slug: "rice" },
  { id: "demo-tag-eid", name: "Eid Stock", slug: "eid-stock" },
  { id: "demo-tag-poultry", name: "Poultry", slug: "poultry" },
  { id: "demo-tag-fish", name: "Fresh Fish", slug: "fresh-fish" },
  { id: "demo-tag-dairy", name: "Dairy", slug: "dairy" },
  { id: "demo-tag-wholesale", name: "Wholesale", slug: "wholesale" },
  { id: "demo-tag-bulk", name: "Bulk Deal", slug: "bulk-deal" },
];
const tagIdBySlug = new Map(TAGS.map((t) => [t.slug, t.id]));
POSTS.forEach((p) => {
  p.tags = p.tags.map((t) => tagIdBySlug.get(t) ?? t);
  p.commentCount = p.comments.length;
});

// ---------------------------------------------------------------------------
// Ratings
// ---------------------------------------------------------------------------

interface Rating {
  id: string;
  createdAt: string;
  raterId: string;
  rateeId: string;
  score: number;
  comment: string | null;
}

const RATINGS: Rating[] = [];
let ratingIndex = 1;
const ratingComment = [
  "Very reliable supply, always on time.",
  "Quality dropped once but they fixed it fast.",
  "Best pricing in the area for bulk orders.",
  "Good communication, delivery as promised.",
  "Consistent quality over 6 months of orders.",
  "Sample was good, bulk order matched it.",
];
function addRating(raterId: string, rateeId: string, score: number, comment?: string) {
  RATINGS.push({
    id: `demo-r-${String(ratingIndex++).padStart(2, "0")}`,
    createdAt: token(-randInt(10, 90), 0),
    raterId,
    rateeId,
    score,
    comment: comment ?? (rand() < 0.7 ? pick(ratingComment) : null),
  });
}
const allOtherUsers = [...BUYERS, ...SUPPLIERS];
allOtherUsers.forEach((u) => {
  addRating(DEMO_USER_ID, u.id, randInt(4, 5));
});
const supplierRatees = SUPPLIERS.slice(0, 9);
supplierRatees.forEach((s) => {
  const raters = [DEMO_USER_ID, ...BUYERS.map((b) => b.id)];
  const count = randInt(2, 4);
  for (let i = 0; i < count; i++) {
    const rater = pick(raters);
    addRating(rater, s.id, randInt(3, 5));
  }
});
addRating("demo-buyer-1", DEMO_USER_ID, 5, "Great store, always fresh stock.");
addRating("demo-buyer-2", DEMO_USER_ID, 4, "Good bulk pricing on staples.");
addRating("demo-supplier-6", DEMO_USER_ID, 5, "Reliable repeat buyer.");

// ---------------------------------------------------------------------------
// Stores + API logs
// ---------------------------------------------------------------------------

interface Store {
  id: string;
  createdAt: string;
  updatedAt: string;
  ownerId: string;
  name: string;
  slug: string;
  apiKey: string;
  isActive: boolean;
  termsAccepted: boolean;
}

interface ApiLog {
  id: string;
  createdAt: string;
  storeId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  ip: string | null;
}

const STORES: Store[] = [
  { id: "demo-store-1", createdAt: token(-120, 0), updatedAt: token(-2, 0), ownerId: DEMO_USER_ID, name: "Dhaka Metro Mart", slug: DEMO_STORE_SLUG, apiKey: DEMO_STORE_API_KEY, isActive: true, termsAccepted: true },
  { id: "demo-store-2", createdAt: token(-40, 0), updatedAt: token(-8, 0), ownerId: DEMO_USER_ID, name: "Gulshan Branch", slug: "gulshan-branch", apiKey: "sk_demo_2f7e1a3b9c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f", isActive: false, termsAccepted: false },
];

const API_LOGS: ApiLog[] = [];
let logIndex = 1;
const logEndpoints: [string, string, number][] = [
  ["/products", "GET", 200],
  ["/products", "GET", 200],
  ["/sales", "POST", 201],
  ["/sales", "GET", 200],
  ["/smart-baskets", "GET", 200],
  ["/check-price", "POST", 200],
  ["/products", "GET", 200],
  ["/sales", "POST", 201],
  ["/products", "GET", 401],
  ["/sales", "GET", 200],
  ["/smart-baskets", "GET", 200],
  ["/products", "GET", 200],
  ["/sales", "POST", 400],
  ["/sales", "GET", 200],
  ["/products", "GET", 200],
  ["/smart-baskets", "GET", 404],
  ["/sales", "GET", 200],
  ["/products", "GET", 200],
  ["/check-price", "POST", 200],
  ["/sales", "POST", 201],
  ["/products", "GET", 200],
  ["/sales", "GET", 200],
];
logEndpoints.forEach(([endpoint, method, statusCode]) => {
  API_LOGS.push({
    id: `demo-log-${String(logIndex++).padStart(2, "0")}`,
    createdAt: token(-randInt(0, 30), -randInt(0, 20)),
    storeId: rand() < 0.85 ? "demo-store-1" : "demo-store-2",
    endpoint,
    method,
    statusCode,
    ip: `103.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`,
  });
});

// ---------------------------------------------------------------------------
// Price compare saved results
// ---------------------------------------------------------------------------

interface PriceCompareResult {
  id: string;
  createdAt: string;
  userId: string;
  productName: string;
  category: string;
  info: string | null;
  city: string | null;
  country: string;
  data: any;
}

const PRICE_COMPARE: PriceCompareResult[] = [
  {
    id: "demo-pc-1",
    createdAt: token(-2, -5),
    userId: DEMO_USER_ID,
    productName: "Miniket Rice 25kg",
    category: "groceries",
    info: "Kataribhog style premium rice",
    city: "Dhaka",
    country: "Bangladesh",
    data: {
      success: true,
      searchQueries: ["Miniket Rice 25kg Dhaka"],
      searchLinks: [],
      exactMatches: [
        { productName: "Miniket Rice - 25kg", source: "Chaldal", sourceLogoUrl: null, price: 1380, currency: "BDT", unitText: "25kg", unitValue: 25, unitName: "kg", unitPrice: 55.2, unitPriceUnit: "kg", pricePerUnit: "BDT 55/kg", matchPercentage: 98, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Premium Miniket Rice 25kg Bag", source: "Daraz", sourceLogoUrl: null, price: 1425, currency: "BDT", unitText: "25kg", unitValue: 25, unitName: "kg", unitPrice: 57, unitPriceUnit: "kg", pricePerUnit: "BDT 57/kg", matchPercentage: 95, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Miniket Rice 25kg (New)", source: "PriyoShop", sourceLogoUrl: null, price: 1395, currency: "BDT", unitText: "25kg", unitValue: 25, unitName: "kg", unitPrice: 55.8, unitPriceUnit: "kg", pricePerUnit: "BDT 56/kg", matchPercentage: 93, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
      ],
      relatedProducts: [],
      totalFound: 3,
      sellerPrice: "BDT 1,380",
      bestPrice: "BDT 1,380 (Chaldal)",
      summary: "Chaldal has the best price for Miniket Rice 25kg at BDT 1,380 — same as your selling price, so no room to undercut without losing margin.",
      sellerSummary: "Your price matches the cheapest market option. Consider bulk-purchase discounts from Bengal Rice & Grains to widen the margin.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    id: "demo-pc-2",
    createdAt: token(-5, -2),
    userId: DEMO_USER_ID,
    productName: "Broiler Chicken 1kg",
    category: "groceries",
    info: "whole chicken",
    city: "Dhaka",
    country: "Bangladesh",
    data: {
      success: true,
      searchQueries: ["Broiler Chicken 1kg Dhaka"],
      searchLinks: [],
      exactMatches: [
        { productName: "Broiler Chicken (Whole) 1kg", source: "Chaldal", sourceLogoUrl: null, price: 218, currency: "BDT", unitText: "1kg", unitValue: 1, unitName: "kg", unitPrice: 218, unitPriceUnit: "kg", pricePerUnit: "BDT 218/kg", matchPercentage: 99, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Fresh Broiler Chicken - 1kg", source: "Meena Click", sourceLogoUrl: null, price: 225, currency: "BDT", unitText: "1kg", unitValue: 1, unitName: "kg", unitPrice: 225, unitPriceUnit: "kg", pricePerUnit: "BDT 225/kg", matchPercentage: 97, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Broiler Chicken 1kg Frozen", source: "PriyoShop", sourceLogoUrl: null, price: 205, currency: "BDT", unitText: "1kg", unitValue: 1, unitName: "kg", unitPrice: 205, unitPriceUnit: "kg", pricePerUnit: "BDT 205/kg", matchPercentage: 88, productUrl: "#", imageUrl: null, availability: "Low stock", notes: "Frozen, not fresh" },
      ],
      relatedProducts: [],
      totalFound: 3,
      sellerPrice: "BDT 212",
      bestPrice: "BDT 205 (PriyoShop, frozen)",
      summary: "Fresh chicken: Chaldal leads at BDT 218 vs your BDT 212 — you're BDT 6 cheaper. Only PriyoShop's frozen variant (BDT 205) undercuts you.",
      sellerSummary: "You're competitive on fresh chicken. Keep the price; margin is thin (BDT 24/kg) so watch supplier costs.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    id: "demo-pc-3",
    createdAt: token(-7, -4),
    userId: DEMO_USER_ID,
    productName: "Soybean Oil 5L",
    category: "groceries",
    info: "Teer or Rupchanda brand",
    city: "Dhaka",
    country: "Bangladesh",
    data: {
      success: true,
      searchQueries: ["Soybean Oil 5L Dhaka"],
      searchLinks: [],
      exactMatches: [
        { productName: "Teer Soybean Oil 5L", source: "Chaldal", sourceLogoUrl: null, price: 1195, currency: "BDT", unitText: "5L", unitValue: 5, unitName: "L", unitPrice: 239, unitPriceUnit: "L", pricePerUnit: "BDT 239/L", matchPercentage: 96, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Rupchanda Soybean Oil 5L", source: "Daraz", sourceLogoUrl: null, price: 1210, currency: "BDT", unitText: "5L", unitValue: 5, unitName: "L", unitPrice: 242, unitPriceUnit: "L", pricePerUnit: "BDT 242/L", matchPercentage: 94, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Fresh Soybean Oil 5L Tin", source: "Meena Click", sourceLogoUrl: null, price: 1200, currency: "BDT", unitText: "5L", unitValue: 5, unitName: "L", unitPrice: 240, unitPriceUnit: "L", pricePerUnit: "BDT 240/L", matchPercentage: 91, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
      ],
      relatedProducts: [],
      totalFound: 3,
      sellerPrice: "BDT 1,180",
      bestPrice: "BDT 1,180 (Your price)",
      summary: "Your BDT 1,180 beats every online market price — cheapest by BDT 15-30 per tin. Strong position for volume.",
      sellerSummary: "You're the cheapest in the market. Consider a 2-tin bundle deal to increase basket size.",
      timestamp: new Date().toISOString(),
    },
  },
  {
    id: "demo-pc-4",
    createdAt: token(-9, -3),
    userId: DEMO_USER_ID,
    productName: "Samsung Galaxy A16 128GB",
    category: "electronics",
    info: "official warranty",
    city: "Dhaka",
    country: "Bangladesh",
    data: {
      success: true,
      searchQueries: ["Samsung Galaxy A16 128GB Bangladesh"],
      searchLinks: [],
      exactMatches: [
        { productName: "Samsung Galaxy A16 128GB (Official)", source: "Daraz", sourceLogoUrl: null, price: 24999, currency: "BDT", unitText: "1pc", unitValue: 1, unitName: "pc", unitPrice: 24999, unitPriceUnit: "pc", pricePerUnit: "BDT 24,999/pc", matchPercentage: 95, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Galaxy A16 128GB 4G", source: "Pickaboo", sourceLogoUrl: null, price: 24500, currency: "BDT", unitText: "1pc", unitValue: 1, unitName: "pc", unitPrice: 24500, unitPriceUnit: "pc", pricePerUnit: "BDT 24,500/pc", matchPercentage: 92, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
      ],
      relatedProducts: [],
      totalFound: 2,
      sellerPrice: null,
      bestPrice: "BDT 24,500 (Pickaboo)",
      summary: "Pickaboo offers the A16 at BDT 24,500 — BDT 499 below Daraz. Prices cluster around BDT 24.5-25k.",
      sellerSummary: null,
      timestamp: new Date().toISOString(),
    },
  },
  {
    id: "demo-pc-5",
    createdAt: token(-12, -6),
    userId: DEMO_USER_ID,
    productName: "Chicken Eggs 30pc",
    category: "groceries",
    info: "fresh farm eggs tray",
    city: "Dhaka",
    country: "Bangladesh",
    data: {
      success: true,
      searchQueries: ["Eggs 30 pcs tray Dhaka"],
      searchLinks: [],
      exactMatches: [
        { productName: "Farm Eggs 30pc Tray", source: "Chaldal", sourceLogoUrl: null, price: 410, currency: "BDT", unitText: "30pc", unitValue: 30, unitName: "pc", unitPrice: 13.7, unitPriceUnit: "pc", pricePerUnit: "BDT 13.7/pc", matchPercentage: 97, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
        { productName: "Fresh Eggs 30pcs", source: "Daraz", sourceLogoUrl: null, price: 425, currency: "BDT", unitText: "30pc", unitValue: 30, unitName: "pc", unitPrice: 14.2, unitPriceUnit: "pc", pricePerUnit: "BDT 14.2/pc", matchPercentage: 94, productUrl: "#", imageUrl: null, availability: "In stock", notes: null },
      ],
      relatedProducts: [],
      totalFound: 2,
      sellerPrice: "BDT 395",
      bestPrice: "BDT 395 (Your price)",
      summary: "Your tray price of BDT 395 undercuts Chaldal (BDT 410) and Daraz (BDT 425). Strong competitive edge.",
      sellerSummary: "Best price in market. Eggs are a traffic item — use them to pull footfall, upsell milk and bread at checkout.",
      timestamp: new Date().toISOString(),
    },
  },
];

// ---------------------------------------------------------------------------
// Write files
// ---------------------------------------------------------------------------

mkdirSync(OUT_DIR, { recursive: true });
const files: Record<string, unknown> = {
  "users.json": USERS,
  "products.json": PRODUCTS,
  "sales.json": SALES,
  "sale-items.json": SALE_ITEMS,
  "chats.json": CHATS,
  "smart-baskets.json": SMART_BASKETS,
  "procurement.json": PROCUREMENT,
  "posts.json": POSTS,
  "tags.json": TAGS,
  "ratings.json": RATINGS,
  "stores.json": STORES,
  "api-logs.json": API_LOGS,
  "price-compare.json": PRICE_COMPARE,
};

for (const [name, data] of Object.entries(files)) {
  writeFileSync(join(OUT_DIR, name), JSON.stringify(data, null, 2));
}

console.log(`Demo data generated → ${OUT_DIR}`);
console.log(`  users: ${USERS.length}, products: ${PRODUCTS.length} (demo: ${DEMO_PRODUCTS.length})`);
console.log(`  sales: ${SALES.length}, sale items: ${SALE_ITEMS.length}`);
console.log(`  chats: ${CHATS.length}, baskets: ${SMART_BASKETS.length}`);
console.log(`  procurement: ${PROCUREMENT.length}, posts: ${POSTS.length}, ratings: ${RATINGS.length}`);
console.log(`  stores: ${STORES.length}, api logs: ${API_LOGS.length}, price compares: ${PRICE_COMPARE.length}`);

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Category, StockUnit } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "085a0249-c96f-46b8-abbb-0f379db82099";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to your environment before running the seed script.");
  process.exit(1);
}

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

const SEED_CATALOG = [
  { category: Category.GROCERIES, name: "Basmati Rice 5kg", unit: StockUnit.KG, costPrice: 420, sellingPrice: 520, quantity: 90, minStock: 20 },
  { category: Category.GROCERIES, name: "Chana Dal Premium", unit: StockUnit.KG, costPrice: 110, sellingPrice: 145, quantity: 70, minStock: 15 },
  { category: Category.FMCG, name: "Lemon Dishwash 500ml", unit: StockUnit.BOTTLE, costPrice: 55, sellingPrice: 79, quantity: 140, minStock: 40 },
  { category: Category.FMCG, name: "Daily Toothpaste 140g", unit: StockUnit.PCS, costPrice: 35, sellingPrice: 55, quantity: 220, minStock: 60 },
  { category: Category.FRESH_PRODUCE, name: "Fresh Tomatoes 1kg", unit: StockUnit.KG, costPrice: 45, sellingPrice: 60, quantity: 45, minStock: 10 },
  { category: Category.FRESH_PRODUCE, name: "Bananas 12pc", unit: StockUnit.DOZEN, costPrice: 30, sellingPrice: 45, quantity: 80, minStock: 12 },
  { category: Category.AGRO_PRODUCTS, name: "Wheat Flour 25kg", unit: StockUnit.KG, costPrice: 980, sellingPrice: 1180, quantity: 35, minStock: 8 },
  { category: Category.AGRO_PRODUCTS, name: "Mustard Oil 5L", unit: StockUnit.LITER, costPrice: 620, sellingPrice: 750, quantity: 50, minStock: 10 },
  { category: Category.FISHERY_SEAFOOD, name: "Hilsa Fish 1kg", unit: StockUnit.KG, costPrice: 820, sellingPrice: 980, quantity: 25, minStock: 6 },
  { category: Category.FISHERY_SEAFOOD, name: "Prawns Medium 1kg", unit: StockUnit.KG, costPrice: 540, sellingPrice: 690, quantity: 30, minStock: 8 },
  { category: Category.MEAT_POULTRY, name: "Chicken Breast 1kg", unit: StockUnit.KG, costPrice: 260, sellingPrice: 340, quantity: 40, minStock: 10 },
  { category: Category.MEAT_POULTRY, name: "Beef Curry Cut 1kg", unit: StockUnit.KG, costPrice: 520, sellingPrice: 640, quantity: 28, minStock: 6 },
  { category: Category.DAIRY, name: "Full Cream Milk 1L", unit: StockUnit.LITER, costPrice: 55, sellingPrice: 75, quantity: 130, minStock: 30 },
  { category: Category.DAIRY, name: "Cheddar Cheese 500g", unit: StockUnit.PACK, costPrice: 190, sellingPrice: 240, quantity: 60, minStock: 12 },
  { category: Category.ELECTRONICS, name: "LED Bulb 12W", unit: StockUnit.PCS, costPrice: 85, sellingPrice: 120, quantity: 90, minStock: 20 },
  { category: Category.ELECTRONICS, name: "Smart Power Strip", unit: StockUnit.PCS, costPrice: 420, sellingPrice: 560, quantity: 40, minStock: 8 },
  { category: Category.MOBILE_ACCESSORIES, name: "Type-C Cable 1m", unit: StockUnit.PCS, costPrice: 60, sellingPrice: 90, quantity: 160, minStock: 40 },
  { category: Category.MOBILE_ACCESSORIES, name: "Wireless Earbuds", unit: StockUnit.PCS, costPrice: 850, sellingPrice: 1090, quantity: 35, minStock: 6 },
  { category: Category.CLOTHING, name: "Cotton T-Shirt", unit: StockUnit.PCS, costPrice: 220, sellingPrice: 320, quantity: 75, minStock: 15 },
  { category: Category.CLOTHING, name: "Denim Jeans", unit: StockUnit.PCS, costPrice: 680, sellingPrice: 890, quantity: 45, minStock: 10 },
  { category: Category.TEXTILES_APPAREL, name: "Polyester Fabric 30m", unit: StockUnit.METER, costPrice: 1800, sellingPrice: 2250, quantity: 18, minStock: 4 },
  { category: Category.TEXTILES_APPAREL, name: "Cotton Twill Fabric 20m", unit: StockUnit.METER, costPrice: 1500, sellingPrice: 1900, quantity: 20, minStock: 4 },
  { category: Category.FOOTWEAR, name: "Running Shoes", unit: StockUnit.PCS, costPrice: 980, sellingPrice: 1280, quantity: 32, minStock: 6 },
  { category: Category.FOOTWEAR, name: "Leather Sandals", unit: StockUnit.PCS, costPrice: 520, sellingPrice: 690, quantity: 50, minStock: 10 },
  { category: Category.BEAUTY_PERSONAL_CARE, name: "Shampoo 650ml", unit: StockUnit.BOTTLE, costPrice: 190, sellingPrice: 260, quantity: 110, minStock: 25 },
  { category: Category.BEAUTY_PERSONAL_CARE, name: "Body Lotion 400ml", unit: StockUnit.BOTTLE, costPrice: 210, sellingPrice: 290, quantity: 90, minStock: 20 },
  { category: Category.HOME_APPLIANCE, name: "Mixer Grinder 750W", unit: StockUnit.PCS, costPrice: 1950, sellingPrice: 2350, quantity: 25, minStock: 5 },
  { category: Category.HOME_APPLIANCE, name: "Electric Kettle 1.8L", unit: StockUnit.PCS, costPrice: 650, sellingPrice: 820, quantity: 40, minStock: 8 },
  { category: Category.FURNITURE, name: "Plastic Chair", unit: StockUnit.PCS, costPrice: 420, sellingPrice: 590, quantity: 60, minStock: 12 },
  { category: Category.FURNITURE, name: "Office Desk", unit: StockUnit.PCS, costPrice: 2600, sellingPrice: 3200, quantity: 18, minStock: 4 },
  { category: Category.HARDWARE, name: "Hammer 16oz", unit: StockUnit.PCS, costPrice: 180, sellingPrice: 240, quantity: 70, minStock: 15 },
  { category: Category.HARDWARE, name: "Screwdriver Set 12pc", unit: StockUnit.BOX, costPrice: 420, sellingPrice: 540, quantity: 45, minStock: 8 },
  { category: Category.CONSTRUCTION_MATERIALS, name: "Portland Cement 50kg", unit: StockUnit.KG, costPrice: 560, sellingPrice: 720, quantity: 65, minStock: 15 },
  { category: Category.CONSTRUCTION_MATERIALS, name: "Rebar Steel 10mm", unit: StockUnit.METER, costPrice: 2100, sellingPrice: 2450, quantity: 30, minStock: 6 },
  { category: Category.AUTO_PARTS, name: "Engine Oil 4L", unit: StockUnit.CAN, costPrice: 980, sellingPrice: 1250, quantity: 40, minStock: 8 },
  { category: Category.AUTO_PARTS, name: "Car Air Filter", unit: StockUnit.PCS, costPrice: 240, sellingPrice: 320, quantity: 55, minStock: 10 },
  { category: Category.PHARMACY, name: "Paracetamol 500mg", unit: StockUnit.PACK, costPrice: 40, sellingPrice: 65, quantity: 180, minStock: 50 },
  { category: Category.PHARMACY, name: "Oral Rehydration Salts", unit: StockUnit.PACK, costPrice: 12, sellingPrice: 20, quantity: 260, minStock: 80 },
  { category: Category.STATIONERY, name: "Ball Pen Pack", unit: StockUnit.PACK, costPrice: 40, sellingPrice: 60, quantity: 150, minStock: 40 },
  { category: Category.STATIONERY, name: "Notebook A4 200p", unit: StockUnit.PCS, costPrice: 65, sellingPrice: 90, quantity: 120, minStock: 30 },
  { category: Category.OFFICE_SUPPLIES, name: "Printer Paper A4 500", unit: StockUnit.PACK, costPrice: 240, sellingPrice: 310, quantity: 70, minStock: 15 },
  { category: Category.OFFICE_SUPPLIES, name: "Stapler Heavy Duty", unit: StockUnit.PCS, costPrice: 180, sellingPrice: 250, quantity: 50, minStock: 10 },
  { category: Category.PACKAGING, name: "Corrugated Box 12x12", unit: StockUnit.PCS, costPrice: 22, sellingPrice: 35, quantity: 200, minStock: 60 },
  { category: Category.PACKAGING, name: "Stretch Film Roll", unit: StockUnit.ROLL, costPrice: 320, sellingPrice: 420, quantity: 45, minStock: 10 },
  { category: Category.CHEMICALS, name: "Isopropyl Alcohol 1L", unit: StockUnit.LITER, costPrice: 260, sellingPrice: 340, quantity: 55, minStock: 12 },
  { category: Category.CHEMICALS, name: "Liquid Detergent Base 5L", unit: StockUnit.LITER, costPrice: 520, sellingPrice: 680, quantity: 35, minStock: 8 },
  { category: Category.PLASTICS, name: "Food Container Set", unit: StockUnit.PACK, costPrice: 95, sellingPrice: 140, quantity: 120, minStock: 30 },
  { category: Category.PLASTICS, name: "HDPE Bottle 1L", unit: StockUnit.PCS, costPrice: 12, sellingPrice: 20, quantity: 400, minStock: 120 },
  { category: Category.RESTAURANT_SUPPLY, name: "Stainless Serving Tray", unit: StockUnit.PCS, costPrice: 260, sellingPrice: 340, quantity: 60, minStock: 12 },
  { category: Category.RESTAURANT_SUPPLY, name: "Nonstick Frypan 28cm", unit: StockUnit.PCS, costPrice: 520, sellingPrice: 690, quantity: 40, minStock: 8 },
  { category: Category.HOSPITALITY_SUPPLY, name: "Hotel Bed Sheet", unit: StockUnit.PCS, costPrice: 480, sellingPrice: 620, quantity: 70, minStock: 15 },
  { category: Category.HOSPITALITY_SUPPLY, name: "Bath Towel 600gsm", unit: StockUnit.PCS, costPrice: 260, sellingPrice: 340, quantity: 90, minStock: 20 },
  { category: Category.OTHER, name: "Utility Gloves", unit: StockUnit.PACK, costPrice: 60, sellingPrice: 95, quantity: 120, minStock: 30 },
  { category: Category.OTHER, name: "Cable Ties 100pc", unit: StockUnit.PACK, costPrice: 45, sellingPrice: 70, quantity: 150, minStock: 40 },
];

function buildSku(category: string, index: number) {
  const prefix = category.replace(/_/g, "").slice(0, 6).toUpperCase();
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function buildBarcode(index: number) {
  const base = String(880000000000 + index).slice(0, 12);
  return base;
}

async function seed() {
  const existingCount = await prisma.product.count({
    where: { ownerId: userId },
  });

  if (existingCount > 0 && !force) {
    console.log(`User ${userId} already has ${existingCount} products. Use --force to add anyway.`);
    return;
  }

  const data = SEED_CATALOG.map((item, index) => ({
    ownerId: userId,
    name: item.name,
    description: (item as any).description ?? `${item.name} for daily inventory operations.`,
    category: item.category,
    costPrice: item.costPrice,
    sellingPrice: item.sellingPrice,
    quantity: item.quantity,
    unit: item.unit,
    minStock: item.minStock ?? null,
    sku: buildSku(item.category, index),
    barcode: buildBarcode(index + 1),
    imageLink: `https://picsum.photos/seed/${item.name.replace(/\s+/g, '-').toLowerCase()}-${index}/400/300.jpg`,
    isActive: true,
  }));

  const result = await prisma.product.createMany({ data });
  console.log(`Seeded ${result.count} products for user ${userId}.`);
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Category, StockUnit, PaymentStatus } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "290ad905-f363-406f-ba5e-3195719419a3";

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

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function hoursFromNow(hours: number): Date {
  const d = new Date();
  d.setHours(d.getHours() + hours);
  return d;
}

function randomDateInRange(startDays: number, endDays: number): Date {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + startDays);
  const end = new Date(now);
  end.setDate(end.getDate() + endDays);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const CUSTOMER_NAMES = [
  "Kamal Hossain", "Rahim Ahmed", "Fatema Begum", "Salma Khatun", "Abdul Jabbar",
  "Nasrin Akter", "Jahangir Alam", "Rupa Das", "Mizanur Rahman", "Shirin Sultana",
];

function generatePhone(): string {
  const prefixes = ["017", "018", "019", "013", "014", "015", "016"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  return `${prefix}${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function generateInvoiceNumber(date: Date, index: number): string {
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `EXP-INV-${y}${m}${d}-${String(index).padStart(4, "0")}`;
}

// --- PERISHABLE PRODUCTS CATALOG ---
// Each product has: name, category, unit, costPrice, sellingPrice, quantity, minStock,
// expiryDays: relative to now (positive = future, negative = past), salesVelocity: "fast"|"slow"|"none"
const PERISHABLE_CATALOG = [
  // === ALREADY EXPIRED (negative days) ===
  { name: "Yogurt Drink 250ml (Expired)", category: Category.DAIRY, unit: StockUnit.BOTTLE, costPrice: 18, sellingPrice: 30, quantity: 48, minStock: 12, expiryDays: -5, salesVelocity: "slow" as const, salesCount: 30 },
  { name: "Fresh Paneer 200g (Expired)", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 55, sellingPrice: 80, quantity: 24, minStock: 6, expiryDays: -12, salesVelocity: "none" as const, salesCount: 0 },
  { name: "Mixed Salad Pack (Expired)", category: Category.FRESH_PRODUCE, unit: StockUnit.PACK, costPrice: 40, sellingPrice: 65, quantity: 36, minStock: 8, expiryDays: -2, salesVelocity: "slow" as const, salesCount: 15 },
  { name: "Sliced Bread 500g (Expired)", category: Category.GROCERIES, unit: StockUnit.PACK, costPrice: 32, sellingPrice: 50, quantity: 60, minStock: 15, expiryDays: -8, salesVelocity: "fast" as const, salesCount: 80 },

  // === EXPIRING SOON (0-7 days) ===
  { name: "Fresh Mozzarella 250g", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 120, sellingPrice: 180, quantity: 30, minStock: 8, expiryDays: 2, salesVelocity: "slow" as const, salesCount: 10 },
  { name: "Chicken Sausage 500g", category: Category.MEAT_POULTRY, unit: StockUnit.PACK, costPrice: 140, sellingPrice: 210, quantity: 40, minStock: 10, expiryDays: 3, salesVelocity: "slow" as const, salesCount: 8 },
  { name: "Cottage Cheese 400g", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 85, sellingPrice: 130, quantity: 25, minStock: 6, expiryDays: 4, salesVelocity: "none" as const, salesCount: 0 },
  { name: "Fresh Orange Juice 1L", category: Category.FMCG, unit: StockUnit.BOTTLE, costPrice: 65, sellingPrice: 100, quantity: 50, minStock: 12, expiryDays: 5, salesVelocity: "slow" as const, salesCount: 12 },
  { name: "Smoked Salmon 200g", category: Category.FISHERY_SEAFOOD, unit: StockUnit.PACK, costPrice: 350, sellingPrice: 520, quantity: 15, minStock: 4, expiryDays: 6, salesVelocity: "slow" as const, salesCount: 5 },
  { name: "Mayonnaise 500ml", category: Category.FMCG, unit: StockUnit.BOTTLE, costPrice: 90, sellingPrice: 140, quantity: 35, minStock: 8, expiryDays: 7, salesVelocity: "slow" as const, salesCount: 18 },

  // === EXPIRING SOON (0-7 days) - fast movers ===
  { name: "Fresh Milk 1L", category: Category.DAIRY, unit: StockUnit.LITER, costPrice: 55, sellingPrice: 80, quantity: 100, minStock: 25, expiryDays: 3, salesVelocity: "fast" as const, salesCount: 200 },
  { name: "Paneer 500g", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 140, sellingPrice: 200, quantity: 20, minStock: 5, expiryDays: 5, salesVelocity: "fast" as const, salesCount: 60 },

  // === EXPIRING (8-30 days) ===
  { name: "Butter 500g", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 150, sellingPrice: 230, quantity: 45, minStock: 10, expiryDays: 12, salesVelocity: "slow" as const, salesCount: 22 },
  { name: "Mixed Nuts 400g", category: Category.GROCERIES, unit: StockUnit.PACK, costPrice: 280, sellingPrice: 390, quantity: 30, minStock: 8, expiryDays: 15, salesVelocity: "slow" as const, salesCount: 14 },
  { name: "Pasta Sauce 350g", category: Category.GROCERIES, unit: StockUnit.BOTTLE, costPrice: 75, sellingPrice: 120, quantity: 55, minStock: 12, expiryDays: 18, salesVelocity: "slow" as const, salesCount: 9 },
  { name: "Hummus 300g", category: Category.FRESH_PRODUCE, unit: StockUnit.PACK, costPrice: 95, sellingPrice: 150, quantity: 28, minStock: 6, expiryDays: 20, salesVelocity: "none" as const, salesCount: 0 },
  { name: "Tofu 400g", category: Category.FRESH_PRODUCE, unit: StockUnit.PACK, costPrice: 70, sellingPrice: 110, quantity: 22, minStock: 5, expiryDays: 22, salesVelocity: "slow" as const, salesCount: 6 },
  { name: "Sour Cream 300ml", category: Category.DAIRY, unit: StockUnit.BOTTLE, costPrice: 60, sellingPrice: 95, quantity: 40, minStock: 10, expiryDays: 25, salesVelocity: "slow" as const, salesCount: 12 },
  { name: "Eggs 30pc Tray", category: Category.DAIRY, unit: StockUnit.PACK, costPrice: 160, sellingPrice: 230, quantity: 60, minStock: 15, expiryDays: 14, salesVelocity: "fast" as const, salesCount: 150 },
  { name: "Baking Flour 2kg", category: Category.GROCERIES, unit: StockUnit.PACK, costPrice: 85, sellingPrice: 130, quantity: 70, minStock: 15, expiryDays: 28, salesVelocity: "fast" as const, salesCount: 90 },

  // === FRESH (31+ days) ===
  { name: "Long Life Milk 1L UHT", category: Category.DAIRY, unit: StockUnit.LITER, costPrice: 70, sellingPrice: 105, quantity: 80, minStock: 20, expiryDays: 90, salesVelocity: "fast" as const, salesCount: 180 },
  { name: "Canned Tomatoes 400g", category: Category.GROCERIES, unit: StockUnit.CAN, costPrice: 45, sellingPrice: 75, quantity: 120, minStock: 30, expiryDays: 365, salesVelocity: "fast" as const, salesCount: 100 },
  { name: "Pasta 500g", category: Category.GROCERIES, unit: StockUnit.PACK, costPrice: 35, sellingPrice: 55, quantity: 150, minStock: 40, expiryDays: 540, salesVelocity: "fast" as const, salesCount: 130 },
  { name: "Cooking Oil 5L", category: Category.GROCERIES, unit: StockUnit.LITER, costPrice: 650, sellingPrice: 800, quantity: 40, minStock: 8, expiryDays: 180, salesVelocity: "fast" as const, salesCount: 75 },
  { name: "Rice 25kg Bag", category: Category.GROCERIES, unit: StockUnit.KG, costPrice: 1100, sellingPrice: 1350, quantity: 25, minStock: 5, expiryDays: 365, salesVelocity: "fast" as const, salesCount: 40 },

  // === NO EXPIRY ===
  { name: "Salt 1kg", category: Category.GROCERIES, unit: StockUnit.PACK, costPrice: 18, sellingPrice: 30, quantity: 200, minStock: 50, expiryDays: null, salesVelocity: "fast" as const, salesCount: 300 },
  { name: "Sugar 1kg", category: Category.GROCERIES, unit: StockUnit.KG, costPrice: 70, sellingPrice: 100, quantity: 180, minStock: 40, expiryDays: null, salesVelocity: "fast" as const, salesCount: 250 },
  { name: "Dish Soap 500ml", category: Category.FMCG, unit: StockUnit.BOTTLE, costPrice: 55, sellingPrice: 85, quantity: 100, minStock: 25, expiryDays: null, salesVelocity: "fast" as const, salesCount: 160 },
  { name: "Toothbrush Pack", category: Category.BEAUTY_PERSONAL_CARE, unit: StockUnit.PACK, costPrice: 80, sellingPrice: 130, quantity: 90, minStock: 20, expiryDays: null, salesVelocity: "fast" as const, salesCount: 110 },
  { name: "Notebook A5", category: Category.STATIONERY, unit: StockUnit.PCS, costPrice: 45, sellingPrice: 75, quantity: 140, minStock: 35, expiryDays: null, salesVelocity: "slow" as const, salesCount: 25 },
];

function buildSku(category: string, index: number) {
  const prefix = category.replace(/_/g, "").slice(0, 6).toUpperCase();
  return `EXP-${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function buildBarcode(index: number) {
  const base = String(889900000000 + index).slice(0, 12);
  return base;
}

async function seed() {
  console.log(`\n=== Seeding Expiry Test Data for User ${userId} ===\n`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User ${userId} not found!`);
    process.exit(1);
  }
  console.log(`User: ${user.name ?? userId}\n`);

  const existingCount = await prisma.product.count({ where: { ownerId: userId } });
  if (existingCount > 0 && !force) {
    console.log(`User already has ${existingCount} products. Use --force to delete & reseed.`);
    console.log("Run: npx tsx scripts/seed-expiry-data.ts --force");
    return;
  }

  if (force) {
    console.log("--force: Deleting existing sales & products...");
    await prisma.saleItem.deleteMany({ where: { sale: { ownerId: userId } } });
    await prisma.sale.deleteMany({ where: { ownerId: userId } });
    await prisma.bundleItem.deleteMany({ where: { bundle: { ownerId: userId } } });
    await prisma.bundle.deleteMany({ where: { ownerId: userId } });
    await prisma.smartBasketItem.deleteMany({ where: { basket: { ownerId: userId } } });
    await prisma.smartBasket.deleteMany({ where: { ownerId: userId } });
    await prisma.product.deleteMany({ where: { ownerId: userId } });
    console.log("Cleared.\n");
  }

  // ── STEP 1: Create products with expiry dates ──
  console.log("Creating perishable products...\n");

  const createdProducts = [];
  for (let i = 0; i < PERISHABLE_CATALOG.length; i++) {
    const item = PERISHABLE_CATALOG[i];
    const expiryDate = item.expiryDays !== null ? daysFromNow(item.expiryDays) : null;

    const product = await prisma.product.create({
      data: {
        ownerId: userId,
        name: item.name,
        description: `${item.name} for retail sale.`,
        category: item.category,
        costPrice: item.costPrice,
        sellingPrice: item.sellingPrice,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        sku: buildSku(item.category, i),
        barcode: buildBarcode(i + 1),
        imageLink: `https://picsum.photos/seed/exp-${item.name.replace(/\s+/g, "-").toLowerCase()}-${i}/400/300.jpg`,
        isActive: true,
        expiryDate,
        batchNumber: expiryDate ? `BATCH-${expiryDate.toISOString().slice(0, 10)}` : null,
      },
    });
    createdProducts.push(product);

    const expiryLabel = expiryDate
      ? `${item.expiryDays! > 0 ? "+" : ""}${item.expiryDays!}d`
      : "none";
    console.log(`  [${String(i + 1).padStart(2, " ")}] ${item.name.padEnd(45, ".")} expiry: ${expiryLabel.padStart(6, " ")}  qty: ${String(item.quantity).padStart(4, " ")}`);
  }

  console.log(`\n✅ Created ${createdProducts.length} products.\n`);

  // ── STEP 2: Create sales data with varying velocity ──
  console.log("Generating sales transactions...\n");

  let totalSales = 0;
  let saleIndex = 0;
  const now = new Date();
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  for (const product of createdProducts) {
    const catalogItem = PERISHABLE_CATALOG.find((c) => c.name === product.name);
    if (!catalogItem) continue;

    const salesCount = catalogItem.salesCount;
    if (salesCount === 0) {
      console.log(`  [NO SALES] ${product.name}`);
      continue;
    }

    // Distribute sales over the last 60 days
    const salesDates: Date[] = [];
    for (let s = 0; s < salesCount; s++) {
      const dayOffset = Math.floor(Math.random() * 60);
      const saleDate = new Date(sixtyDaysAgo);
      saleDate.setDate(saleDate.getDate() + dayOffset);
      saleDate.setHours(9 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60));
      salesDates.push(saleDate);
    }
    salesDates.sort((a, b) => a.getTime() - b.getTime());

    for (const saleDate of salesDates) {
      const qty = Math.random() < 0.6 ? 1 : Math.random() < 0.85 ? 2 : 3 + Math.floor(Math.random() * 5);
      const totalPrice = qty * catalogItem.sellingPrice;
      const costPriceTotal = qty * catalogItem.costPrice;

      // Determine if this sale has additional items (to make it realistic)
      const extraItems = Math.random() < 0.5 ? 0 : 1 + Math.floor(Math.random() * 3);
      const saleItems = [
        {
          productId: product.id,
          quantity: qty,
          unitPrice: catalogItem.sellingPrice,
          totalPrice,
        },
      ];

      // Add random extra items from other products
      for (let e = 0; e < extraItems; e++) {
        const otherProduct = createdProducts[Math.floor(Math.random() * createdProducts.length)];
        if (otherProduct.id === product.id) continue;
        const otherQty = 1 + Math.floor(Math.random() * 2);
        saleItems.push({
          productId: otherProduct.id,
          quantity: otherQty,
          unitPrice: 0, // Will be filled
          totalPrice: 0,
        });
      }

      // Fill prices for extra items
      for (const si of saleItems) {
        if (si.unitPrice === 0) {
          const p = createdProducts.find((cp) => cp.id === si.productId);
          if (p) {
            si.unitPrice = p.sellingPrice;
            si.totalPrice = si.quantity * p.sellingPrice;
          }
        }
      }

      const totalAmount = saleItems.reduce((s, i) => s + i.totalPrice, 0);
      const discount = Math.random() < 0.7 ? 0 : Math.floor(totalAmount * (0.03 + Math.random() * 0.07));
      const finalAmount = totalAmount - discount;
      const isPaid = Math.random() < 0.75;
      const paidAmount = isPaid ? finalAmount : Math.random() < 0.5 ? Math.floor(finalAmount * 0.5) : 0;

      await prisma.sale.create({
        data: {
          ownerId: userId,
          invoiceNumber: generateInvoiceNumber(saleDate, saleIndex + 1),
          customerName: Math.random() < 0.75 ? CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)] : null,
          customerPhone: Math.random() < 0.75 ? generatePhone() : null,
          totalAmount,
          discount,
          finalAmount,
          paymentStatus: isPaid ? PaymentStatus.PAID : paidAmount > 0 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID,
          paidAmount,
          dueAmount: finalAmount - paidAmount,
          createdAt: saleDate,
          updatedAt: saleDate,
          items: { create: saleItems },
        },
      });

      saleIndex++;
      totalSales++;
    }

    console.log(`  [${String(salesCount).padStart(5, " ")} SALES] ${product.name}`);
  }

  console.log(`\n✅ Created ${totalSales} sales transactions across ${createdProducts.length} products.`);
  console.log(`\n=== Seeding Complete! ===\n`);
  console.log("Head to /expiry-tracker to see the dashboard.\n");
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

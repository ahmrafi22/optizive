import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Category, StockUnit } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "7ec7d944-66ce-4e20-bb6d-2872e5347bbf";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
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

function buildSku(name: string, index: number) {
  const prefix = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase();
  return `DEMO-${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function buildBarcode(index: number) {
  return String(880100000000 + index).slice(0, 12);
}

interface ProductDef {
  name: string;
  description: string;
  category: Category;
  unit: StockUnit;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  minStock: number;
  expiryDays: number | null;
  batchNumber: string | null;
}

const PRODUCTS: ProductDef[] = [
  // 1  Rice
  {
    name: "Miniket Rice 5kg",
    description: "Premium Miniket rice from Bogra, Bangladesh. Fine-grained aromatic rice, a staple in every Bangladeshi household.",
    category: Category.GROCERIES, unit: StockUnit.KG,
    costPrice: 280, sellingPrice: 350, quantity: 1000, minStock: 100,
    expiryDays: null, batchNumber: null,
  },
  // 2  Lentils (Dal)
  {
    name: "Moshur Dal (Red Lentils) 1kg",
    description: "Premium red lentils sourced from local farms in Bangladesh. Rich in protein and essential for daily dal.",
    category: Category.GROCERIES, unit: StockUnit.KG,
    costPrice: 95, sellingPrice: 125, quantity: 800, minStock: 80,
    expiryDays: null, batchNumber: null,
  },
  // 3  Soybean Oil
  {
    name: "Soybean Oil 5L",
    description: "Fortified soybean oil in 5L bottle. The most widely used cooking oil in Bangladeshi kitchens.",
    category: Category.AGRO_PRODUCTS, unit: StockUnit.LITER,
    costPrice: 550, sellingPrice: 680, quantity: 500, minStock: 50,
    expiryDays: null, batchNumber: null,
  },
  // 4  Salt
  {
    name: "Iodized Salt 1kg",
    description: "Double refined iodized salt from Bangladesh. Essential for daily cooking and food preservation.",
    category: Category.GROCERIES, unit: StockUnit.KG,
    costPrice: 25, sellingPrice: 35, quantity: 2000, minStock: 200,
    expiryDays: null, batchNumber: null,
  },
  // 5  Onion
  {
    name: "Fresh Onion 1kg",
    description: "Fresh red onions from Faridpur, Bangladesh. The foundation of every Bangladeshi curry and bhuna.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.KG,
    costPrice: 35, sellingPrice: 50, quantity: 600, minStock: 60,
    expiryDays: null, batchNumber: null,
  },
  // 6  Garlic
  {
    name: "Fresh Garlic 500g",
    description: "Premium garlic cloves from Kushtia, Bangladesh. Strong pungent flavor essential for authentic Bangladeshi cooking.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PACK,
    costPrice: 85, sellingPrice: 110, quantity: 500, minStock: 50,
    expiryDays: null, batchNumber: null,
  },
  // 7  Ginger
  {
    name: "Fresh Ginger 500g",
    description: "Fresh ginger from Rangpur, Bangladesh. A staple for Bangladeshi curries, bhuna, and cha.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PACK,
    costPrice: 95, sellingPrice: 125, quantity: 450, minStock: 45,
    expiryDays: null, batchNumber: null,
  },
  // 8  Potato
  {
    name: "Fresh Potato 1kg",
    description: "Fresh potatoes from Munshiganj, Bangladesh. The most versatile vegetable used in countless Bangladeshi dishes.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.KG,
    costPrice: 25, sellingPrice: 35, quantity: 800, minStock: 80,
    expiryDays: null, batchNumber: null,
  },
  // 9  Tomato
  {
    name: "Fresh Tomato 1kg",
    description: "Ripe red tomatoes from Narsingdi, Bangladesh. Perfect for curries, salads, and tomato cha.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.KG,
    costPrice: 45, sellingPrice: 60, quantity: 400, minStock: 40,
    expiryDays: null, batchNumber: null,
  },
  // 10 Green Chili
  {
    name: "Fresh Green Chili 250g",
    description: "Fresh green chilies from Bogra, Bangladesh. Adds the perfect spicy kick to every Bangladeshi meal.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PACK,
    costPrice: 30, sellingPrice: 45, quantity: 350, minStock: 35,
    expiryDays: null, batchNumber: null,
  },
  // 11 Coriander (LOW STOCK — quantity < minStock)
  {
    name: "Fresh Coriander Leaves 100g",
    description: "Fresh coriander leaves from local Bangladeshi farms. Essential garnish for biryani, curry, and cha.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PACK,
    costPrice: 15, sellingPrice: 25, quantity: 5, minStock: 10,
    expiryDays: null, batchNumber: null,
  },
  // 12 Chicken
  {
    name: "Broiler Chicken 1kg",
    description: "Fresh broiler chicken from Gazipur poultry farms. The most consumed meat across Bangladesh.",
    category: Category.MEAT_POULTRY, unit: StockUnit.KG,
    costPrice: 180, sellingPrice: 230, quantity: 300, minStock: 30,
    expiryDays: null, batchNumber: null,
  },
  // 13 Eggs (EXPIRING SOON — 4 days)
  {
    name: "Farm Eggs 12pc",
    description: "Fresh farm eggs from Savar poultry farm. Rich in protein and a breakfast staple in Bangladesh.",
    category: Category.DAIRY, unit: StockUnit.DOZEN,
    costPrice: 110, sellingPrice: 145, quantity: 400, minStock: 40,
    expiryDays: 4, batchNumber: "BATCH-2026-06-12",
  },
  // 14 Milk (EXPIRED — 5 days ago)
  {
    name: "Pasteurized Milk 1L",
    description: "Pasteurized full cream milk from Milk Vita, Bangladesh. Rich and creamy. [EXPIRED]",
    category: Category.DAIRY, unit: StockUnit.LITER,
    costPrice: 65, sellingPrice: 85, quantity: 250, minStock: 25,
    expiryDays: -5, batchNumber: "BATCH-2026-06-03",
  },
  // 15 Bread (EXPIRED — 7 days ago)
  {
    name: "Sandwich Bread 400g",
    description: "Fresh sandwich bread from a Bangladeshi bakery. Soft and fluffy. [EXPIRED]",
    category: Category.GROCERIES, unit: StockUnit.PACK,
    costPrice: 45, sellingPrice: 60, quantity: 300, minStock: 30,
    expiryDays: -7, batchNumber: "BATCH-2026-06-01",
  },
  // 16 Banana
  {
    name: "Fresh Banana 12pc",
    description: "Fresh Shagor bananas from Narsingdi, Bangladesh. Naturally sweet and energy-packed.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.DOZEN,
    costPrice: 40, sellingPrice: 60, quantity: 500, minStock: 50,
    expiryDays: null, batchNumber: null,
  },
  // 17 Apple
  {
    name: "Imported Apple 1kg",
    description: "Premium imported red apples. A popular fruit in Bangladeshi urban households.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.KG,
    costPrice: 220, sellingPrice: 280, quantity: 250, minStock: 25,
    expiryDays: null, batchNumber: null,
  },
  // 18 Tea
  {
    name: "Premium Tea Leaves 500g",
    description: "Premium CTC tea from Bangladesh Tea Gardens in Sylhet. Strong aroma perfect for daily cha.",
    category: Category.GROCERIES, unit: StockUnit.PACK,
    costPrice: 180, sellingPrice: 230, quantity: 350, minStock: 35,
    expiryDays: null, batchNumber: null,
  },
  // 19 Sugar
  {
    name: "White Sugar 1kg",
    description: "Refined white sugar from Bangladesh Sugar Mills. Sweetens every cup of tea and dessert.",
    category: Category.GROCERIES, unit: StockUnit.KG,
    costPrice: 65, sellingPrice: 85, quantity: 600, minStock: 60,
    expiryDays: null, batchNumber: null,
  },
  // 20 Biscuit
  {
    name: "Cream Biscuit 200g",
    description: "Delicious cream-filled biscuits from Bangladesh. The perfect chai-time snack.",
    category: Category.GROCERIES, unit: StockUnit.PACK,
    costPrice: 55, sellingPrice: 75, quantity: 450, minStock: 45,
    expiryDays: null, batchNumber: null,
  },
  // 21 Cauliflower (LOW STOCK — quantity < minStock)
  {
    name: "Fresh Cauliflower 1pc",
    description: "Fresh cauliflower from local farms in Bangladesh. Great for vegetable curries and bhaji.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PCS,
    costPrice: 45, sellingPrice: 65, quantity: 8, minStock: 15,
    expiryDays: null, batchNumber: null,
  },
  // 22 Cabbage
  {
    name: "Fresh Cabbage 1pc",
    description: "Fresh green cabbage from Bangladeshi farms. Perfect for salads, curries, and porota rolls.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PCS,
    costPrice: 35, sellingPrice: 50, quantity: 200, minStock: 20,
    expiryDays: null, batchNumber: null,
  },
  // 23 Carrot
  {
    name: "Fresh Carrot 1kg",
    description: "Fresh orange carrots from local Bangladeshi farms. Rich in vitamin A and great for salads.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.KG,
    costPrice: 55, sellingPrice: 75, quantity: 180, minStock: 18,
    expiryDays: null, batchNumber: null,
  },
  // 24 Spinach (LOW STOCK — quantity < minStock)
  {
    name: "Spinach (Palong Shak) 500g",
    description: "Fresh palong shak from Bangladeshi farms. Iron-rich leafy green, a staple in Bangladeshi households.",
    category: Category.FRESH_PRODUCE, unit: StockUnit.PACK,
    costPrice: 25, sellingPrice: 40, quantity: 3, minStock: 10,
    expiryDays: null, batchNumber: null,
  },
  // 25 Rohu Fish
  {
    name: "Rohu Fish (Rui) 1kg",
    description: "Fresh Rui fish from Bangladeshi freshwater ponds. Premium quality, perfect for traditional fish curry.",
    category: Category.FISHERY_SEAFOOD, unit: StockUnit.KG,
    costPrice: 280, sellingPrice: 350, quantity: 150, minStock: 15,
    expiryDays: null, batchNumber: null,
  },
];

async function seed() {
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║        SEEDING 25 DEMO PRODUCTS (Bangladesh)           ║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  console.log(`Target User ID: ${userId}\n`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    console.error(`User ${userId} not found!`);
    process.exit(1);
  }
  console.log(`User: ${user.name ?? userId}\n`);

  const existingCount = await prisma.product.count({ where: { ownerId: userId } });

  if (existingCount > 0 && !force) {
    console.log(`User already has ${existingCount} products. Use --force to delete existing and reseed.`);
    console.log(`Run: npx tsx scripts/seed-demo-products.ts --force\n`);
    return;
  }

  if (force && existingCount > 0) {
    console.log(`--force: Deleting existing products & related data...`);
    await prisma.saleItem.deleteMany({ where: { sale: { ownerId: userId } } });
    await prisma.sale.deleteMany({ where: { ownerId: userId } });
    await prisma.bundleItem.deleteMany({ where: { bundle: { ownerId: userId } } });
    await prisma.bundle.deleteMany({ where: { ownerId: userId } });
    await prisma.smartBasketItem.deleteMany({ where: { basket: { ownerId: userId } } });
    await prisma.smartBasket.deleteMany({ where: { ownerId: userId } });
    await prisma.product.deleteMany({ where: { ownerId: userId } });
    console.log("Cleared.\n");
  }

  console.log("Creating 25 demo products...\n");

  const created = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const expiryDate = p.expiryDays !== null ? daysFromNow(p.expiryDays) : null;

    const product = await prisma.product.create({
      data: {
        ownerId: userId,
        supplierId: userId,
        name: p.name,
        description: p.description,
        category: p.category,
        costPrice: p.costPrice,
        sellingPrice: p.sellingPrice,
        quantity: p.quantity,
        unit: p.unit,
        minStock: p.minStock,
        sku: buildSku(p.name, i),
        barcode: buildBarcode(i + 1),
        imageLink: `https://picsum.photos/seed/demo-${p.name.replace(/\s+/g, "-").toLowerCase()}-${i}/600/400`,
        isActive: true,
        expiryDate,
        batchNumber: p.batchNumber,
      },
    });
    created.push(product);

    const flags: string[] = [];
    if (p.quantity <= p.minStock) flags.push("⚠ LOW STOCK");
    if (p.expiryDays !== null && p.expiryDays < 0) flags.push("✗ EXPIRED");
    if (p.expiryDays !== null && p.expiryDays >= 0 && p.expiryDays <= 7) flags.push("⚡ EXPIRING SOON");
    const flagStr = flags.length > 0 ? `  [${flags.join(", ")}]` : "";
    const num = String(i + 1).padStart(2, " ");
    console.log(`  [${num}] ${p.name.padEnd(40)} ${flagStr}`);
  }

  console.log(`\n✅ Created ${created.length} products for user ${userId}\n`);

  // Summary
  const lowStock = created.filter((p) => {
    const def = PRODUCTS.find((d) => d.name === p.name)!;
    return def.quantity <= def.minStock;
  });
  const expired = created.filter((p) => p.expiryDate && p.expiryDate < new Date());
  const expiringSoon = created.filter((p) => {
    if (!p.expiryDate) return false;
    const diff = (p.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 7;
  });

  console.log(`📊 Summary:`);
  console.log(`   Total Products:    ${created.length}`);
  console.log(`   Low Stock:         ${lowStock.length} (Coriander, Cauliflower, Spinach)`);
  console.log(`   Expired:           ${expired.length} (Milk, Bread)`);
  console.log(`   Expiring Soon:     ${expiringSoon.length} (Eggs)`);
  console.log(`\n=== Seeding Complete! ===\n`);
  console.log(`Next step: npx tsx scripts/seed-demo-sales.ts --user ${userId}\n`);
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

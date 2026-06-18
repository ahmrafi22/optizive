import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, PaymentStatus } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "7ec7d944-66ce-4e20-bb6d-2872e5347bbf";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL.");
  process.exit(1);
}

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

const CUSTOMERS = [
  "Kamal Hossain", "Rahim Ahmed", "Fatema Begum", "Salma Khatun", "Abdul Jabbar",
  "Nasrin Akter", "Jahangir Alam", "Rupa Das", "Mizanur Rahman", "Shirin Sultana",
  "Habibur Rahman", "Ayesha Siddika", "Rafiqul Islam", "Taslima Nasrin", "Monir Hossain",
  "Shamima Akter", "Delwar Hossain", "Roksana Begum", "Shahin Alam", "Parveen Akter",
  "Azizul Haque", "Nargis Parvin", "Kamrul Islam", "Rehana Khatun", "Shafiqul Islam",
  "Sultana Razia", "Mofizul Rahman", "Hasina Begum", "Nurul Amin", "Farida Yasmin",
];

let _invCounter = 0;
function invNo(date: Date): string {
  _invCounter++;
  const y = date.getFullYear().toString().slice(-2);
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `DEMO-INV-${y}${m}${d}-${String(_invCounter).padStart(5, "0")}`;
}

function rndPhone(): string {
  return `01${["7", "8", "9", "3", "4", "5", "6"][Math.floor(Math.random() * 7)]}${Math.floor(10000000 + Math.random() * 90000000)}`;
}

function randomDate(start: Date, end: Date): Date {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  d.setHours(8 + Math.floor(Math.random() * 11), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d;
}

function rndQty(): number {
  const r = Math.random();
  if (r < 0.50) return 1;
  if (r < 0.80) return 2;
  if (r < 0.95) return 3 + Math.floor(Math.random() * 3);
  return 5 + Math.floor(Math.random() * 6);
}

/* ─── Product name key map (no spaces) ─── */
const P: Record<string, string> = {
  Rice: "miniketrice5kg", Lentils: "moshurdal(redlentils)1kg", Oil: "soybeanoil5l",
  Salt: "iodizedsalt1kg", Onion: "freshonion1kg", Garlic: "freshgarlic500g",
  Ginger: "freshginger500g", Potato: "freshpotato1kg", Tomato: "freshtomato1kg",
  Chili: "freshgreenchili250g", Coriander: "freshcorianderleaves100g",
  Chicken: "broilerchicken1kg", Eggs: "farmeggs12pc", Milk: "pasteurizedmilk1l",
  Bread: "sandwichbread400g", Banana: "freshbanana12pc", Apple: "importedapple1kg",
  Tea: "premiumtealeaves500g", Sugar: "whitesugar1kg", Biscuit: "creambiscuit200g",
  Cauli: "freshcauliflower1pc", Cabbage: "freshcabbage1pc", Carrot: "freshcarrot1kg",
  Spinach: "spinach(palongshak)500g", Fish: "rohufish(rui)1kg",
};

interface BasketTemplate { weight: number; names: string[]; label: string }

const TEMPLATES: BasketTemplate[] = [
  { weight: 200, names: [P.Rice, P.Lentils, P.Onion, P.Garlic, P.Ginger, P.Oil, P.Salt, P.Chili, P.Potato], label: "Rice Meal Staple" },
  { weight: 180, names: [P.Chicken, P.Onion, P.Garlic, P.Ginger, P.Oil, P.Chili, P.Coriander, P.Salt, P.Potato], label: "Chicken Curry" },
  { weight: 150, names: [P.Eggs, P.Onion, P.Chili, P.Tomato, P.Coriander, P.Salt, P.Oil, P.Potato], label: "Egg Curry" },
  { weight: 100, names: [P.Bread, P.Milk, P.Tea, P.Sugar, P.Banana, P.Eggs], label: "Full Breakfast" },
  { weight: 130, names: [P.Tea, P.Biscuit, P.Sugar, P.Milk], label: "Tea Time Snack" },
  { weight: 80, names: [P.Banana, P.Apple, P.Milk, P.Biscuit, P.Tea], label: "Fruit Basket" },
  { weight: 130, names: [P.Fish, P.Oil, P.Onion, P.Garlic, P.Ginger, P.Chili, P.Salt, P.Coriander], label: "Fish Curry" },
  { weight: 110, names: [P.Cauli, P.Potato, P.Onion, P.Garlic, P.Oil, P.Chili, P.Salt], label: "Cauliflower Curry" },
  { weight: 100, names: [P.Cabbage, P.Potato, P.Onion, P.Garlic, P.Oil, P.Salt, P.Coriander], label: "Cabbage Curry" },
  { weight: 70, names: [P.Spinach, P.Garlic, P.Onion, P.Oil, P.Salt], label: "Spinach Set" },
  { weight: 70, names: [P.Carrot, P.Potato, P.Onion, P.Garlic, P.Ginger, P.Salt], label: "Carrot Set" },
  { weight: 60, names: [P.Tomato, P.Onion, P.Chili, P.Coriander, P.Salt], label: "Tomato Set" },
  { weight: 180, names: [P.Rice, P.Lentils, P.Salt], label: "Simple Rice & Dal" },
  { weight: 200, names: [P.Onion, P.Garlic, P.Ginger, P.Oil, P.Salt, P.Chili], label: "Cooking Base" },
  { weight: 160, names: [P.Potato, P.Onion, P.Garlic, P.Oil, P.Chili, P.Salt], label: "Potato Curry Base" },
  { weight: 120, names: [P.Garlic, P.Ginger, P.Chili, P.Salt], label: "Ginger-Garlic Base" },
  { weight: 70, names: [P.Coriander, P.Chili, P.Onion, P.Tomato], label: "Garnish Set" },
  { weight: 60, names: [P.Apple, P.Banana, P.Milk], label: "Fruit & Milk" },
  { weight: 90, names: [P.Rice, P.Chicken, P.Onion, P.Garlic, P.Ginger, P.Oil, P.Salt, P.Chili, P.Coriander], label: "Complete Rice & Chicken" },
  { weight: 60, names: [P.Eggs, P.Onion, P.Tomato, P.Bread], label: "Egg & Bread Breakfast" },
  { weight: 100, names: [P.Tea, P.Biscuit, P.Sugar], label: "Tea & Biscuits" },
  { weight: 80, names: [P.Milk, P.Eggs, P.Bread, P.Banana], label: "Milk & Eggs Breakfast" },
  { weight: 100, names: [P.Rice, P.Lentils, P.Onion, P.Oil, P.Salt, P.Potato], label: "Rice Meal with Dal" },
  { weight: 60, names: [P.Biscuit, P.Tea, P.Milk, P.Sugar, P.Bread], label: "Snack Mix" },
  { weight: 50, names: [P.Cauli, P.Cabbage, P.Carrot, P.Potato, P.Onion, P.Salt, P.Oil], label: "Mixed Vegetables" },
];

const TOTAL_WEIGHT = TEMPLATES.reduce((s, t) => s + t.weight, 0);

function pickBasket(): string[] {
  const r = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;
  for (const t of TEMPLATES) {
    cumulative += t.weight;
    if (r <= cumulative) return [...t.names];
  }
  return [...TEMPLATES[TEMPLATES.length - 1].names];
}

async function seed() {
  console.log(`\n Seeding 3000 Demo Sales (Co-Purchase Patterns)`);
  console.log(`User ID: ${userId}\n`);

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) { console.error(`User ${userId} not found!`); process.exit(1); }

  const products = await prisma.product.findMany({
    where: { ownerId: userId, isActive: true },
  });
  if (products.length === 0) {
    console.error(`No products found. Run seed-demo-products.ts first.`);
    process.exit(1);
  }

  // Build lookup: normalized name → product
  const byKey = new Map<string, (typeof products)[0]>();
  for (const p of products) byKey.set(p.name.toLowerCase().replace(/\s+/g, ""), p);

  // Verify all 25 expected keys exist
  const allKeys = Object.values(P);
  const missing = allKeys.filter((k) => !byKey.has(k));
  if (missing.length > 0) {
    console.error(`Missing product keys: ${missing.join(", ")}`);
    console.error(`Available: ${[...byKey.keys()].join(", ")}`);
    process.exit(1);
  }
  console.log(`  Verified ${allKeys.length} product mappings`);

  // ── Generate all sales data in memory ──
  const TOTAL = 3000;
  const START = new Date("2026-05-10T00:00:00Z");
  const END = new Date("2026-06-20T23:59:59Z");

  interface SaleGen { date: Date; names: string[] }
  const salesGen: SaleGen[] = [];
  for (let i = 0; i < TOTAL; i++) {
    salesGen.push({ date: randomDate(START, END), names: pickBasket() });
  }

  // ── Insert sales one at a time (avoid Neon transaction timeout) ──
  let totalRevenue = 0;
  let totalProfit = 0;
  let done = 0;

  for (const sg of salesGen) {
    const items = sg.names.map((nk) => {
      const prod = byKey.get(nk)!;
      const qty = rndQty();
      return { productId: prod.id, quantity: qty, unitPrice: prod.sellingPrice, totalPrice: qty * prod.sellingPrice, costPrice: prod.costPrice };
    });
    const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0);
    const dr = Math.random();
    let discount = 0;
    if (dr >= 0.65) discount = Math.floor(totalAmount * (dr < 0.88 ? 0.02 + Math.random() * 0.05 : 0.08 + Math.random() * 0.07));
    const finalAmount = totalAmount - discount;
    const pr = Math.random();
    const ps = pr < 0.72 ? PaymentStatus.PAID : pr < 0.88 ? PaymentStatus.PARTIAL : PaymentStatus.UNPAID;
    const paid = ps === PaymentStatus.PAID ? finalAmount : ps === PaymentStatus.PARTIAL ? Math.floor(finalAmount * (0.3 + Math.random() * 0.6)) : 0;
    const profit = items.reduce((s, i) => s + (i.unitPrice - i.costPrice) * i.quantity, 0) - discount;
    const hasCust = Math.random() < 0.75;
    totalRevenue += finalAmount;
    totalProfit += profit;

    await prisma.sale.create({
      data: {
        ownerId: userId,
        invoiceNumber: invNo(sg.date),
        customerName: hasCust ? CUSTOMERS[Math.floor(Math.random() * CUSTOMERS.length)] : null,
        customerPhone: hasCust ? rndPhone() : null,
        totalAmount, discount, finalAmount,
        paymentStatus: ps, paidAmount: paid, dueAmount: finalAmount - paid,
        createdAt: sg.date, updatedAt: sg.date,
        items: { create: items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice })) },
      },
    });

    done++;
    if (done % 300 === 0 || done === TOTAL) {
      console.log(`  ${String(done).padStart(5)}/${TOTAL} (${((done / TOTAL) * 100).toFixed(0)}%)`);
    }
  }

  console.log(`\n  Created ${TOTAL} sales!`);
  console.log(`  Revenue: BDT ${totalRevenue.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`);
  console.log(`  Profit:  BDT ${totalProfit.toLocaleString("en-BD", { minimumFractionDigits: 2 })}`);

  // ── Co-Purchase Summary ──
  console.log(`\n  Co-Purchase Recommendation Preview:\n`);
  const KEY_PRODUCTS = [
    { key: P.Rice, label: "Rice" }, { key: P.Chicken, label: "Chicken" }, { key: P.Eggs, label: "Eggs" },
    { key: P.Tea, label: "Tea" }, { key: P.Fish, label: "Rohu Fish" }, { key: P.Banana, label: "Banana" },
    { key: P.Milk, label: "Milk" }, { key: P.Onion, label: "Onion" }, { key: P.Potato, label: "Potato" },
  ];
  for (const kp of KEY_PRODUCTS) {
    const prod = byKey.get(kp.key);
    if (!prod) continue;
    const si = await prisma.saleItem.findMany({ where: { productId: prod.id }, select: { saleId: true } });
    const sids = [...new Set(si.map((x) => x.saleId))];
    if (sids.length < 2) continue;
    const co = await prisma.saleItem.groupBy({
      by: ["productId"], where: { saleId: { in: sids }, productId: { not: prod.id } },
      _count: { productId: true }, orderBy: { _count: { productId: "desc" } }, take: 5,
    });
    if (co.length > 0) {
      const names = co.map((c) => {
        const p = products.find((x) => x.id === c.productId);
        return `${(p?.name ?? "?").split(" ").slice(0, 2).join(" ")} (${c._count.productId}x)`;
      });
      console.log(`  [${kp.label}] -> ${names.join(", ")}`);
    }
  }

  console.log(`\n  Done! Visit /smart-basket to test recommendations.\n`);
  await prisma.$disconnect();
}

try {
  await seed();
} catch (error) {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}

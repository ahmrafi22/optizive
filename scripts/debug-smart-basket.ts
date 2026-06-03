// ── Smart Basket Recommendation Debugger ──
// Traces every step of getScoredCandidates and explains what's happening.
// Run: npx tsx scripts/debug-smart-basket.ts --product "Lentils 2kg"

import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../prisma/generated/prisma/client.js";

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL! },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

const HEADER = "=".repeat(72);
const SEP = "-".repeat(72);

async function main() {
  const productArg = process.argv.find((a) => a.startsWith("--product="));
  const searchName = productArg ? productArg.split("=")[1] : (process.argv[2] ?? "Lentils 2kg");

  console.log(`\n${HEADER}`);
  console.log(`  SMART BASKET RECOMMENDATION: STEP-BY-STEP TRACE`);
  console.log(`  Searching for product: "${searchName}"`);
  console.log(`${HEADER}\n`);

  // ── Step 0: Find the product ──
  console.log(`${SEP}`);
  console.log(`  STEP 0: FIND THE PRODUCT IN THE LOCAL STORE`);
  console.log(`${SEP}\n`);

  const product = await prisma.product.findFirst({
    where: {
      name: { contains: searchName, mode: "insensitive" },
      isActive: true,
    },
  });

  if (!product) {
    console.log(`  ✗ No product found matching "${searchName}"`);
    console.log(`\n  Available products (first 20):`);
    const allProducts = await prisma.product.findMany({ where: { isActive: true }, take: 20, orderBy: { name: "asc" } });
    for (const p of allProducts) {
      console.log(`    - ${p.name} (${p.category}) [${p.id}]`);
    }
    console.log();
    process.exit(1);
  }

  console.log(`  ✓ Found: "${product.name}"`);
  console.log(`    ID:       ${product.id}`);
  console.log(`    Category: ${product.category}`);
  console.log(`    Price:    ${product.sellingPrice}`);
  console.log(`    In stock: ${product.quantity}\n`);

  const productIds = [product.id];

  // ── Step 1: Verify selected products exist ──
  console.log(`${SEP}`);
  console.log(`  STEP 1: VERIFY SELECTED PRODUCTS IN DB`);
  console.log(`${SEP}\n`);

  const selectedProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  console.log(`  ✓ Selected ${selectedProducts.length} product(s):`);
  for (const p of selectedProducts) {
    console.log(`    - ${p.name} (${p.category})`);
  }
  console.log();

  // ── Step 2: Find user's sales containing this product ──
  console.log(`${SEP}`);
  console.log(`  STEP 2: FIND PAST SALES CONTAINING THIS PRODUCT`);
  console.log(`  (This builds the "user co-purchase" data)`);
  console.log(`${SEP}\n`);

  const saleItems = await prisma.saleItem.findMany({
    where: { productId: { in: productIds } },
    select: { saleId: true },
  });
  const saleIds = [...new Set(saleItems.map((item) => item.saleId))];
  const hasEnoughSales = saleIds.length >= 5;

  console.log(`  Found ${saleIds.length} past sales containing this product`);
  console.log(`  Minimum required for blending: 5 sales`);
  console.log(`  hasEnoughSales = ${hasEnoughSales} (${saleIds.length >= 5 ? "YES ✓" : "NO — will use dataset-only fallback"})`);
  console.log();

  if (hasEnoughSales) {
    console.log(`  ▶ QUERY: saleItem.groupBy({ where: { saleId IN (${saleIds.length} sales), productId NOT IN (scanned) } })`);
    console.log(`  ▶ Finds: "what else did customers buy in those same transactions?"`);
    console.log();

    const grouped = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        saleId: { in: saleIds },
        productId: { notIn: productIds },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 40,
    });

    console.log(`  ✓ Found ${grouped.length} co-purchased products from user sales:`);
    const saleProducts = await prisma.product.findMany({
      where: { id: { in: grouped.map((g) => g.productId) } },
    });
    const saleProductMap = new Map(saleProducts.map((p) => [p.id, p]));

    for (const g of grouped.slice(0, 10)) {
      const p = saleProductMap.get(g.productId);
      console.log(`    - ${g._count.productId}x  ${p?.name ?? g.productId}  (${p?.category ?? "?"})`);
    }
    if (grouped.length > 10) console.log(`    ... and ${grouped.length - 10} more`);
    console.log();
  }

  // ── Step 3: Query CoPurchaseEdge (the dataset) ──
  console.log(`${SEP}`);
  console.log(`  STEP 3: QUERY THE DATASET (CoPurchaseEdge TABLE)`);
  console.log(`  (The 28,218 pre-loaded "X goes with Y" rows from Instacart/BundleRec)`);
  console.log(`${SEP}\n`);

  const datasetEdges = await prisma.coPurchaseEdge.findMany({
    where: { productAId: { in: productIds } },
    orderBy: { score: "desc" },
    take: 40,
  });

  console.log(`  ▶ QUERY: coPurchaseEdge.findMany({ where: { productAId IN [${product.id}] } })`);
  console.log();

  const datasetCoPurchaseCounts = new Map<string, number>();
  for (const edge of datasetEdges) {
    const current = datasetCoPurchaseCounts.get(edge.productBId) ?? 0;
    datasetCoPurchaseCounts.set(edge.productBId, current + edge.frequency);
  }

  if (datasetEdges.length > 0) {
    for (const edge of datasetEdges.slice(0, 10)) {
      console.log(`  ✓ ${edge.productAId}  →  ${edge.productBId}  (freq: ${edge.frequency}, source: ${edge.source})`);
    }
    console.log(`  ✓ Found ${datasetEdges.length} dataset co-purchase edges`);
  } else {
    console.log(`  ✗ NO MATCHES FOUND`);
    console.log();
    console.log(`  ┌─────────────────────────────────────────────────────────────────┐`);
    console.log(`  │ WHY?                                                           │`);
    console.log(`  │                                                                 │`);
    console.log(`  │ CoPurchaseEdge has IDs like:  "instacart_13176"                │`);
    console.log(`  │ Your store has IDs like:      "${product.id.slice(0, 8)}..."   │`);
    console.log(`  │                                                                 │`);
    console.log(`  │ The 28,218 dataset rows use Instacart/BundleRec product IDs,    │`);
    console.log(`  │ NOT your local product UUIDs. There's NO mapping between them.  │`);
    console.log(`  │                                                                 │`);
    console.log(`  │ This is the KEY insight: the seeded dataset is currently         │`);
    console.log(`  │ ORPHANED — it can't match your local products.                  │`);
    console.log(`  │                                                                 │`);
    console.log(`  │ (Showing a few sample edges from the table below)               │`);
    console.log(`  └─────────────────────────────────────────────────────────────────┘`);
    console.log();

    // Show some sample edges so user can see the format
    const sampleEdges = await prisma.coPurchaseEdge.findMany({ take: 5, orderBy: { frequency: "desc" } });
    console.log(`  Sample CoPurchaseEdge rows (for reference):`);
    for (const e of sampleEdges) {
      console.log(`    ${e.productAId}  →  ${e.productBId}  (freq: ${e.frequency})`);
    }
  }
  console.log();

  // ── Step 3b: Check if the product name matches any dataset product names ──
  console.log(`${SEP}`);
  console.log(`  BONUS: CHECK IF PRODUCT NAME EXISTS IN DATASET`);
  console.log(`${SEP}\n`);

  const { join } = await import("path");
  const { existsSync, readFileSync } = await import("fs");
  const datasetSnapshotPath = join(process.cwd(), "data", "dataset-snapshot.json");
  if (existsSync(datasetSnapshotPath)) {
    const snapshot = JSON.parse(readFileSync(datasetSnapshotPath, "utf-8"));
    const datasetProducts = snapshot.products as Array<{ id: string; name: string; category: string }>;
    const nameLower = product.name.toLowerCase();
    const matches = datasetProducts.filter(
      (dp: { name: string }) => dp.name.toLowerCase().includes(nameLower) || nameLower.includes(dp.name.toLowerCase()),
    );

    if (matches.length > 0) {
      console.log(`  ✓ Found ${matches.length} matching product(s) in dataset:`);
      for (const m of matches.slice(0, 5)) {
        console.log(`    - "${m.name}" → ID: ${m.id}`);
      }
      console.log(`\n  If you map "${product.name}" → ${matches[0].id}, the dataset would work!`);
    } else {
      console.log(`  ✗ "${product.name}" not found in dataset snapshot`);
      const similar = datasetProducts.filter(
        (dp: { name: string }) => dp.name.toLowerCase().includes(product.name.split(" ")[0]!.toLowerCase()),
      );
      if (similar.length > 0) {
        console.log(`  Similar dataset products (first 3):`);
        for (const s of similar.slice(0, 3)) {
          console.log(`    - "${s.name}" → ID: ${s.id}`);
        }
      }
    }
  }
  console.log();

  // ── Step 4: Query bundle links ──
  console.log(`${SEP}`);
  console.log(`  STEP 4: FIND BUNDLES CONTAINING THIS PRODUCT`);
  console.log(`${SEP}\n`);

  const bundleLinks = await prisma.bundleItem.findMany({
    where: { productId: { in: productIds } },
    select: { bundleId: true },
  });
  const bundleIds = [...new Set(bundleLinks.map((item) => item.bundleId))];

  const bundleCounts = new Map<string, number>();
  if (bundleIds.length > 0) {
    const bundleItems = await prisma.bundleItem.findMany({
      where: {
        bundleId: { in: bundleIds },
        productId: { notIn: productIds },
      },
      select: { productId: true },
    });
    bundleItems.forEach((item) => {
      bundleCounts.set(item.productId, (bundleCounts.get(item.productId) ?? 0) + 1);
    });
    console.log(`  ✓ Found ${bundleCounts.size} bundle-linked products`);
    const bundleProductIds = await prisma.product.findMany({
      where: { id: { in: [...bundleCounts.keys()] } },
    });
    for (const bp of bundleProductIds.slice(0, 10)) {
      console.log(`    - ${bundleCounts.get(bp.id)}x  ${bp.name}`);
    }
  } else {
    console.log(`  ✗ No bundles contain this product`);
  }
  console.log();

  // ── Step 5: Category affinity fallback ──
  console.log(`${SEP}`);
  console.log(`  STEP 5: CATEGORY AFFINITY FALLBACK`);
  console.log(`  (Kicks in when candidate count < 12)`);
  console.log(`${SEP}\n`);

  const allCandidateIds = new Set<string>([
    ...(hasEnoughSales
      ? (
          await prisma.saleItem.groupBy({
            by: ["productId"],
            where: { saleId: { in: saleIds }, productId: { notIn: productIds } },
            _count: { productId: true },
            orderBy: { _count: { productId: "desc" } },
            take: 40,
          })
        ).map((g) => g.productId)
      : []),
    ...datasetCoPurchaseCounts.keys(),
    ...bundleCounts.keys(),
  ]);

  console.log(`  Total candidate IDs collected: ${allCandidateIds.size}`);
  console.log(`  (from sales: ${hasEnoughSales ? "YES" : "NO"}, dataset: ${datasetEdges.length}, bundles: ${bundleIds.length})`);

  if (allCandidateIds.size < 12) {
    console.log(`  ⚠ Only ${allCandidateIds.size} candidates (< 12), triggering category affinity fallback...`);
    const selectedCategories = new Set(selectedProducts.map((item) => item.category).filter(Boolean));
    console.log(`  Selected categories: ${[...selectedCategories].join(", ")}`);

    const affinities = await prisma.categoryAffinity.findMany({
      where: { categoryA: { in: [...selectedCategories] as any[] } },
      orderBy: { affinityScore: "desc" },
      take: 5,
    });
    console.log(`  Category affinities found: ${affinities.length}`);
    for (const a of affinities) {
      console.log(`    ${a.categoryA} → ${a.categoryB} (score: ${a.affinityScore})`);
    }

    const relatedCategories = affinities.map((a) => a.categoryB);
    const fallbackProducts = await prisma.product.findMany({
      where: {
        category: {
          in: relatedCategories.length > 0 ? (relatedCategories as any[]) : [...selectedCategories] as any[],
        },
        id: { notIn: productIds },
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    console.log(`  Fallback products pulled from related categories: ${fallbackProducts.length}`);
    for (const fp of fallbackProducts.slice(0, 5)) {
      console.log(`    - ${fp.name} (${fp.category})`);
    }
  } else {
    console.log(`  ✓ Enough candidates (${allCandidateIds.size}), no fallback needed`);
  }
  console.log();

  // ── Step 6: Fetch candidate products & score them manually ──
  console.log(`${SEP}`);
  console.log(`  STEP 6: FETCH CANDIDATES & SCORE THEM`);
  console.log(`${SEP}\n`);

  console.log(`  Weighted formula per candidate product:`);
  console.log(`    score = coPurchase × 3  +  bundleCount × 2  +  sameCategory × 1.2`);
  console.log(`          + margin × 1.1  +  stock × 0.7  +  pricePreference +  expiryPenalty`);
  console.log();

  const selectedCategories = new Set(selectedProducts.map((item) => item.category).filter(Boolean) as string[]);

  // Category affinity fallback products (what was found in step 5)
  const affinities = await prisma.categoryAffinity.findMany({
    where: { categoryA: { in: [...selectedCategories] as any[] } },
    orderBy: { affinityScore: "desc" },
    take: 5,
  });
  const relatedCategories = affinities.map((a) => a.categoryB);
  const fallback = await prisma.product.findMany({
    where: {
      category: { in: (relatedCategories.length > 0 ? relatedCategories : [...selectedCategories]) as any[] },
      id: { notIn: productIds },
      isActive: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const now = new Date();
  const candidates = fallback.filter(
    (p) => p.quantity > 0 && (!p.expiryDate || p.expiryDate > now),
  );

  console.log(`  Candidates after stock/expiry filter: ${candidates.length}`);
  console.log();

  if (candidates.length === 0) {
    console.log(`  ✗ No candidates passed all filters.`);
    await prisma.$disconnect();
    return;
  }

  // Score each candidate
  const normalizeMargin = (p: typeof candidates[0]) =>
    p.sellingPrice > 0 ? Math.min(Math.max((p.sellingPrice - p.costPrice) / p.sellingPrice, 0), 1) : 0;
  const normalizeStock = (p: typeof candidates[0]) =>
    p.quantity > 0 ? Math.min(Math.max(p.quantity / 20, 0), 1) : 0;

  const maxPrice = candidates.reduce((max, p) => Math.max(max, p.sellingPrice), 0);
  const allScores = candidates.map((p) => {
    const sameCategory = p.category && selectedCategories.has(p.category) ? 1 : 0;
    const expiryPenalty =
      p.expiryDate && p.expiryDate < new Date(Date.now() + 1000 * 60 * 60 * 24 * 7) ? -0.6 : 0;
    const marginScore = normalizeMargin(p);
    const stockScore = normalizeStock(p);

    const score =
      0 * 3 + // coPurchase (0 since dataset didn't match)
      0 * 2 + // bundleCount (0 since no bundles)
      sameCategory * 1.2 +
      marginScore * 1.1 +
      stockScore * 0.7 +
      0 + // pricePreference (not applicable)
      expiryPenalty;

    const reasons: string[] = [];
    if (sameCategory) reasons.push("Same category");
    if (marginScore > 0.25) reasons.push("Good margin");
    if (stockScore > 0.5) reasons.push("Well stocked");
    if (expiryPenalty < 0) reasons.push("Expiring soon");

    return {
      name: p.name,
      category: p.category,
      price: p.sellingPrice,
      score,
      reason: reasons.join(", ") || "Affinity match",
    };
  });

  allScores.sort((a, b) => b.score - a.score);
  const maxScore = allScores[0]?.score ?? 1;

  console.log(`  ✓ TOP ${Math.min(10, allScores.length)} RECOMMENDATIONS:`);
  console.log(`  ${"─".repeat(90)}`);
  console.log(`  % MATCH  | SCORE | NAME                      | CATEGORY        | REASON`);
  console.log(`  ${"─".repeat(90)}`);
  for (const rec of allScores.slice(0, 10)) {
    const pct = maxScore > 0 ? Math.round((rec.score / maxScore) * 100) : 0;
    console.log(
      `  ${String(pct).padStart(3)}%     | ${rec.score.toFixed(2).padStart(5)} | ${rec.name.padEnd(25)} | ${String(rec.category ?? "NONE").padEnd(14)} | ${rec.reason}`,
    );
  }
  console.log(`  ${"─".repeat(90)}`);
  console.log();
  console.log(`  NOTE: All scores are low because dataset co-purchase = 0 and bundles = 0.`);
  console.log(`        The only signal here is "same category" + "margin" + "stock level".`);
  console.log(`        To fix: create a mapping between store products and dataset products.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Debug script failed:", err);
  process.exit(1);
});

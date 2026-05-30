import { existsSync, mkdirSync, readFileSync, writeFileSync, createReadStream } from "fs";
import { join } from "path";
import { createInterface } from "readline";
import "dotenv/config";
import prisma from "../lib/prisma";
import type { Category } from "../prisma/generated/prisma/client";

const SNAPSHOT_PATH = join(process.cwd(), "data", "dataset-snapshot.json");
const DATA_DIR = join(process.cwd(), "data", "raw");

// ── Dataset file paths ──
const INSTACART_DIR = join(DATA_DIR, "INSTACART");
const INSTACART_PRODUCTS = join(INSTACART_DIR, "products.csv");
const INSTACART_AISLES = join(INSTACART_DIR, "aisles.csv");
const INSTACART_DEPTS = join(INSTACART_DIR, "departments.csv");
const INSTACART_ORDERS = join(INSTACART_DIR, "order_products__prior.csv");

const BUNDLEREC_DIR = join(DATA_DIR, "BUNDLEREC", "dataset");
const BUNDLE_DOMAINS = ["food", "clothing", "electronic"] as const;

// ── Types ──
interface CoPurchasePair {
  productAId: string;
  productBId: string;
  frequency: number;
  source: string;
  category: string;
  categoryA: string;
  categoryB: string;
}

interface DatasetSnapshot {
  coPurchaseEdges: CoPurchasePair[];
  categoryAffinities: Array<{ categoryA: string; categoryB: string; affinityScore: number }>;
  products: Array<{ id: string; name: string; category: string }>;
}

// ── INSTACART department → Category mapping ──
const DEPT_CATEGORY: Record<string, Category> = {
  frozen: "GROCERIES",
  other: "OTHER",
  bakery: "GROCERIES",
  produce: "FRESH_PRODUCE",
  alcohol: "GROCERIES",
  international: "GROCERIES",
  beverages: "GROCERIES",
  pets: "OTHER",
  "dry goods pasta": "GROCERIES",
  bulk: "GROCERIES",
  "personal care": "BEAUTY_PERSONAL_CARE",
  "meat seafood": "MEAT_POULTRY",
  pantry: "GROCERIES",
  breakfast: "GROCERIES",
  "canned goods": "GROCERIES",
  "dairy eggs": "DAIRY",
  household: "HOME_APPLIANCE",
  babies: "OTHER",
  snacks: "FMCG",
  deli: "MEAT_POULTRY",
  missing: "OTHER",
};

function deptToCategory(dept: string): Category {
  const key = dept.toLowerCase().trim();
  return DEPT_CATEGORY[key] ?? "OTHER";
}

// ── BUNDLEREC category extraction ──
// The categories field looks like: [[Grocery & Gourmet Food,Beverages,...]]
// Extract the top-level category
const BUNDLE_CATEGORY_MAP: Record<string, Category> = {
  "grocery & gourmet food": "GROCERIES",
  groceries: "GROCERIES",
  "clothing, shoes & jewelry": "CLOTHING",
  clothing: "CLOTHING",
  electronics: "ELECTRONICS",
  "home & kitchen": "HOME_APPLIANCE",
  "books": "STATIONERY",
  "beauty & personal care": "BEAUTY_PERSONAL_CARE",
  "beauty": "BEAUTY_PERSONAL_CARE",
  "health & household": "HOME_APPLIANCE",
  "health & personal care": "BEAUTY_PERSONAL_CARE",
  "sports & outdoors": "OTHER",
  "toys & games": "OTHER",
  "automotive": "AUTO_PARTS",
  "tools & home improvement": "HARDWARE",
  "office products": "OFFICE_SUPPLIES",
  "pet supplies": "OTHER",
  "baby products": "OTHER",
  "food": "GROCERIES",
};

function bundleCategoryTopLevel(raw: string): Category {
  const cleaned = raw.replace(/\[|\]|"/g, "").trim();
  const parts = cleaned.split(",").map(s => s.trim().toLowerCase());
  for (const part of parts) {
    if (BUNDLE_CATEGORY_MAP[part]) return BUNDLE_CATEGORY_MAP[part];
  }
  return "OTHER";
}

// ── Domain-level category for BUNDLEREC ──
const DOMAIN_CATEGORY: Record<string, Category> = {
  food: "GROCERIES",
  clothing: "CLOTHING",
  electronic: "ELECTRONICS",
};

// ── Helpers ──
function ensureDir(path: string) {
  if (!existsSync(path)) mkdirSync(path, { recursive: true });
}

async function parseCSV<T>(filePath: string, mapRow: (headers: string[], parts: string[]) => T | null): Promise<T[]> {
  if (!existsSync(filePath)) {
    console.log(`  [SKIP] ${filePath} not found`);
    return [];
  }
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  if (lines.length < 2) return [];
  const header = parseCSVLine(lines[0]);
  const results: T[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= header.length) {
      const row = mapRow(header, parts);
      if (row) results.push(row);
    }
  }
  return results;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── INSTACART Parsing ──
async function parseInstacartProducts(): Promise<Map<string, { name: string; category: Category; dept: string; aisle: string }>> {
  console.log("[INSTACART] Parsing products...");

  const deptMap = new Map<string, string>();
  for (const row of await parseCSV<[string, string]>(INSTACART_DEPTS, (h, p) => [p[0]?.trim(), p[1]?.trim()])) {
    deptMap.set(row[0], row[1]);
  }

  const aisleMap = new Map<string, string>();
  for (const row of await parseCSV<[string, string]>(INSTACART_AISLES, (h, p) => [p[0]?.trim(), p[1]?.trim()])) {
    aisleMap.set(row[0], row[1]);
  }

  const productMap = new Map<string, { name: string; category: Category; dept: string; aisle: string }>();

  const rows = await parseCSV<[string, string, string, string]>(INSTACART_PRODUCTS, (h, p) => {
    if (p.length < 4) return null;
    return [p[0]?.trim(), p[1]?.trim(), p[2]?.trim(), p[3]?.trim()];
  });

  for (const [id, name, aisleId, deptId] of rows) {
    const dept = deptMap.get(deptId) ?? "other";
    const aisle = aisleMap.get(aisleId) ?? "other";
    const category = deptToCategory(dept);
    productMap.set(id, { name, category, dept, aisle });
  }

  console.log(`[INSTACART] Parsed ${productMap.size} products across ${deptMap.size} departments`);
  return productMap;
}

async function parseInstacartOrders(
  productMap: Map<string, { name: string; category: Category; dept: string; aisle: string }>,
  maxOrders = 200000,
): Promise<CoPurchasePair[]> {
  console.log(`[INSTACART] Streaming orders (max ${maxOrders.toLocaleString()} orders)...`);

  if (!existsSync(INSTACART_ORDERS)) {
    console.log("  [SKIP] order_products__prior.csv not found");
    return [];
  }

  const orderProducts = new Map<string, string[]>();
  let lineCount = 0;

  const rl = createInterface({ input: createReadStream(INSTACART_ORDERS), crlfDelay: Infinity });
  let isHeader = true;

  for await (const line of rl) {
    if (isHeader) { isHeader = false; continue; }
    if (!line.trim()) continue;

    const parts = line.split(",");
    if (parts.length < 2) continue;

    const orderId = parts[0].trim();
    const productId = parts[1].trim();

    if (!orderId || !productId) continue;

    if (!orderProducts.has(orderId)) {
      if (orderProducts.size >= maxOrders) continue;
      orderProducts.set(orderId, []);
    }
    orderProducts.get(orderId)!.push(productId);
    lineCount++;
  }

  console.log(`[INSTACART] Read ${lineCount.toLocaleString()} order-product rows, ${orderProducts.size} orders`);

  // Build co-purchase pairs
  const pairCounts = new Map<string, number>();

  for (const [, products] of orderProducts) {
    const unique = Array.from(new Set(products));
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const a = unique[i];
        const b = unique[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  console.log(`[INSTACART] Found ${pairCounts.size} unique co-purchase pairs`);

  const edges: CoPurchasePair[] = [];
  const sorted = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sorted.slice(0, 15000)) {
    const [aId, bId] = key.split("|||");
    const catA = productMap.get(aId)?.category ?? "OTHER";
    const catB = productMap.get(bId)?.category ?? "OTHER";
    const primaryCategory = catA !== "OTHER" ? catA : catB;

    edges.push({
      productAId: `instacart_${aId}`,
      productBId: `instacart_${bId}`,
      frequency: count,
      source: "INSTACART",
      category: primaryCategory,
      categoryA: catA,
      categoryB: catB,
    });
  }

  console.log(`[INSTACART] Generated ${edges.length} edges (top 15K)`);
  return edges;
}

function instacartProductNames(productMap: Map<string, { name: string; category: Category; dept: string; aisle: string }>): Array<{ id: string; name: string; category: string }> {
  const products: Array<{ id: string; name: string; category: string }> = [];
  for (const [id, info] of productMap) {
    if (info.name) {
      products.push({ id: `instacart_${id}`, name: info.name, category: info.category });
    }
  }
  return products;
}

// ── BUNDLEREC Parsing ──
async function parseBundleDomain(
  domain: typeof BUNDLE_DOMAINS[number],
): Promise<{ edges: CoPurchasePair[]; products: Array<{ id: string; name: string; category: string }> }> {
  const domainDir = join(BUNDLEREC_DIR, domain);
  console.log(`[BUNDLEREC:${domain}] Parsing...`);

  const category = DOMAIN_CATEGORY[domain];

  // Parse item categories
  const itemCategories = new Map<string, Category>();
  const catRows = await parseCSV<[string, string]>(join(domainDir, "item_categories.csv"), (h, p) => {
    return [p[0]?.trim(), p[1]?.trim()];
  });
  for (const [id, cats] of catRows) {
    const cat = bundleCategoryTopLevel(cats);
    itemCategories.set(id, cat !== "OTHER" ? cat : category);
  }
  console.log(`  Items with categories: ${itemCategories.size}`);

  // Parse item titles
  const itemTitles = new Map<string, string>();
  const titleRows = await parseCSV<[string, string]>(join(domainDir, "item_titles.csv"), (h, p) => {
    return [p[0]?.trim(), p[1]?.trim()];
  });
  for (const [id, title] of titleRows) {
    itemTitles.set(id, title);
  }
  console.log(`  Items with titles: ${itemTitles.size}`);

  // Extract co-purchase from bundles
  const pairCounts = new Map<string, number>();
  let bundleCount = 0;

  const bundleItems = new Map<string, string[]>();
  const bundleRows = await parseCSV<[string, string]>(join(domainDir, "bundle_item.csv"), (h, p) => {
    return [p[0]?.trim(), p[1]?.trim()];
  });
  for (const [bundleId, itemId] of bundleRows) {
    if (!bundleItems.has(bundleId)) {
      bundleItems.set(bundleId, []);
      bundleCount++;
    }
    bundleItems.get(bundleId)!.push(itemId);
  }
  console.log(`  Bundles: ${bundleCount}, bundle-item rows: ${bundleRows.length}`);

  for (const [, items] of bundleItems) {
    const unique = Array.from(new Set(items));
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const a = unique[i];
        const b = unique[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 3); // bundle co-purchase weighted more
      }
    }
  }

  // Also extract from session_item (session-level co-occurrence)
  const sessionItems = new Map<string, string[]>();
  const sessionRows = await parseCSV<[string, string]>(join(domainDir, "session_item.csv"), (h, p) => {
    return [p[0]?.trim(), p[1]?.trim()];
  });
  for (const [sessionId, itemId] of sessionRows) {
    if (!sessionItems.has(sessionId)) {
      sessionItems.set(sessionId, []);
    }
    sessionItems.get(sessionId)!.push(itemId);
  }
  console.log(`  Sessions: ${sessionItems.size}, session-item rows: ${sessionRows.length}`);

  for (const [, items] of sessionItems) {
    const unique = Array.from(new Set(items));
    for (let i = 0; i < unique.length && i < 30; i++) {
      for (let j = i + 1; j < unique.length && j < 30; j++) {
        const a = unique[i];
        const b = unique[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  console.log(`  Unique co-purchase pairs: ${pairCounts.size}`);

  // Build edges
  const edges: CoPurchasePair[] = [];
  const sorted = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sorted.slice(0, 10000)) {
    const [aId, bId] = key.split("|||");
    const catA = itemCategories.get(aId) ?? category;
    const catB = itemCategories.get(bId) ?? category;
    const primaryCategory = catA !== "OTHER" ? catA : catB;

    edges.push({
      productAId: `bundlerec_${domain}_${aId}`,
      productBId: `bundlerec_${domain}_${bId}`,
      frequency: count,
      source: "BUNDLEREC",
      category: primaryCategory,
      categoryA: catA,
      categoryB: catB,
    });
  }

  // Build products
  const products: Array<{ id: string; name: string; category: string }> = [];
  for (const [id, title] of itemTitles) {
    const cat = itemCategories.get(id) ?? category;
    products.push({ id: `bundlerec_${domain}_${id}`, name: title, category: cat });
  }

  console.log(`[BUNDLEREC:${domain}] Generated ${edges.length} edges, ${products.length} products`);
  return { edges, products };
}

// ── Aggregation ──
function aggregateEdges(allEdges: CoPurchasePair[][]): CoPurchasePair[] {
  console.log("[Aggregate] Combining edges from all datasets...");

  const combined = new Map<string, {
    totalScore: number;
    frequency: number;
    sources: Set<string>;
    categories: Map<string, number>;
    catA: Map<string, number>;
    catB: Map<string, number>;
  }>();

  const weights = [0.5, 0.3, 0.2]; // instacart, bundlerec-food, bundlerec-clothing, bundlerec-electronic

  for (let si = 0; si < allEdges.length; si++) {
    const edges = allEdges[si];
    const weight = weights[Math.min(si, weights.length - 1)];
    for (const edge of edges) {
      const key = `${edge.productAId}|||${edge.productBId}`;
      const existing = combined.get(key) ?? {
        totalScore: 0, frequency: 0, sources: new Set(), categories: new Map(),
        catA: new Map(), catB: new Map(),
      };
      existing.totalScore += edge.frequency * weight;
      existing.frequency += edge.frequency;
      existing.sources.add(edge.source);
      existing.categories.set(edge.category, (existing.categories.get(edge.category) ?? 0) + edge.frequency);
      existing.catA.set(edge.categoryA, (existing.catA.get(edge.categoryA) ?? 0) + edge.frequency);
      existing.catB.set(edge.categoryB, (existing.catB.get(edge.categoryB) ?? 0) + edge.frequency);
      combined.set(key, existing);
    }
  }

  let maxScore = 0;
  for (const [, data] of combined) {
    if (data.totalScore > maxScore) maxScore = data.totalScore;
  }

  const bestCat = (catMap: Map<string, number>): string => {
    let best = "OTHER";
    let bestFreq = 0;
    for (const [cat, freq] of catMap) {
      if (freq > bestFreq) { bestFreq = freq; best = cat; }
    }
    return best;
  };

  const aggregated: CoPurchasePair[] = [];
  for (const [key, data] of combined) {
    const [aId, bId] = key.split("|||");
    let primaryCategory = "OTHER";
    let maxCatFreq = 0;
    for (const [cat, freq] of data.categories) {
      if (freq > maxCatFreq) { maxCatFreq = freq; primaryCategory = cat; }
    }
    aggregated.push({
      productAId: aId,
      productBId: bId,
      frequency: data.frequency,
      source: data.sources.size > 1 ? "COMBINED" : Array.from(data.sources)[0],
      category: primaryCategory,
      categoryA: bestCat(data.catA),
      categoryB: bestCat(data.catB),
    });
  }

  aggregated.sort((a, b) => b.frequency - a.frequency);
  console.log(`[Aggregate] Generated ${aggregated.length} combined edges`);
  return aggregated;
}

function computeCategoryAffinities(edges: CoPurchasePair[]): Array<{ categoryA: string; categoryB: string; affinityScore: number }> {
  console.log("[Affinity] Computing category-level affinities...");

  const pairAffinities = new Map<string, number>();
  const categoryTotals = new Map<string, number>();

  for (const edge of edges) {
    const catA = edge.categoryA;
    const catB = edge.categoryB;

    const key = catA < catB ? `${catA}|||${catB}` : `${catB}|||${catA}`;
    pairAffinities.set(key, (pairAffinities.get(key) ?? 0) + edge.frequency);
    categoryTotals.set(catA, (categoryTotals.get(catA) ?? 0) + edge.frequency);
    categoryTotals.set(catB, (categoryTotals.get(catB) ?? 0) + edge.frequency);
  }

  const affinities: Array<{ categoryA: string; categoryB: string; affinityScore: number }> = [];

  for (const [key, count] of pairAffinities) {
    const [catA, catB] = key.split("|||");
    const totalA = categoryTotals.get(catA) ?? 1;
    const totalB = categoryTotals.get(catB) ?? 1;
    const affinity = count / Math.sqrt(totalA * totalB);
    affinities.push({
      categoryA: catA,
      categoryB: catB,
      affinityScore: Math.min(1, affinity),
    });
  }

  affinities.sort((a, b) => b.affinityScore - a.affinityScore);
  console.log(`[Affinity] Computed ${affinities.length} category affinities`);
  return affinities;
}

// ── DB Upsert ──
async function upsertToDb(snapshot: DatasetSnapshot) {
  console.log("[DB] Upserting co-purchase edges...");

  const batchSize = 500;
  const edges = snapshot.coPurchaseEdges;

  for (let i = 0; i < edges.length; i += batchSize) {
    const batch = edges.slice(i, i + batchSize);
    const promises = batch.map(edge =>
      prisma.coPurchaseEdge.upsert({
        where: {
          productAId_productBId: {
            productAId: edge.productAId,
            productBId: edge.productBId,
          },
        },
        create: {
          productAId: edge.productAId,
          productBId: edge.productBId,
          score: 0,
          frequency: edge.frequency,
          source: edge.source,
          category: edge.category as Category,
        },
        update: {
          frequency: edge.frequency,
          source: edge.source,
          category: edge.category as Category,
        },
      }),
    );
    await Promise.all(promises);
    console.log(`[DB] Upserted edges ${i + 1}-${Math.min(i + batchSize, edges.length)} / ${edges.length}`);
  }

  console.log("[DB] Upserting category affinities...");

  const affinityBatchSize = 100;
  const affinities = snapshot.categoryAffinities;

  for (let i = 0; i < affinities.length; i += affinityBatchSize) {
    const batch = affinities.slice(i, i + affinityBatchSize);
    const promises = batch.map(affinity =>
      prisma.categoryAffinity.upsert({
        where: {
          categoryA_categoryB: {
            categoryA: affinity.categoryA as Category,
            categoryB: affinity.categoryB as Category,
          },
        },
        create: {
          categoryA: affinity.categoryA as Category,
          categoryB: affinity.categoryB as Category,
          affinityScore: affinity.affinityScore,
        },
        update: {
          affinityScore: affinity.affinityScore,
        },
      }),
    );
    await Promise.all(promises);
    console.log(`[DB] Upserted affinities ${i + 1}-${Math.min(i + affinityBatchSize, affinities.length)} / ${affinities.length}`);
  }

  console.log("[DB] Done!");
}

// ── Main ──
async function main() {
  console.log("=== Smart Basket Dataset Seeder ===\n");

  await ensureDir(DATA_DIR);

  let snapshot: DatasetSnapshot | null = null;

  if (existsSync(SNAPSHOT_PATH)) {
    console.log("[Snapshot] Found existing snapshot, loading...");
    snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
    console.log(`[Snapshot] Loaded ${snapshot!.coPurchaseEdges.length} edges, ${snapshot!.categoryAffinities.length} affinities`);
  } else {
    console.log("[Snapshot] No snapshot found, processing real datasets...\n");

    const allEdges: CoPurchasePair[][] = [];
    let allProducts: Array<{ id: string; name: string; category: string }> = [];

    // ── INSTACART ──
    try {
      const instacartProductMap = await parseInstacartProducts();
      const instacartEdges = await parseInstacartOrders(instacartProductMap, 200000);
      if (instacartEdges.length > 0) {
        allEdges.push(instacartEdges);
        allProducts = allProducts.concat(instacartProductNames(instacartProductMap));
      }
    } catch (err) {
      console.log(`[INSTACART] Error: ${err}`);
    }

    // ── BUNDLEREC ──
    for (const domain of BUNDLE_DOMAINS) {
      try {
        const { edges, products } = await parseBundleDomain(domain);
        if (edges.length > 0) {
          allEdges.push(edges);
          allProducts = allProducts.concat(products);
        }
      } catch (err) {
        console.log(`[BUNDLEREC:${domain}] Error: ${err}`);
      }
    }

    // ── Aggregate ──
    if (allEdges.length === 0) {
      console.log("[FATAL] No data was loaded from any dataset. Exiting.");
      return;
    }

    const aggregated = aggregateEdges(allEdges);
    const affinities = computeCategoryAffinities(aggregated);

    // Deduplicate products by ID
    const seenIds = new Set<string>();
    const dedupedProducts = allProducts.filter(p => {
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    snapshot = {
      coPurchaseEdges: aggregated,
      categoryAffinities: affinities,
      products: dedupedProducts,
    };

    console.log(`\n[Snapshot] Writing snapshot to ${SNAPSHOT_PATH}...`);
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));
    console.log(`[Snapshot] Done! (${(Buffer.byteLength(JSON.stringify(snapshot)) / 1024 / 1024).toFixed(2)} MB)`);
  }

  if (snapshot) {
    console.log("\n[DB] Starting database upsert...");
    await upsertToDb(snapshot);
  }

  console.log("\n=== Seeder Complete ===");
}

main()
  .catch(err => {
    console.error("Seeder failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

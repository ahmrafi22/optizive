import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { pipeline } from "stream";
import { promisify } from "util";
import { createGunzip } from "zlib";
import { createReadStream } from "fs";
import "dotenv/config";
import prisma from "../lib/prisma";
import type { Category } from "../prisma/generated/prisma/client";

const streamPipeline = promisify(pipeline);

const SNAPSHOT_PATH = join(process.cwd(), "data", "dataset-snapshot.json");
const DATA_DIR = join(process.cwd(), "data", "raw");

const INSTACART_URL = "https://www.kaggle.com/api/v1/datasets/download/psparks/instacart-market-basket-analysis";
const BUNDLEREC_URL = "https://github.com/BundleRec/bundle_recommendation/archive/refs/heads/master.zip";
const AMAZON_SNAP_URL = "https://snap.stanford.edu/data/amazon-meta.txt.gz";

interface CoPurchasePair {
  productAId: string;
  productBId: string;
  frequency: number;
  source: string;
  category: string;
}

interface DatasetSnapshot {
  coPurchaseEdges: CoPurchasePair[];
  categoryAffinities: Array<{ categoryA: string; categoryB: string; affinityScore: number }>;
  products: Array<{ id: string; name: string; category: string; department?: string }>;
}

const CATEGORY_MAP: Record<string, Category> = {
  "dairy eggs": "DAIRY",
  "dairy": "DAIRY",
  "eggs": "DAIRY",
  "produce": "FRESH_PRODUCE",
  "fruits": "FRESH_PRODUCE",
  "vegetables": "FRESH_PRODUCE",
  "meat seafood": "MEAT_POULTRY",
  "meat": "MEAT_POULTRY",
  "seafood": "FISHERY_SEAFOOD",
  "frozen": "GROCERIES",
  "pantry": "GROCERIES",
  "bakery": "GROCERIES",
  "beverages": "GROCERIES",
  "snacks": "FMCG",
  "alcohol": "GROCERIES",
  "baby kids": "OTHER",
  "personal care": "BEAUTY_PERSONAL_CARE",
  "household": "HOME_APPLIANCE",
  "pets": "OTHER",
  "breakfast": "GROCERIES",
  "bread bakery": "GROCERIES",
  "bulk": "GROCERIES",
  "canned goods": "GROCERIES",
  "deli": "MEAT_POULTRY",
  "dry goods pasta": "GROCERIES",
  "juice nectar": "GROCERIES",
  "missing": "OTHER",
  "other": "OTHER",
  "soft drinks": "GROCERIES",
  "spices herbs": "GROCERIES",
  "water seltzer sparkling water": "GROCERIES",
  "electronics": "ELECTRONICS",
  "clothing": "CLOTHING",
  "food": "GROCERIES",
  "books": "STATIONERY",
  "music": "OTHER",
  "dvd": "OTHER",
  "video": "OTHER",
  "grocery": "GROCERIES",
  "fmcg": "FMCG",
  "fresh produce": "FRESH_PRODUCE",
  "agro products": "AGRO_PRODUCTS",
  "fishery seafood": "FISHERY_SEAFOOD",
  "meat poultry": "MEAT_POULTRY",
  "mobile accessories": "MOBILE_ACCESSORIES",
  "textiles apparel": "TEXTILES_APPAREL",
  "footwear": "FOOTWEAR",
  "beauty personal care": "BEAUTY_PERSONAL_CARE",
  "home appliance": "HOME_APPLIANCE",
  "furniture": "FURNITURE",
  "hardware": "HARDWARE",
  "construction materials": "CONSTRUCTION_MATERIALS",
  "auto parts": "AUTO_PARTS",
  "pharmacy": "PHARMACY",
  "stationery": "STATIONERY",
  "office supplies": "OFFICE_SUPPLIES",
  "packaging": "PACKAGING",
  "chemicals": "CHEMICALS",
  "plastics": "PLASTICS",
  "restaurant supply": "RESTAURANT_SUPPLY",
  "hospitality supply": "HOSPITALITY_SUPPLY",
};

function normalizeCategory(raw: string): Category {
  const key = raw.toLowerCase().trim();
  if (CATEGORY_MAP[key]) return CATEGORY_MAP[key];
  for (const [partial, category] of Object.entries(CATEGORY_MAP)) {
    if (key.includes(partial)) return category;
  }
  return "OTHER";
}

function mapCategoryToApp(raw: string): Category {
  return normalizeCategory(raw);
}

async function ensureDir(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

async function downloadFile(url: string, dest: string) {
  console.log(`[Download] ${url} -> ${dest}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(dest, buffer);
  console.log(`[Download] Done: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
}

async function parseInstacartProducts(filePath: string): Promise<Map<string, { name: string; category: string }>> {
  console.log("[Instacart] Parsing products...");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  const header = lines[0].split(",");
  const productMap = new Map<string, { name: string; category: string }>();

  const idIdx = header.findIndex(h => h.trim() === "product_id");
  const nameIdx = header.findIndex(h => h.trim() === "product_name");
  const aisleIdx = header.findIndex(h => h.trim() === "aisle_id");
  const deptIdx = header.findIndex(h => h.trim() === "department_id");

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length > Math.max(idIdx, nameIdx)) {
      const id = parts[idIdx]?.trim();
      const name = parts[nameIdx]?.trim();
      productMap.set(id, { name, category: "" });
    }
  }

  console.log(`[Instacart] Parsed ${productMap.size} products`);
  return productMap;
}

async function parseInstacartOrders(filePath: string, productMap: Map<string, { name: string; category: string }>): Promise<CoPurchasePair[]> {
  console.log("[Instacart] Parsing orders for co-purchase patterns...");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());
  const header = lines[0].split(",");

  const orderIdIdx = header.findIndex(h => h.trim() === "order_id");
  const productIdIdx = header.findIndex(h => h.trim() === "product_id");

  const orderProducts = new Map<string, string[]>();

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(",");
    if (parts.length > Math.max(orderIdIdx, productIdIdx)) {
      const orderId = parts[orderIdIdx]?.trim();
      const productId = parts[productIdIdx]?.trim();
      if (orderId && productId) {
        if (!orderProducts.has(orderId)) {
          orderProducts.set(orderId, []);
        }
        orderProducts.get(orderId)!.push(productId);
      }
    }
  }

  console.log(`[Instacart] Found ${orderProducts.size} orders`);

  const pairCounts = new Map<string, number>();

  for (const [orderId, products] of orderProducts) {
    const uniqueProducts = Array.from(new Set(products));
    for (let i = 0; i < uniqueProducts.length; i++) {
      for (let j = i + 1; j < uniqueProducts.length; j++) {
        const a = uniqueProducts[i];
        const b = uniqueProducts[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  console.log(`[Instacart] Found ${pairCounts.size} unique co-purchase pairs`);

  const edges: CoPurchasePair[] = [];
  const sortedPairs = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sortedPairs.slice(0, 10000)) {
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
    });
  }

  console.log(`[Instacart] Generated ${edges.length} edges (top 10K)`);
  return edges;
}

async function parseAmazonSnap(filePath: string): Promise<CoPurchasePair[]> {
  console.log("[Amazon SNAP] Parsing co-purchase network...");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  const edges: CoPurchasePair[] = [];
  const pairCounts = new Map<string, number>();
  const productCategories = new Map<string, string>();

  let currentId = "";
  let currentGroup = "";
  let currentCategories: string[] = [];
  let inReviews = false;

  for (const line of lines) {
    if (line.startsWith("Id:")) {
      if (currentId && currentGroup) {
        const cat = mapCategoryToApp(currentGroup);
        productCategories.set(currentId, cat);
      }
      currentId = line.replace("Id:", "").trim();
      currentGroup = "";
      currentCategories = [];
      inReviews = false;
    } else if (line.startsWith("group:")) {
      currentGroup = line.replace("group:", "").trim();
    } else if (line.startsWith("similar:")) {
      const similarIds = line.replace("similar:", "").trim().split(/\s+/).filter(Boolean);
      for (const simId of similarIds) {
        const a = currentId < simId ? currentId : simId;
        const b = currentId < simId ? simId : currentId;
        const key = `${a}|||${b}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    } else if (line.startsWith("categories:")) {
      const cats = line.replace("categories:", "").trim();
      currentCategories = cats.split("|").map(c => c.trim());
    } else if (line.startsWith("reviews:")) {
      inReviews = true;
    }
  }

  if (currentId && currentGroup) {
    const cat = mapCategoryToApp(currentGroup);
    productCategories.set(currentId, cat);
  }

  console.log(`[Amazon SNAP] Found ${pairCounts.size} unique co-purchase pairs`);

  const sortedPairs = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sortedPairs.slice(0, 10000)) {
    const [aId, bId] = key.split("|||");
    const cat = productCategories.get(aId) ?? productCategories.get(bId) ?? "OTHER";

    edges.push({
      productAId: `amazon_${aId}`,
      productBId: `amazon_${bId}`,
      frequency: count,
      source: "AMAZON",
      category: cat,
    });
  }

  console.log(`[Amazon SNAP] Generated ${edges.length} edges (top 10K)`);
  return edges;
}

async function parseBundleRec(filePath: string): Promise<CoPurchasePair[]> {
  console.log("[BundleRec] Parsing bundle data...");
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter(l => l.trim());

  const bundleItems = new Map<string, string[]>();

  for (const line of lines) {
    const parts = line.split("\t");
    if (parts.length >= 2) {
      const bundleId = parts[0].trim();
      const itemId = parts[1].trim();
      if (!bundleItems.has(bundleId)) {
        bundleItems.set(bundleId, []);
      }
      bundleItems.get(bundleId)!.push(itemId);
    }
  }

  console.log(`[BundleRec] Found ${bundleItems.size} bundles`);

  const edges: CoPurchasePair[] = [];
  const pairCounts = new Map<string, number>();

  for (const [bundleId, items] of bundleItems) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
        pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
      }
    }
  }

  console.log(`[BundleRec] Found ${pairCounts.size} unique bundle pairs`);

  const sortedPairs = Array.from(pairCounts.entries()).sort((a, b) => b[1] - a[1]);

  for (const [key, count] of sortedPairs.slice(0, 10000)) {
    const [aId, bId] = key.split("|||");
    edges.push({
      productAId: `bundlerec_${aId}`,
      productBId: `bundlerec_${bId}`,
      frequency: count,
      source: "BUNDLEREC",
      category: "GROCERIES",
    });
  }

  console.log(`[BundleRec] Generated ${edges.length} edges (top 10K)`);
  return edges;
}

function aggregateEdges(
  instacartEdges: CoPurchasePair[],
  bundlerecEdges: CoPurchasePair[],
  amazonEdges: CoPurchasePair[],
): CoPurchasePair[] {
  console.log("[Aggregate] Combining edges from all datasets...");

  const combined = new Map<string, { totalScore: number; frequency: number; sources: Set<string>; categories: Map<string, number> }>();

  const addEdges = (edges: CoPurchasePair[], weight: number) => {
    for (const edge of edges) {
      const key = `${edge.productAId}|||${edge.productBId}`;
      const existing = combined.get(key) ?? { totalScore: 0, frequency: 0, sources: new Set(), categories: new Map() };
      existing.totalScore += edge.frequency * weight;
      existing.frequency += edge.frequency;
      existing.sources.add(edge.source);
      existing.categories.set(edge.category, (existing.categories.get(edge.category) ?? 0) + edge.frequency);
      combined.set(key, existing);
    }
  };

  addEdges(instacartEdges, 0.5);
  addEdges(bundlerecEdges, 0.3);
  addEdges(amazonEdges, 0.2);

  let maxScore = 0;
  for (const [, data] of combined) {
    if (data.totalScore > maxScore) maxScore = data.totalScore;
  }

  const aggregated: CoPurchasePair[] = [];

  for (const [key, data] of combined) {
    const [aId, bId] = key.split("|||");
    const normalizedScore = maxScore > 0 ? data.totalScore / maxScore : 0;

    let primaryCategory = "OTHER";
    let maxCatFreq = 0;
    for (const [cat, freq] of data.categories) {
      if (freq > maxCatFreq) {
        maxCatFreq = freq;
        primaryCategory = cat;
      }
    }

    aggregated.push({
      productAId: aId,
      productBId: bId,
      frequency: data.frequency,
      source: data.sources.size > 1 ? "COMBINED" : Array.from(data.sources)[0],
      category: primaryCategory,
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
    const catA = edge.category;
    const catB = edge.category;
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

async function main() {
  console.log("=== Smart Basket Dataset Seeder ===\n");

  await ensureDir(DATA_DIR);

  let snapshot: DatasetSnapshot | null = null;

  if (existsSync(SNAPSHOT_PATH)) {
    console.log("[Snapshot] Found existing snapshot, loading...");
    snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf-8"));
    console.log(`[Snapshot] Loaded ${snapshot.coPurchaseEdges.length} edges, ${snapshot.categoryAffinities.length} affinities`);
  } else {
    console.log("[Snapshot] No snapshot found, processing datasets...\n");

    let instacartEdges: CoPurchasePair[] = [];
    let bundlerecEdges: CoPurchasePair[] = [];
    let amazonEdges: CoPurchasePair[] = [];

    try {
      const instacartProductsPath = join(DATA_DIR, "products.csv");
      const instacartOrdersPath = join(DATA_DIR, "order_products__prior.csv");

      if (existsSync(instacartProductsPath) && existsSync(instacartOrdersPath)) {
        const productMap = await parseInstacartProducts(instacartProductsPath);
        instacartEdges = await parseInstacartOrders(instacartOrdersPath, productMap);
      } else {
        console.log("[Instacart] CSV files not found in data/raw/, skipping...");
        console.log("[Instacart] To include: download from Kaggle and place products.csv and order_products__prior.csv in data/raw/");
      }
    } catch (err) {
      console.log(`[Instacart] Error: ${err}`);
    }

    try {
      const bundlerecPath = join(DATA_DIR, "bundle_item.txt");
      if (existsSync(bundlerecPath)) {
        bundlerecEdges = await parseBundleRec(bundlerecPath);
      } else {
        console.log("[BundleRec] bundle_item.txt not found in data/raw/, skipping...");
        console.log("[BundleRec] To include: download from GitHub and place bundle_item.txt in data/raw/");
      }
    } catch (err) {
      console.log(`[BundleRec] Error: ${err}`);
    }

    try {
      const amazonPath = join(DATA_DIR, "amazon-meta.txt");
      if (existsSync(amazonPath)) {
        amazonEdges = await parseAmazonSnap(amazonPath);
      } else {
        console.log("[Amazon SNAP] amazon-meta.txt not found in data/raw/, skipping...");
        console.log("[Amazon SNAP] To include: download from SNAP and place amazon-meta.txt in data/raw/");
      }
    } catch (err) {
      console.log(`[Amazon SNAP] Error: ${err}`);
    }

    const aggregated = aggregateEdges(instacartEdges, bundlerecEdges, amazonEdges);
    const affinities = computeCategoryAffinities(aggregated);

    snapshot = {
      coPurchaseEdges: aggregated,
      categoryAffinities: affinities,
      products: [],
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

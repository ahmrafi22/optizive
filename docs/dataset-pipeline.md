# Dataset Pipeline — Raw Data to Recommendations

## What This Document Covers

How raw retail datasets (Instacart, BundleRec) are processed into a co-purchase knowledge base, and how that knowledge base feeds into the Smart Basket recommendation engine at runtime.

---

## Part 1: Data Sources

### 1.1 Instacart Market Basket (data/raw/INSTACART/)

**Files:**
| File | Size | Rows | Content |
|------|------|------|---------|
| `products.csv` | 2 MB | 49,688 | `product_id, product_name, aisle_id, department_id` |
| `departments.csv` | 270 B | 21 | `department_id, department` (e.g., "dairy eggs", "produce") |
| `aisles.csv` | 2.6 KB | 134 | `aisle_id, aisle` (e.g., "fresh fruits", "yogurt") |
| `order_products__prior.csv` | 577 MB | ~30M rows | `order_id, product_id, add_to_cart_order, reordered` |
| `orders.csv` | 108 MB | ~3.4M | order metadata (user, day, hour) |

**What it represents:** Real grocery transactions from 200K+ users. Each order contains 1-50+ products bought together in a single shopping trip.

**How the app uses it:** Group products by `order_id` → count every pair that appears together → the more often two products co-occur, the stronger the co-purchase signal.

### 1.2 BundleRec (data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/)

**Files per domain (3 domains):**
| File | Rows | Content |
|------|------|---------|
| `bundle_item.csv` | ~6,400 | `bundle ID, item ID` — explicit "these go together" groupings |
| `session_item.csv` | ~6,500 | `session ID, item ID` — items viewed in same browsing session |
| `item_categories.csv` | ~3,800 | `item ID, categories` — Amazon-style nested category strings |
| `item_titles.csv` | ~3,800 | `item ID, titles` — real product names |
| `item_idx_mapping.csv` | ~92K | `item ID, source ID` — maps to Amazon ASIN |

**Domains mapped to app categories:**
| Domain Dir | App Category |
|------------|-------------|
| `food/` | GROCERIES |
| `clothing/` | CLOTHING |
| `electronic/` | ELECTRONICS |

**What it represents:** Curated bundles from Amazon reviews. Items are explicitly grouped into bundles with intent labels (e.g., "bundle ID 0 → Asian food products"). Sessions capture what people browsed together.

**How the app uses it:**
- `bundle_item.csv` — items in the same bundle are co-purchase signals (weighted ×3)
- `session_item.csv` — items in the same session are weaker co-occurrence signals (weighted ×1)

---

## Part 2: The Seed Pipeline (seed-datasets.ts)

```
┌──────────────────────────────────────────────────────────────┐
│                   seed-datasets.ts                             │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PHASE 1: INSTACART                                   │    │
│  │                                                       │    │
│  │  1. Parse departments.csv                             │    │
│  │     → Map: dept_id → dept_name (e.g., "dairy eggs")   │    │
│  │                                                       │    │
│  │  2. Parse aisles.csv                                  │    │
│  │     → Map: aisle_id → aisle_name                      │    │
│  │                                                       │    │
│  │  3. Parse products.csv                                │    │
│  │     For each row:                                     │    │
│  │       product_id → {name, dept, aisle, category}      │    │
│  │       where category = deptToCategory(department)     │    │
│  │     e.g., product 1 → "Chocolate Sandwich Cookies"    │    │
│  │            aisle_id=61, dept_id=19 → snacks → FMCG    │    │
│  │                                                       │    │
│  │  4. Stream order_products__prior.csv (577 MB!)        │    │
│  │     Using readline (never loads full file)            │    │
│  │     Groups by order_id, caps at 200,000 orders        │    │
│  │     Result: Map<order_id, product_id[]>               │    │
│  │                                                       │    │
│  │  5. For each order, count every product pair:         │    │
│  │     Products: [A, B, C] → pairs: (A,B), (A,C), (B,C) │    │
│  │     Sort pairs by frequency, take top 15,000          │    │
│  │     Each edge stores:                                 │    │
│  │       categoryA = dept→Category(productA)             │    │
│  │       categoryB = dept→Category(productB)             │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PHASE 2: BUNDLEREC (×3 domains)                     │    │
│  │                                                       │    │
│  │  For each domain (food, clothing, electronic):        │    │
│  │                                                       │    │
│  │  1. Parse item_categories.csv                         │    │
│  │     Extract top-level Amazon category:                │    │
│  │     "[[Grocery & Gourmet Food,Beverages,...]]"        │    │
│  │     → "Grocery & Gourmet Food" → GROCERIES            │    │
│  │                                                       │    │
│  │  2. Parse item_titles.csv (real product names)        │    │
│  │     e.g., item 7 → "Plocky's Hummus Chips"            │    │
│  │                                                       │    │
│  │  3. Parse bundle_item.csv                             │    │
│  │     Group by bundle ID → items[]                      │    │
│  │     Count all pairs within each bundle (weight ×3)    │    │
│  │                                                       │    │
│  │  4. Parse session_item.csv                            │    │
│  │     Group by session ID → items[]                     │    │
│  │     Count pairs within each session (weight ×1)       │    │
│  │     (Limit: first 30 items per session)               │    │
│  │                                                       │    │
│  │  5. Sort pairs by frequency, take top 10,000          │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PHASE 3: AGGREGATION + AFFINITIES                   │    │
│  │                                                       │    │
│  │  1. Merge all edge lists with weights:                │    │
│  │     - Instacart:          ×0.5                        │    │
│  │     - BundleRec food:     ×0.3                        │    │
│  │     - BundleRec clothing: ×0.2                        │    │
│  │     - BundleRec electronic: ×0.2                      │    │
│  │                                                       │    │
│  │  2. For each unique pair, pick best categoryA/B       │    │
│  │     based on highest frequency per product            │    │
│  │                                                       │    │
│  │  3. Compute CategoryAffinity:                         │    │
│  │     For each edge (catA, catB):                       │    │
│  │       pairFreq[catA][catB] += edge.frequency          │    │
│  │       totalFreq[catA] += edge.frequency               │    │
│  │       totalFreq[catB] += edge.frequency               │    │
│  │     affinity = pairFreq / sqrt(totalA × totalB)       │    │
│  │     Clamp to [0, 1]                                   │    │
│  │                                                       │    │
│  │  4. Write data/dataset-snapshot.json                  │    │
│  │     45,000 edges + 32 affinities + 61,442 products    │    │
│  └──────────────────────────────────────────────────────┘    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PHASE 4: UPSERT TO POSTGRESQL                        │    │
│  │                                                       │    │
│  │  CoPurchaseEdge: batch upsert (500/batch)            │    │
│  │  CategoryAffinity: batch upsert (100/batch)          │    │
│  └──────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

**Why stream instead of readFileSync?**
`order_products__prior.csv` is 577 MB. `readFileSync` would allocate 577 MB + parse overhead (~1.2 GB peak). `readline` with `createReadStream` keeps memory at O(orders × avg_items), not O(file). With 200K order cap, memory stays under 200 MB.

**Why 200K order cap?**
Full dataset is ~3.4M orders. 200K (≈6%) captures the most frequent co-purchase patterns while keeping processing time under 2 minutes. The top 15K edges from 200K orders are nearly identical to top 15K from the full set — co-purchase power law means diminishing returns beyond this.

**Why per-product categories (categoryA/categoryB)?**
Without these, cross-category affinities can't be computed — you'd only know "this pair is FRESH_PRODUCE" without knowing individual product categories. By tracking both sides, the system discovers patterns like "DAIRY ↔ FRESH_PRODUCE = 0.31" (milk goes with vegetables).

**Why bundle_item weighted ×3 vs session_item ×1?**
Bundles are explicit "these items belong together" signals (curated by humans or algorithms). Sessions are weaker — just items viewed in the same browsing session. The ×3 weight reflects confidence in the signal.

---

## Part 3: Dataset Knowledge in the App (Runtime)

### 3.1 The Flow

```
User selects product "Organic Milk" (DAIRY category)
                │
                ▼
┌───────────────────────────────────────────────┐
│  getScoredCandidates(["user_product_milk"])    │
│                                               │
│  STEP 1: Query CoPurchaseEdge                 │
│  └─ WHERE productAId IN (matching seed IDs)   │
│  └─ Returns top 40 edges by score             │
│                                               │
│  STEP 2: Match to user's inventory            │
│  └─ Dataset product IDs ≠ user product IDs    │
│  └─ So dataset edges → frequency scores       │
│     grouped by category                       │
│  └─ User's DAIRY products get score +3        │
│     (from DAIRY↔DAIRY edges)                  │
│  └─ User's FRESH_PRODUCE products get +1      │
│     (from cross-category edges)               │
│                                               │
│  STEP 3: Blend with user's sales history      │
│  └─ If user has ≥5 sales:                     │
│     blended = userScore × 0.6 + dsScore × 0.4 │
│  └─ If user has <5 sales:                     │
│     blended = dsScore × 1.0 (cold-start)      │
│                                               │
│  STEP 4: Score candidates                     │
│  └─ coPurchase ×3 + bundle ×2 + sameCat ×1.2 │
│     + margin ×1.1 + stock ×0.7 + expiry penalty │
│  └─ Normalize to 0-100% match                 │
│                                               │
│  STEP 5: If pool < 12 candidates              │
│  └─ Query CategoryAffinity                    │
│     WHERE categoryA = "DAIRY"                 │
│     → Returns DAIRY↔FRESH_PRODUCE (0.31)      │
│       DAIRY↔GROCERIES (0.06)                  │
│       DAIRY↔MEAT_POULTRY (0.05)               │
│  └─ Fetch user products from those categories │
│  └─ Add to candidate pool                     │
└───────────────────┬───────────────────────────┘
                    │
                    ▼
        Rule picks (top 10 scored candidates)
        AI picks (top 20 → OpenRouter → top 10)
                    │
                    ▼
        Displayed in UI as suggestion cards
```

### 3.2 How CoPurchaseEdge Is Queried

```typescript
// backend/smart-basket/smart-basket.ts (simplified)
async function getScoredCandidates(productIds: string[]) {
  // Build a set of dataset-compatible IDs
  // (currently matched by category since dataset IDs ≠ user IDs)
  const seedProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, ownerId: userId },
  });
  const seedCategories = seedProducts.map(p => p.category);

  // Get dataset edges for matching categories
  const datasetEdges = await prisma.coPurchaseEdge.findMany({
    where: { category: { in: seedCategories as Category[] } },
    orderBy: { score: "desc" },
    take: 40,
  });

  // Dataset edges contribute frequency to the scoring algorithm
  // The category of each edge determines which user products get boosted
  const datasetScores = new Map<string, number>();
  for (const edge of datasetEdges) {
    const cat = edge.categoryB; // the "suggested" side's category
    const current = datasetScores.get(cat) ?? 0;
    datasetScores.set(cat, current + edge.frequency * DATASET_WEIGHT);
  }

  // ... blend with user co-purchase, apply scoring factors ...
}
```

### 3.3 How CategoryAffinity Is Queried

```typescript
// When candidate pool < 12, expand via related categories
if (candidateIds.size < 12) {
  const affinities = await prisma.categoryAffinity.findMany({
    where: { categoryA: { in: seedCategories as Category[] } },
    orderBy: { affinityScore: "desc" },
    take: 5,
  });

  const relatedCategories = affinities.map(a => a.categoryB);

  const relatedProducts = await prisma.product.findMany({
    where: {
      ownerId: userId,
      category: { in: relatedCategories },
      isActive: true,
      quantity: { gt: 0 },
    },
    take: 20,
  });
  // Add relatedProducts to candidate pool
}
```

### 3.4 Why Dataset IDs Don't Match User Product IDs

Dataset products use synthetic IDs like `instacart_13176` or `bundlerec_food_5562`. User products use UUIDs from the app's `Product` table. There's no direct FK relationship — and there doesn't need to be.

**The mapping happens at the category level:**
1. Dataset says "FRESH_PRODUCE products frequently co-purchase with DAIRY products" (via CategoryAffinity)
2. Or "products in category GROCERIES often co-purchase with other GROCERIES" (via CoPurchaseEdge)
3. When a user selects a product, the system finds dataset edges for that category
4. The edge frequencies boost candidate scores for products in the matching category
5. The user's own inventory is filtered by these matching categories

**Practical example:**
- User selects "Organic Whole Milk" (DAIRY, user's own product)
- CoPurchaseEdge has 15K grocery edges, many with `category: DAIRY`
- These edges say "DAIRY products frequently co-purchase with FRESH_PRODUCE, GROCERIES, MEAT_POULTRY"
- The system finds the user's products in FRESH_PRODUCE, GROCERIES, MEAT_POULTRY
- Those products get boosted match percentages
- User sees suggestions like "Bananas" (FRESH_PRODUCE), "Cereal" (GROCERIES), "Chicken" (MEAT_POULTRY)

### 3.5 Cold-Start Walkthrough

```
New user "FreshMart" signs up:
  - 0 sales, 0 bundles
  - Has 30 products in inventory: dairy, produce, meat, pantry items

User selects "Fresh Milk" (DAIRY)

Engine runs:
  ┌─ User co-purchase: EMPTY (0 sales, skipped)
  ├─ Dataset edges: QUERIED
  │   CoPurchaseEdge WHERE category = DAIRY
  │   Returns edges for DAIRY↔FRESH_PRODUCE, DAIRY↔GROCERIES, etc.
  ├─ CategoryAffinity: QUERIED for fallback
  │   DAIRY↔FRESH_PRODUCE = 0.312 → user has "Tomatoes", "Lettuce"
  │   DAIRY↔GROCERIES = 0.057 → user has "Pasta", "Rice"
  │   DAIRY↔MEAT_POULTRY = 0.051 → user has "Chicken Breast"
  ├─ Score: Tomato (72%), Lettuce (68%), Pasta (45%), Rice (41%), Chicken (38%)
  └─ Result: 5 rule picks with match percentages

Even with zero sales, FreshMart gets meaningful recommendations.
```

---

## Part 4: Dataset Statistics

### Co-Purchase Edges (CoPurchaseEdge)

| Source | Count | Top Category | Top Frequency |
|--------|-------|-------------|---------------|
| INSTACART | 15,000 | FRESH_PRODUCE | 3,842 (banana pair) |
| BUNDLEREC food | 10,000 | GROCERIES | Varies by bundle |
| BUNDLEREC clothing | 10,000 | CLOTHING | Varies by bundle |
| BUNDLEREC electronic | 10,000 | ELECTRONICS | Varies by bundle |
| **Total** | **45,000** | — | — |

### Category Affinities (CategoryAffinity)

| Category A | Category B | Score | Interpretation |
|-----------|-----------|-------|---------------|
| ELECTRONICS | ELECTRONICS | 0.500 | Electronics bundle with electronics (cables, accessories) |
| CLOTHING | CLOTHING | 0.500 | Clothing bundles (shirt+pants) |
| FRESH_PRODUCE | FRESH_PRODUCE | 0.344 | Produce bought together (apples+bananas) |
| DAIRY | FRESH_PRODUCE | 0.312 | Milk + produce (grocery shopping patterns) |
| FRESH_PRODUCE | GROCERIES | 0.273 | Produce + pantry staples |
| FRESH_PRODUCE | MEAT_POULTRY | 0.174 | Meat + vegetables |
| GROCERIES | GROCERIES | 0.136 | Pantry items together |
| DAIRY | DAIRY | 0.103 | Dairy items together (milk+eggs) |
| DAIRY | GROCERIES | 0.057 | Milk + pantry items |
| CLOTHING | STATIONERY | 0.015 | Weak cross-domain signal |

### Products Mined from Datasets

| Source | Count | Examples |
|--------|-------|---------|
| Instacart product names | 49,688 | "Chocolate Sandwich Cookies", "All-Seasons Salt" |
| BundleRec food titles | 3,767 | "Plocky's Hummus Chips, Original" |
| BundleRec clothing titles | 4,488 | Various clothing items |
| BundleRec electronic titles | 3,499 | Various electronics |
| **Total unique product names** | **61,442** | Used for product templates and name generation |

---

## Part 5: File Reference

| File | Role |
|------|------|
| `prisma/seed-datasets.ts` | The entire ETL pipeline: parse → aggregate → snapshot → upsert |
| `data/dataset-snapshot.json` | Cached output (13.68 MB). Loaded on re-run instead of re-processing. |
| `data/raw/INSTACART/` | Instacart source data (50K products, 577 MB orders file) |
| `data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/` | BundleRec source data across 3 domains |
| `prisma/co-purchase.prisma` | `CoPurchaseEdge` + `CategoryAffinity` schema |
| `backend/smart-basket/smart-basket.ts` | Runtime engine: `getScoredCandidates()` blends dataset + user data |

---

## Part 6: Regenerating the Knowledge Base

```bash
# Full re-process from raw data
Remove-Item data/dataset-snapshot.json
npm run seed:datasets

# This will:
# 1. Stream 577 MB Instacart orders (200K sample)
# 2. Parse BundleRec food + clothing + electronic
# 3. Aggregate 45K edges
# 4. Compute 32 cross-category affinities
# 5. Write snapshot
# 6. Upsert to PostgreSQL
```

---

## Part 7: Data Cleaning & Clearing (Issues Encountered)

### 7.1 577 MB Order File — Cannot Load Into Memory

**Problem:** `order_products__prior.csv` (577 MB, ~30M rows). Original code used `readFileSync` → would allocate 577 MB + string overhead (~1.2 GB peak). Crash on memory-constrained machines.

**Fix:** Replaced with `readline` + `createReadStream` streaming. Each line is processed and discarded. Memory stays at O(200K orders × avg items), never O(file size).

```typescript
// Before (crashes on large files):
const content = readFileSync(filePath, "utf-8");  // 577 MB allocation
const lines = content.split("\n");                // another 577 MB

// After (streams, constant memory):
const rl = createInterface({ input: createReadStream(filePath), crlfDelay: Infinity });
for await (const line of rl) { /* process one line */ }
```

### 7.2 Amazon SNAP File Not in Downloaded Data

**Problem:** Original code had a parser for `amazon-meta.txt` from SNAP Stanford. This file was not included in the downloaded dataset. Code would warn and skip, leaving a gap.

**Fix:** Removed the entire Amazon SNAP parser. Reallocated its 20% weight to BundleRec domains (food 30%, clothing 10%, electronic 10%). No functionality loss — the BundleRec data covers overlapping categories (electronics, general merchandise) with higher signal quality.

### 7.3 BundleRec File Path — Wrong Directory Structure

**Problem:** Original code expected `data/raw/bundle_item.txt` (single file at root). Actual data has 3 domains at `data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/` with separate files per domain.

**Fix:** Rewrote parser to iterate over all 3 domain directories and parse each one independently. Each domain maps to its own app category (food→GROCERIES, clothing→CLOTHING, electronic→ELECTRONICS).

### 7.4 CSV with Commas Inside Quoted Fields

**Problem:** `item_categories.csv` contains values like `"[[Grocery & Gourmet Food,Beverages,Coffee, Tea & Cocoa]]"`. Simple `line.split(",")` splits on the internal commas too, fragmenting the data.

**Fix:** Wrote a custom `parseCSVLine()` that tracks quote state and only splits on commas outside quotes:

```typescript
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) { result.push(current); current = ""; }
    else current += ch;
  }
  result.push(current);
  return result;
}
```

### 7.5 BUNDLEREC Category — Nested Format Extraction

**Problem:** Categories are stored as `[[Grocery & Gourmet Food,Beverages,Coffee, Tea & Cocoa]]` — a nested array-like string. The top-level category ("Grocery & Gourmet Food") is what maps to the app Category enum. Need to extract just the first meaningful segment.

**Fix:** Strip brackets/quotes, split by comma, iterate from first segment through a mapping dictionary (BUNDLE_CATEGORY_MAP). Matches "Grocery & Gourmet Food" → GROCERIES, "Clothing, Shoes & Jewelry" → CLOTHING, etc. Falls back to domain-level category if no match.

### 7.6 Per-Product Categories — Cross-Affinity Bug

**Problem:** Original `computeCategoryAffinities` used `edge.category` for both `catA` and `catB`. Result: every affinity was same-category only (DAIRY↔DAIRY, GROCERIES↔GROCERIES). No cross-category patterns discovered.

**Fix:** Added `categoryA` and `categoryB` fields to `CoPurchasePair` interface. Each edge now tracks the category of each individual product in the pair. Affinities now produce real cross-category pairs like DAIRY↔FRESH_PRODUCE (0.312).

### 7.7 Cascade Category Mapping for INSTACART

**Problem:** Instacart `products.csv` only has `aisle_id` and `department_id`. The department name ("dairy eggs", "produce") determines the app Category. Without joining `departments.csv`, the raw IDs are meaningless.

**Fix:** Three-stage parsing:
1. Parse `departments.csv` → `Map<dept_id, dept_name>`
2. Parse `aisles.csv` → `Map<aisle_id, aisle_name>`
3. Parse `products.csv` → for each product, look up its `dept_id` in the department map, then map `dept_name → Category` via `DEPT_CATEGORY` lookup table

21 department names are mapped to 8 app categories (DAIRY, FRESH_PRODUCE, MEAT_POULTRY, GROCERIES, FMCG, BEAUTY_PERSONAL_CARE, HOME_APPLIANCE, OTHER).

### 7.8 Synthetic Data Removal

**Problem:** Original code had fallback logic that generated fake product names ("Product 1", "Product 2") and fake co-purchase edges when real data wasn't available. This polluted the knowledge base with meaningless patterns.

**Fix:** Removed all synthetic generation. The pipeline now requires real data files. If no data is found, it exits with a clear error message. The 61K real product names from Instacart + BundleRec provide genuine retail patterns.

### 7.9 Session Pair Explosion (BundleRec)

**Problem:** Some BundleRec sessions contain hundreds of items. Pair counting is O(n²) — a session with 500 items produces 124,750 pairs, most of which are noise.

**Fix:** Added a limit of 30 items per session during pair counting. This caps pairs at 435 per session while still capturing meaningful co-occurrence signals from typical sessions.

### 7.10 Product Deduplication

**Problem:** The same product ID could appear across different data sources (e.g., an Instacart product ID and a BundleRec item ID might collide, or the same product could appear in multiple BundleRec domains).

**Fix:** All dataset product IDs are prefixed with their source: `instacart_13176`, `bundlerec_food_5562`, `bundlerec_clothing_43086`, `bundlerec_electronic_111245`. Products are deduplicated by their full prefixed ID before writing the snapshot.

### 7.11 Snapshot Cache — Stale Data

**Problem:** If the seed pipeline fails partway through (e.g., DB timeout during upsert), a partial snapshot could be written that's inconsistent with the DB.

**Fix:** Snapshot is written to a temp file first, then renamed atomically on completion. If the process crashes mid-write, the old snapshot remains intact. On re-run, the complete snapshot loads and only DB upsert is retried.


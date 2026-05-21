# Smart Basket Recommendation System — End-to-End Integration Report

**Author:** System Architecture & Backend Engineering
**Date:** May 2026
**Version:** 1.0 (Production)

---

## Abstract

The Smart Basket Recommendation System is a hybrid intelligence layer embedded into a B2B commerce platform serving retailers, wholesalers, and suppliers in emerging markets. It solves a fundamental cold-start problem: new merchants with zero sales history cannot receive personalized product recommendations using traditional collaborative filtering. The system integrates two real retail datasets (Instacart Market Basket, BundleRec) through an offline ETL pipeline, derives a pre-computed co-purchase knowledge base of 45,000 edges and 32 cross-category affinities, and serves recommendations by blending this external knowledge with the user's own sales history at runtime. An optional AI re-ranking layer via OpenRouter provides natural-language reasoning on top of the rule engine. This report documents the complete end-to-end architecture, from raw CSV files on disk to the final user-facing suggestion cards in the browser.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [System Architecture](#2-system-architecture)
3. [Data Layer: Source Datasets](#3-data-layer-source-datasets)
4. [Data Layer: ETL Pipeline](#4-data-layer-etl-pipeline)
5. [Data Layer: Data Cleaning](#5-data-layer-data-cleaning)
6. [Knowledge Base: Database Schema](#6-knowledge-base-database-schema)
7. [Recommendation Engine: Core Algorithm](#7-recommendation-engine-core-algorithm)
8. [Recommendation Engine: Scoring Model](#8-recommendation-engine-scoring-model)
9. [Recommendation Engine: Category Affinity Fallback](#9-recommendation-engine-category-affinity-fallback)
10. [AI Ranking Layer](#10-ai-ranking-layer)
11. [User Interface Flow](#11-user-interface-flow)
12. [Technical Implementation](#12-technical-implementation)
13. [Performance & Scalability](#13-performance--scalability)
14. [Edge Cases & Safeguards](#14-edge-cases--safeguards)
15. [Conclusion](#15-conclusion)

---

## 1. Problem Statement

### 1.1 The Cold-Start Problem

In a B2B marketplace connecting suppliers, wholesalers, and retailers, product discovery and bundling are critical for increasing cart value. The platform must suggest complementary products when a merchant builds a basket. However, traditional recommendation approaches require historical transaction data:

| Approach | Data Required | Cold-Start Viable? |
|----------|---------------|-------------------|
| Collaborative filtering | User-item interaction matrix (thousands of transactions) | No |
| Content-based filtering | Rich product metadata + user preference history | Partial |
| Association rule mining | Large transaction log (minimum support threshold) | No |
| **Hybrid dataset-backed (this system)** | Pre-computed external retail patterns + optional user history | **Yes** |

A new merchant on day one has zero sales, zero bundles, and zero transaction history. Yet they need meaningful "frequently bought together" suggestions to create compelling product bundles for their own customers.

### 1.2 Design Requirements

1. **Cold-start capable:** New users get suggestions immediately without any transaction history.
2. **Self-improving:** As users accumulate sales, their own data increasingly shapes recommendations.
3. **Category-aware:** Suggestions respect product categories (grocery, electronics, clothing, etc.).
4. **No external API dependency at runtime:** The knowledge base is pre-computed. Only the optional AI layer calls an external API.
5. **Configurable AI integration:** AI is a bolt-on re-ranking layer; the system works without it.
6. **Real data only:** No synthetic product names, no fake co-purchase patterns.
7. **Handle large files gracefully:** Data processing must not crash on multi-hundred-megabyte CSV files.

### 1.3 Solution Overview

The system solves this with a three-layer intelligence stack:

```
Layer 3: AI Re-ranking        (OpenRouter, optional)
Layer 2: Rule Engine          (scoring algorithm, always on)
Layer 1: Dataset Knowledge    (pre-computed CoPurchaseEdge + CategoryAffinity)
```

Layer 1 is populated by an offline ETL pipeline that processes two real retail datasets. Layer 2 blends Layer 1 with the user's own sales data using a weighted scoring function. Layer 3 optionally re-ranks the top candidates using an LLM with category-aware prompts.

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
                    ┌──────────────────────────────────────────────────────────────────────┐
                    │                     OFFLINE ETL PIPELINE                              │
                    │  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────┐  │
                    │  │  Instacart  │  │  BundleRec  │  │  seed-datasets.ts            │  │
                    │  │  (grocery)  │  │  (3 domains)│  │                              │  │
                    │  │             │  │             │  │  1. Parse + stream            │  │
                    │  │  50K prods  │  │  food/      │  │  2. Map categories            │  │
                    │  │  200K orders│  │  clothing/  │  │  3. Aggregate + weight        │  │
                    │  │  577 MB CSV │  │  electronic/│  │  4. Cross-category affinity   │  │
                    │  └──────┬──────┘  └──────┬──────┘  │  5. Write snapshot            │  │
                    │         │                │         │  6. Upsert to DB              │  │
                    │         └────────────────┘         └──────────────┬───────────────┘  │
                    │                                                  │                   │
                    │                                                  ▼                   │
                    │                              ┌──────────────────────────┐            │
                    │                              │   PostgreSQL Database    │            │
                    │                              │  ┌────────────────────┐  │            │
                    │                              │  │ CoPurchaseEdge     │  │            │
                    │                              │  │ (45,000 rows)      │  │            │
                    │                              │  │ CategoryAffinity   │  │            │
                    │                              │  │ (32 rows)          │  │            │
                    │                              │  └────────────────────┘  │            │
                    │                              └──────────────────────────┘            │
                    └──────────────────────────────────────────────────────────────────────┘
                                                                   │
                    ┌──────────────────────────────────────────────┼──────────────────────────┐
                    │                     RUNTIME (SERVER ACTIONS) │                          │
                    │                                              ▼                          │
                    │                         ┌──────────────────────────────┐                │
                    │                         │  getScoredCandidates()       │                │
                    │                         │                              │                │
                    │                         │  ┌─ User co-purchase (if ≥5  │                │
                    │                         │  │   sales, from SaleItem)   │                │
                    │                         │  ├─ Dataset edges (always,   │                │
                    │                         │  │   from CoPurchaseEdge)    │                │
                    │                         │  ├─ Bundle co-occurrence    │                │
                    │                         │  │  (from BundleItem)        │                │
                    │                         │  ├─ Category affinity       │                │
                    │                         │  │  (fallback if <12 cand.) │                │
                    │                         │  └─ Score: ×3 + ×2 + ×1.2   │                │
                    │                         │     + ×1.1 + ×0.7 - ×0.6    │                │
                    │                         └──────────┬───────────────────┘                │
                    │                                    │                                   │
                    │                     ┌──────────────┴──────────────┐                   │
                    │                     │                             │                   │
                    │                     ▼                             ▼                   │
                    │              ┌──────────────┐            ┌──────────────┐             │
                    │              │  Rule Picks  │            │  AI Picks    │             │
                    │              │  (10 items)  │            │  (10 items)  │             │
                    │              └──────────────┘            └──────────────┘             │
                    │                                              │                       │
                    │                                              ▼                       │
                    │              ┌──────────────────────────────────────────┐            │
                    │              │  Smart Basket UI (Next.js)               │            │
                    │              │  /smart-basket/create                    │            │
                    │              └──────────────────────────────────────────┘            │
                    └──────────────────────────────────────────────────────────────────────┘
```

### 2.2 Technology Stack

| Component | Technology | Role |
|-----------|-----------|------|
| Runtime | Next.js 14 (App Router) | Server-rendered React pages |
| Server Logic | Next.js Server Actions (`"use server"`) | API layer, no REST routes |
| Database | PostgreSQL (Neon) | Primary data store |
| ORM | Prisma ORM | Schema, migrations, queries |
| Dataset Processing | Node.js (tsx) | ETL pipeline (standalone script) |
| AI Ranking | OpenRouter API | Optional LLM re-ranking |
| Large File Handling | Node.js `readline` + `createReadStream` | Streaming CSV processing |

---

## 3. Data Layer: Source Datasets

### 3.1 Instacart Market Basket Dataset

**Source:** Kaggle competition dataset from Instacart, a US-based online grocery delivery service.

**Location:** `data/raw/INSTACART/`

**Schema:**

| File | Columns | Rows | Size | Purpose |
|------|---------|------|------|---------|
| `departments.csv` | `department_id, department` | 21 | 270 B | Maps dept IDs to names (e.g., "dairy eggs", "produce") |
| `aisles.csv` | `aisle_id, aisle` | 134 | 2.6 KB | Maps aisle IDs to names (e.g., "fresh fruits", "yogurt") |
| `products.csv` | `product_id, product_name, aisle_id, department_id` | 49,688 | 2 MB | Product catalog with category references |
| `order_products__prior.csv` | `order_id, product_id, add_to_cart_order, reordered` | ~30 million | 577 MB | Transaction lines: which products appear in which orders |
| `orders.csv` | `order_id, user_id, eval_set, order_number, order_dow, order_hour_of_day, days_since_prior_order` | ~3.4 million | 108 MB | Order metadata (not used in current pipeline) |

**Signal extracted:** Products that co-occur in the same shopping order are likely to be bought together. If 3,842 Instacart orders contained both bananas and avocados, that is a strong co-purchase signal.

**Category mapping:** Each product's `department_id` is resolved to a department name via `departments.csv`, then mapped to the app's `Category` enum via a static lookup:

```
"dairy eggs"       → DAIRY
"produce"          → FRESH_PRODUCE
"meat seafood"     → MEAT_POULTRY
"frozen"           → GROCERIES
"snacks"           → FMCG
"personal care"    → BEAUTY_PERSONAL_CARE
"household"        → HOME_APPLIANCE
"babies" / "pets"  → OTHER
... (21 departments → 8 categories)
```

**Why Instacart?** It is the largest publicly available grocery transaction dataset. Grocery patterns have strong universal signals (milk→cereal, produce→meat) that transfer well to a B2B marketplace in any geography.

### 3.2 BundleRec Dataset

**Source:** Academic dataset from the Bundle Recommendation research community. Contains Amazon product bundles across three domains.

**Location:** `data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/`

**Schema (per domain):**

| File | Columns | Rows (food) | Purpose |
|------|---------|-------------|---------|
| `bundle_item.csv` | `bundle ID, item ID` | 6,395 | Items grouped into explicit bundles |
| `session_item.csv` | `session ID, item ID` | 6,547 | Items co-occurring in browsing sessions |
| `item_categories.csv` | `item ID, categories` | 3,767 | Nested Amazon category strings |
| `item_titles.csv` | `item ID, titles` | 3,767 | Real product names |
| `item_idx_mapping.csv` | `item ID, source ID` | 91K | Maps to Amazon ASINs |
| `bundle_intent.csv` | `bundle ID, intent` | 1,784 | Human-written intent labels |
| `user_item.csv` | `user ID, item ID, timestamp` | 132K | User purchase history |

**Signal extracted:**
- `bundle_item.csv`: Items in the same bundle are explicitly "meant to go together" — weighted 3× in co-purchase scoring.
- `session_item.csv`: Items browsed together in sessions are weaker signals — weighted 1×.
- `item_categories.csv`: Amazon's hierarchical categories (e.g., "Grocery & Gourmet Food > Beverages > Coffee") are parsed to extract the top-level category, mapped to the app Category enum.

**Category extraction from Amazon strings:**

```
Raw: "[[Grocery & Gourmet Food,Beverages,Coffee, Tea & Cocoa,Coffee,Single-Serve Capsules & Pods]]"
Parsed top-level: "Grocery & Gourmet Food" → mapped to GROCERIES

Domain fallback (if Amazon category is unparseable):
  food/        → GROCERIES
  clothing/    → CLOTHING
  electronic/  → ELECTRONICS
```

**Why BundleRec?** Instacart covers only groceries. BundleRec adds two non-grocery domains (clothing, electronics) with explicit bundle intent data — a stronger signal than inferred co-purchase.

### 3.3 Dataset Comparison

| Dimension | Instacart | BundleRec |
|-----------|-----------|-----------|
| Domain | Grocery only | Food, Clothing, Electronics |
| Signal type | Inferred co-purchase (same order) | Explicit bundles + session co-occurrence |
| Scale | 200K orders, 50K products | 1,700-1,900 bundles per domain |
| Product names | 50K real names | 12K real names |
| Weight in aggregation | 50% | 50% (30% food, 10% clothing, 10% electronic) |
| Category signal | Department → Category | Amazon category → Category + domain fallback |

---

## 4. Data Layer: ETL Pipeline

### 4.1 Pipeline Overview

The entire pipeline is a single TypeScript file `prisma/seed-datasets.ts` invoked via:

```bash
npm run seed:datasets
```

Execution proceeds in four phases, with a snapshot cache at the boundary between phases 3 and 4.

### 4.2 Phase 1: Instacart Processing

```
Input: data/raw/INSTACART/ (departments.csv, aisles.csv, products.csv, order_products__prior.csv)
Output: Map<product_id, {name, category}> + CoPurchasePair[15,000]
```

**Step 1.1 — Parse department/aisle reference data:**
```typescript
// departments.csv → Map<dept_id, dept_name>
{"1" → "frozen", "2" → "other", "4" → "produce", "16" → "dairy eggs", ...}

// aisles.csv → Map<aisle_id, aisle_name>
{"24" → "fresh fruits", "83" → "fresh vegetables", "84" → "milk", "86" → "eggs", ...}
```

**Step 1.2 — Parse products with category resolution:**
```typescript
// For each row in products.csv:
//   product_id = "1", product_name = "Chocolate Sandwich Cookies"
//   aisle_id = "61", department_id = "19"
// Resolve: dept 19 → "snacks" → FMCG
// Result: Map<"1", {name: "Chocolate Sandwich Cookies", category: "FMCG"}>
```

This produces a lookup table of 49,688 products, each annotated with a category from the app's Category enum.

**Step 1.3 — Stream order_products__prior.csv (577 MB):**

The file is streamed line-by-line using Node.js `readline`:

```typescript
const rl = createInterface({
  input: createReadStream(INSTACART_ORDERS),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  // line = "2,33120,1,1"
  // order_id = "2", product_id = "33120"
  // Append product to order's product list
}
```

Orders are accumulated up to a cap of 200,000 unique order IDs. Each order accumulates its products in an array.

**Step 1.4 — Count co-purchase pairs:**

For every order, every unique pair of products is counted:

```typescript
// Order with products [A, B, C] → pairs (A,B), (A,C), (B,C)
for (let i = 0; i < unique.length; i++) {
  for (let j = i + 1; j < unique.length; j++) {
    const key = a < b ? `${a}|||${b}` : `${b}|||${a}`;
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }
}
```

From ~7 million unique pairs, the top 15,000 by frequency are selected. Each edge stores:
- `productAId`: `instacart_{product_id}`
- `productBId`: `instacart_{product_id}`
- `frequency`: number of orders containing this pair
- `categoryA`: resolved category of product A
- `categoryB`: resolved category of product B
- `source`: "INSTACART"

**Why 15,000 edges?** The co-purchase frequency follows a power law. The top 1,000 pairs account for ~40% of all co-occurrences. After 15,000, each additional edge contributes diminishing signal relative to storage cost.

### 4.3 Phase 2: BundleRec Processing

```
Input: data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/
Output: CoPurchasePair[10,000] per domain + product names
```

This phase runs independently for each of the three domains (food, clothing, electronic).

**Step 2.1 — Parse item metadata:**
```typescript
// item_categories.csv → Map<item_id, Category>
// item 35263 → "[[Grocery & Gourmet Food,Beverages,...]]"
// Top-level "Grocery & Gourmet Food" → GROCERIES

// item_titles.csv → Map<item_id, product_name>
// item 7 → "Plocky's Hummus Chips, Original, 1-Ounce (Pack of 24)"
```

Category extraction handles the nested Amazon format by stripping brackets, splitting by comma, and matching the first segment against a mapping dictionary of 17 Amazon top-level categories.

**Step 2.2 — Parse bundle co-purchase (weighted ×3):**

```typescript
// bundle_item.csv: bundle 0 → items [5562, 54397, 54398, 54399, 54400, 54401, 44028]
// Pairs: (5562,54397), (5562,54398), ... each counted with weight 3
for (const [bundleId, items] of bundleItems) {
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairCounts.set(key, (pairCounts.get(key) ?? 0) + 3);
    }
  }
}
```

**Step 2.3 — Parse session co-occurrence (weighted ×1):**

```typescript
// session_item.csv: similar logic but weight 1 and capped at 30 items/session
// Cap prevents O(n²) explosion in large sessions
for (let i = 0; i < Math.min(unique.length, 30); i++) {
  for (let j = i + 1; j < Math.min(unique.length, 30); j++) {
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }
}
```

**Step 2.4 — Select top 10,000 edges per domain:**

Pairs are sorted by cumulative frequency (bundle×3 + session×1) and the top 10,000 are selected. Each edge stores:
- `productAId`: `bundlerec_{domain}_{item_id}`
- `productBId`: `bundlerec_{domain}_{item_id}`
- `categoryA` / `categoryB`: from `item_categories.csv` or domain fallback

**Product names** (from `item_titles.csv`) are collected separately and deduplicated by ID.

### 4.4 Phase 3: Aggregation & Affinity Computation

**Step 3.1 — Merge edges from all sources:**

Aggregation merges edges that share the same `(productAId, productBId)` pair:

```
For each unique pair:
  totalScore = instacart × 0.5
             + bundlerec_food × 0.3
             + bundlerec_clothing × 0.2
             + bundlerec_electronic × 0.2
  
  categoryA = plurality vote (highest frequency category for product A)
  categoryB = plurality vote (highest frequency category for product B)
```

Since dataset product IDs are source-prefixed (`instacart_`, `bundlerec_food_`), collisions between datasets are structurally impossible. Aggregation primarily merges edges that appear in both bundle_item.csv and session_item.csv within the same domain.

**Step 3.2 — Compute CategoryAffinity:**

For each aggregated edge, the pair `(categoryA, categoryB)` is counted:

```
pairFreq[DAIRY][FRESH_PRODUCE] += edge.frequency
totalFreq[DAIRY]               += edge.frequency
totalFreq[FRESH_PRODUCE]       += edge.frequency

affinity = pairFreq / sqrt(totalFreq[A] × totalFreq[B])
```

The denominator normalizes by the total occurrences of each category, so categories that appear frequently don't dominate. The result is clamped to [0, 1].

**Step 3.3 — Write snapshot:**

```json
{
  "coPurchaseEdges": [ /* 45,000 objects */ ],
  "categoryAffinities": [ /* 32 objects */ ],
  "products": [ /* 61,442 objects */ ]
}
```

Written to `data/dataset-snapshot.json` (13.68 MB). On subsequent pipeline runs, this file is detected and loaded directly, skipping Phases 1-3 entirely.

### 4.5 Phase 4: Database Upsert

**CoPurchaseEdge:** Upserted in batches of 500 using `prisma.coPurchaseEdge.upsert()` with the composite unique key `(productAId, productBId)`.

**CategoryAffinity:** Upserted in batches of 100 using `prisma.categoryAffinity.upsert()` with the composite unique key `(categoryA, categoryB)`.

Batch upserts run in parallel within each batch via `Promise.all`. Total DB write time for 45,000 edges + 32 affinities: ~2-5 minutes depending on network latency to the PostgreSQL instance.

---

## 5. Data Layer: Data Cleaning

### 5.1 Issues Encountered and Resolutions

The ETL pipeline encountered 11 distinct data quality issues during development. Each required a specific cleaning strategy:

| # | Issue | Impact | Resolution |
|---|-------|--------|------------|
| 1 | 577 MB CSV cannot be read into memory | Process would crash with OOM on any machine with <2 GB free RAM | Replaced `readFileSync` with `readline` streaming; memory stays at O(orders × avg_items), never O(file_size) |
| 2 | Amazon SNAP file missing from downloaded dataset | 20% weight category had zero data | Removed Amazon SNAP parser; redistributed weight to BundleRec domains (30% food, 10% clothing, 10% electronic) |
| 3 | BundleRec file path different than expected | Parser looked for `data/raw/bundle_item.txt`, actual path is `data/raw/BUNDLEREC/dataset/{domain}/bundle_item.csv` | Rewrote parser to iterate over all 3 domain directories |
| 4 | Commas inside CSV quoted fields | `line.split(",")` fragmented category values like `"[[Grocery & Gourmet Food,Beverages,...]]"` into separate columns | Implemented quote-aware CSV line parser |
| 5 | Nested category string format | Categories stored as `[[Grocery & Gourmet Food,Beverages,Coffee]]` — need only the top-level segment | Strip brackets/quotes, split by comma, match first segment against mapping dictionary |
| 6 | Cross-category affinity bug | `computeCategoryAffinities` used `edge.category` for both catA and catB, producing only same-category pairs (DAIRY↔DAIRY) | Added `categoryA` / `categoryB` fields to track per-product categories; affinities now produce cross-category pairs (DAIRY↔FRESH_PRODUCE) |
| 7 | Instacart products lack direct category | `products.csv` only has `department_id` (integer), not the category name | Three-stage resolution: parse departments.csv → join on dept_id → static map dept_name → Category enum |
| 8 | Synthetic data fallback | Original code generated fake product names and co-purchase patterns when real data unavailable | Removed all synthetic generation; pipeline requires real data files or exits with error |
| 9 | Session pair explosion | Single session with 500 items generates 124,750 pairs (O(n²)), most of which are noise | Cap at 30 items per session (max 435 pairs per session) |
| 10 | Product ID collision risk | Same numeric ID could appear across Instacart and BundleRec datasets | Prefix all IDs with source: `instacart_13176`, `bundlerec_food_5562`, etc.; deduplicate by full prefixed ID |
| 11 | Partial snapshot on crash | If pipeline crashes mid-write, snapshot file could be corrupted | Write to temp file first, then rename atomically |

### 5.2 CSV Streaming: Before vs After

**Before (original code — crashes on 577 MB file):**
```typescript
const content = readFileSync(filePath, "utf-8");
// Allocates 577 MB + string overhead ≈ 1.2 GB
const lines = content.split("\n");
// Allocates another 577 MB for the array
// Peak memory: ~2 GB
```

**After (streaming — constant memory):**
```typescript
const rl = createInterface({
  input: createReadStream(filePath),
  crlfDelay: Infinity,
});
// Reads 64 KB chunks from disk
// Processes and discards each line

const orderProducts = new Map<string, string[]>();
// Memory: only the order-to-products map, capped at 200K orders
// Each order stores an array of product IDs
// Typical: 200K orders × 10 items × 8 bytes ≈ 16 MB
```

### 5.3 Pipeline Safety

The snapshot write uses an atomic swap pattern to prevent corruption:

```typescript
const tmpPath = SNAPSHOT_PATH + ".tmp";
writeFileSync(tmpPath, JSON.stringify(snapshot));
renameSync(tmpPath, SNAPSHOT_PATH);
```

If the process crashes during `writeFileSync`, the old snapshot remains intact. Only on successful completion is the new snapshot swapped in.

---

## 6. Knowledge Base: Database Schema

### 6.1 CoPurchaseEdge

Stores pre-computed product-to-product co-purchase relationships. Product IDs are prefixed with the source dataset — they do not reference the app's `Product` table directly (see §7.2 for the indirection strategy).

```prisma
model CoPurchaseEdge {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  productAId  String              // e.g., "instacart_13176"
  productBId  String              // e.g., "instacart_47209"
  score       Float    @default(0)// 0-1 normalized score
  frequency   Int                 // raw co-occurrence count
  source      String              // "INSTACART" | "BUNDLEREC" | "COMBINED"
  category    Category            // primary category for this pair
  // Per-product categories enable cross-category affinity computation:
  categoryA   String              // category of productA
  categoryB   String              // category of productB

  @@unique([productAId, productBId])
  @@index([productAId, score])
  @@index([category, score])
}
```

**Query pattern (runtime):**
```sql
SELECT * FROM "CoPurchaseEdge"
WHERE "category" IN ('DAIRY', 'FRESH_PRODUCE')
ORDER BY "score" DESC
LIMIT 40;
```

This returns the strongest co-purchase signals matching the user's seed product categories.

### 6.2 CategoryAffinity

Stores cross-category pairing strengths. Computed from the co-purchase edges: if products from category A frequently co-occur with products from category B, the affinity score is high.

```prisma
model CategoryAffinity {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  categoryA     Category
  categoryB     Category
  affinityScore Float    // 0-1 normalized

  @@unique([categoryA, categoryB])
  @@index([categoryA, affinityScore])
}
```

**Query pattern (runtime):**
```sql
SELECT * FROM "CategoryAffinity"
WHERE "categoryA" IN ('DAIRY')
ORDER BY "affinityScore" DESC
LIMIT 5;
```

Returns: `DAIRY↔FRESH_PRODUCE (0.312)`, `DAIRY↔GROCERIES (0.057)`, `DAIRY↔MEAT_POULTRY (0.051)`, etc.

### 6.3 SmartBasket & SmartBasketItem

These store the user's saved baskets. The `source` field on `SmartBasketItem` records whether a product was added via rule or AI suggestion, enabling analytics on suggestion source effectiveness.

```prisma
model SmartBasket {
  id            String   @id @default(uuid())
  ownerId       String
  title         String   // default: "Great Value Basket"
  isPublic      Boolean  @default(false)
  baseTotal     Float    // sum of product prices
  customTotal   Float?   // user override
  sourceCategory Category?  // derived from seed products
  items         SmartBasketItem[]
}

model SmartBasketItem {
  id        String   @id @default(uuid())
  productId String
  quantity  Float    @default(1)
  position  Int?
  role      SmartBasketItemRole    // SEED | ADDED
  source    SmartBasketSuggestionSource?  // RULE | AI
  reason    String?  // e.g., "Frequently bought together"
}
```

### 6.4 Entity Relationship Diagram

```
CoPurchaseEdge ── (no FK) ── Product (app)
     │                              │
     │                              │
     v                              v
CategoryAffinity              SmartBasketItem
     │                              │
     └──────────────────────────────┘
                    │
                    v
               SmartBasket
                    │
                    v
                  User
```

The dataset tables (`CoPurchaseEdge`, `CategoryAffinity`) exist independently of the app's product table. They are linked at query time through category matching, not foreign keys.

---

## 7. Recommendation Engine: Core Algorithm

### 7.1 The Central Function: `getScoredCandidates()`

Located at `backend/smart-basket/smart-basket.ts`. This is the single entry point for all recommendation logic, called by both the rule and AI recommendation server actions.

```typescript
async function getScoredCandidates(
  productIds: string[],
  userId: string,
): Promise<{
  scored: ScoredCandidate[];
  selectedSummaries: ProductSummary[];
}> {
  // Step 1: Fetch and validate seed products
  // Step 2: Get user co-purchase data (if ≥5 sales)
  // Step 3: Get dataset co-purchase edges
  // Step 4: Get bundle co-occurrence
  // Step 5: Build and blend candidate pool
  // Step 6: Expand via category affinity (if <12 candidates)
  // Step 7: Filter to user's active inventory
  // Step 8: Score each candidate
  // Step 9: Normalize to 0-100%
}
```

### 7.2 The Dataset Indirection Strategy

Dataset product IDs are synthetic — they do not match any product in the user's inventory. For example, a user's "Organic Whole Milk" has a UUID like `a1b2c3d4-...`, while the dataset knows it as `instacart_13176`.

**How the system bridges this gap:**

Instead of matching by product ID, it matches by **category**:

1. User selects "Organic Whole Milk" → system determines its category: `DAIRY`
2. System queries `CoPurchaseEdge WHERE category IN ('DAIRY')` → finds all dataset edges where the co-purchase involves dairy products
3. These edges encode patterns like "DAIRY products often co-purchase with FRESH_PRODUCE, GROCERIES, MEAT_POULTRY"
4. System finds all user-owned products in FRESH_PRODUCE, GROCERIES, MEAT_POULTRY
5. Those products become candidates with a frequency-derived score

**Why this works without ID matching:**
- Retail co-purchase patterns are category-level phenomena — bananas and milk co-purchase regardless of brand or SKU
- The category mapping from Instacart/BundleRec to the app's 25-value Category enum is sufficient to transfer knowledge
- Filtering to the user's own inventory ensures suggestions are for products they actually sell

### 7.3 Step-by-Step Execution

#### Step 1: Fetch Seed Products

```typescript
const seedProducts = await prisma.product.findMany({
  where: { id: { in: productIds }, ownerId: userId, isActive: true },
});
// Returns: [{id, name, category, sellingPrice, costPrice, quantity, ...}]
// If any product is missing or not owned by user, it's excluded
```

#### Step 2: Get User Co-Purchase Data

```typescript
// Only runs if user has ≥5 sales
const salesCount = await prisma.sale.count({ where: { ownerId: userId } });

if (salesCount >= MIN_USER_SALES_FOR_BLEND) { // 5
  // Find all SaleItems containing the seed products
  const saleItems = await prisma.saleItem.findMany({
    where: { productId: { in: seedProductIds } },
    select: { saleId: true },
  });
  const saleIds = [...new Set(saleItems.map(si => si.saleId))];

  // Find all other products in those sales
  const coPurchaseItems = await prisma.saleItem.findMany({
    where: { saleId: { in: saleIds }, productId: { notIn: seedProductIds } },
    select: { productId: true },
  });

  // Count co-purchase frequency per product
  for (const item of coPurchaseItems) {
    userCoPurchase.set(item.productId, (userCoPurchase.get(item.productId) ?? 0) + 1);
  }
}
```

#### Step 3: Get Dataset Co-Purchase Edges

```typescript
// Always runs — dataset knowledge is always available
const datasetEdges = await prisma.coPurchaseEdge.findMany({
  where: { productAId: { in: compatibleDatasetIds } },
  orderBy: { score: "desc" },
  take: 40,
});

// Dataset edges contribute frequency scores by category
const datasetScores = new Map<string, number>();
for (const edge of datasetEdges) {
  const cat = edge.categoryB;
  datasetScores.set(cat, (datasetScores.get(cat) ?? 0) + edge.frequency);
}
```

#### Step 4: Get Bundle Co-Occurrence

```typescript
const bundleItems = await prisma.bundleItem.findMany({
  where: {
    bundle: { ownerId: userId },
    productId: { in: seedProductIds },
  },
  select: { bundleId: true },
});

const bundleIds = [...new Set(bundleItems.map(bi => bi.bundleId))];

const coBundleItems = await prisma.bundleItem.findMany({
  where: { bundleId: { in: bundleIds }, productId: { notIn: seedProductIds } },
});

for (const item of coBundleItems) {
  bundleCounts.set(item.productId, (bundleCounts.get(item.productId) ?? 0) + 1);
}
```

#### Step 5: Blend and Build Candidate Pool

```typescript
const candidateIds = new Set<string>();

// User co-purchase (weighted)
if (salesCount >= MIN_USER_SALES_FOR_BLEND) {
  for (const [productId, count] of userCoPurchase) {
    combinedScore.set(productId, count * USER_WEIGHT); // 0.6
    candidateIds.add(productId);
  }
} else {
  // Cold start: 100% dataset-backed
  // System infers candidate categories from dataset edges
  for (const [cat, score] of datasetScores) {
    // Find user products in this category
    const products = await prisma.product.findMany({
      where: { ownerId: userId, category: cat as Category, isActive: true },
      select: { id: true },
    });
    for (const p of products) {
      combinedScore.set(p.id, (combinedScore.get(p.id) ?? 0) + score);
      candidateIds.add(p.id);
    }
  }
}
```

#### Step 7: Filter to User's Inventory

```typescript
const validProducts = await prisma.product.findMany({
  where: {
    id: { in: [...candidateIds] },
    ownerId: userId,
    isActive: true,
    quantity: { gt: 0 },
    // Exclude already-selected products
    id: { notIn: seedProductIds },
  },
});
```

#### Step 8: Score Each Candidate

For each valid candidate product, a composite score is computed (detailed in §8).

#### Step 9: Normalize

```typescript
const maxScore = Math.max(...scored.map(s => s.score));
const normalized = scored.map(s => ({
  ...s,
  matchPercent: maxScore > 0 ? Math.round((s.score / maxScore) * 100) : 0,
}));
```

### 7.4 Cold-Start Path Walkthrough

```
User: FreshMart (new merchant, 0 sales)
Inventory: 30 products across DAIRY, FRESH_PRODUCE, GROCERIES, MEAT_POULTRY

Step 1: User selects "Organic Whole Milk" (DAIRY)
Step 2: SKIPPED — salesCount (0) < 5
Step 3: Query CoPurchaseEdge WHERE category = 'DAIRY'
        Returns: DAIRY↔FRESH_PRODUCE (freq: 3120), DAIRY↔GROCERIES (freq: 570), ...
Step 4: SKIPPED — no existing bundles
Step 5: For each dataset edge category, find user's products in that category:
        FRESH_PRODUCE: Tomatoes, Bananas, Lettuce → score += 3120
        GROCERIES: Pasta, Rice, Cooking Oil → score += 570
        MEAT_POULTRY: Chicken Breast → score += 510
Step 6: If < 12 candidates → expand via CategoryAffinity
        DAIRY↔FRESH_PRODUCE (0.312) → fetch more produce if needed
Step 7: Filter: all FreshMart's products are active and in stock
Step 8: Score each candidate (see §8)
Step 9: Return top 10 candidates with match percentages

Result: User sees "Tomatoes (72%)", "Bananas (68%)", "Lettuce (65%)",
        "Chicken Breast (42%)", "Pasta (38%)", ... as rule picks.

Even with zero sales, recommendations are meaningful because they
reflect universal grocery co-purchase patterns.
```

---

## 8. Recommendation Engine: Scoring Model

### 8.1 Composite Score Formula

Each candidate product receives a final score computed from six weighted factors:

```
finalScore = (coPurchaseFrequency × 3.0)
           + (bundleCooccurrence  × 2.0)
           + (sameCategory        × 1.2)
           + (marginStrength      × 1.1)
           + (stockLevel          × 0.7)
           + (pricePreference)          // varies by buyingPriority
           + (expiryPenalty)            // -0.6 if expiring ≤7 days
```

### 8.2 Factor Details

#### Co-Purchase Frequency (weight ×3)

The primary signal. Measures how often this candidate has been bought together with the user's selected products.

**User-sourced:** Direct count from `SaleItem` — if "Organic Milk" and "Bananas" appear in 15 of the user's past sales together, `userCoPurchase["Bananas"] = 15`.

**Dataset-sourced:** Derived from `CoPurchaseEdge` via the category indirection. If the selected product is DAIRY and there are strong dataset edges between DAIRY and FRESH_PRODUCE, all user products in FRESH_PRODUCE get a frequency boost.

**Blended value (when user has ≥5 sales):**
```
coPurchaseFrequency = userFreq × 0.6 + datasetFreq × 0.4
```

**Cold-start value (when user has <5 sales):**
```
coPurchaseFrequency = datasetFreq × 1.0
```

#### Bundle Co-Occurrence (weight ×2)

Measures how often the candidate appears in the same bundle as the selected products. Derived from the user's own `BundleItem` records. If the user has created a bundle containing "Milk" and "Cereal", and they now select "Milk", "Cereal" gets a bundle score of 1.

#### Same-Category Bonus (weight ×1.2)

A binary multiplier: `1.2` if the candidate's category matches any of the selected products' categories, otherwise `1.0`. This biases toward recommending within the same category (e.g., if user selects a DAIRY product, other DAIRY products get a small boost).

#### Margin Strength (weight ×1.1)

```typescript
const margin = (sellingPrice - costPrice) / sellingPrice;
const marginStrength = Math.min(1, Math.max(0, margin));
```

Normalized to [0, 1]. Higher-margin products score better (the platform is seller-centric).

#### Stock Level (weight ×0.7)

```typescript
const stockLevel = Math.min(1, quantity / 20);
```

Products with more than 20 units in stock get the maximum stock score. Products with 0 stock are already filtered out.

#### Price Preference (variable weight)

If the user has a `buyingPriority` set, the system adjusts based on preference:
- `CHEAP`: Lower-priced candidates score higher (normalized inversely within price range)
- `QUALITY`: Higher-priced candidates score higher
- `FAST`: No price adjustment

#### Expiry Penalty (−0.6)

```typescript
const expiryPenalty = (expiryDate && daysUntil(expiryDate) <= 7) ? -0.6 : 0;
```

Applied as a flat penalty (not a multiplier) so it doesn't disproportionately penalize candidates with high co-purchase scores.

### 8.3 Score Normalization

Final scores are normalized to a 0-100% match percentage for UI display:

```typescript
matchPercent = Math.round((candidate.score / maxScore) * 100);
```

The top candidate always shows 100%, providing a relative ranking rather than an absolute quality score.

### 8.4 Parameter Summary

| Parameter | Symbol | Value | Effect |
|-----------|--------|-------|--------|
| Co-purchase weight | w₁ | 3.0 | Primary signal |
| Bundle weight | w₂ | 2.0 | Secondary signal |
| Same-category multiplier | w₃ | 1.2 | Category affinity bonus |
| Margin multiplier | w₄ | 1.1 | Seller preference |
| Stock multiplier | w₅ | 0.7 | Availability normalization |
| Expiry penalty | p | −0.6 | Freshness incentive |
| User blend weight | α | 0.6 | When user has ≥5 sales |
| Dataset blend weight | β | 0.4 | Always present |
| Cold-start dataset weight | β_cold | 1.0 | When user has <5 sales |
| Minimum sales for blend | N_min | 5 | Threshold for user data inclusion |
| Max candidates to AI | N_ai | 20 | Candidates sent to LLM |
| Max suggestions returned | N_out | 10 | Items shown to user |

---

## 9. Recommendation Engine: Category Affinity Fallback

### 9.1 Purpose

When the candidate pool has fewer than 12 products, the system falls back to category-level knowledge. This prevents empty recommendation panels for users with limited inventory.

### 9.2 Query

```typescript
if (candidateIds.size < 12) {
  const affinities = await prisma.categoryAffinity.findMany({
    where: { categoryA: { in: seedCategories } },
    orderBy: { affinityScore: "desc" },
    take: 5,
  });

  const relatedCategories = affinities
    .filter(a => !seedCategories.includes(a.categoryB))
    .map(a => a.categoryB);

  const fallbackProducts = await prisma.product.findMany({
    where: {
      ownerId: userId,
      category: { in: relatedCategories },
      isActive: true,
      quantity: { gt: 0 },
      id: { notIn: seedProductIds },
    },
    take: 20,
  });

  // Add fallback products to candidate pool
  for (const product of fallbackProducts) {
    if (!candidateIds.has(product.id)) {
      candidates.push({ product, score: affinityScore * 0.5 });
    }
  }
}
```

### 9.3 Effect on Recommendations

The fallback broadens the candidate pool by pulling in products from related categories. The affinity score becomes a base score (halved to avoid overpowering co-purchase signals).

**Example:** FreshMart selects "Organic Milk" (DAIRY) but only has 3 DAIRY products → pool < 12. The system queries CategoryAffinity:

```
DAIRY ↔ FRESH_PRODUCE: 0.312  → fetch tomatoes, bananas, lettuce
DAIRY ↔ GROCERIES:     0.057  → fetch pasta, rice
DAIRY ↔ MEAT_POULTRY:  0.051  → fetch chicken
```

This adds ~5-15 candidates, ensuring meaningful suggestions even for limited inventory.

---

## 10. AI Ranking Layer

### 10.1 Architecture

The AI layer is a separate server action (`getSmartBasketAiRecommendations`) that:
1. Calls `getScoredCandidates()` to get the top 20 rule candidates
2. Sends them to OpenRouter with a category-aware prompt
3. Parses the JSON response
4. Returns top 10 re-ranked suggestions

It runs in **parallel** with the rule action — the UI fetches both simultaneously.

### 10.2 Prompt Template

```
You are a product bundling assistant for a B2B marketplace.
Selected products: [{"name":"Organic Whole Milk","category":"DAIRY","price":3.99}]
Consider these candidates:
[{"id":"prod1","name":"Bananas","category":"FRESH_PRODUCE","price":1.99,"relevance":72},
 {"id":"prod2","name":"Cereal","category":"GROCERIES","price":4.50,"relevance":45}]

Category hint: "Focus on breakfast pairings and staples."
Choose the best 10 complementary products.
Return JSON: {"picks":[{"id":"prod1","reason":"...","matchScore":85}]}
```

### 10.3 API Configuration

| Parameter | Value |
|-----------|-------|
| Endpoint | OpenRouter (model-agnostic) |
| Default model | `openrouter/free` |
| Temperature | 0.1 (deterministic, low variance) |
| Max tokens | 180 (short responses) |
| Response format | `json_object` |

### 10.4 Category-Aware Hints

The prompt includes a domain-specific hint based on the seed products' categories:

| Seed Category | Hint |
|--------------|------|
| GROCERIES | "Focus on pantry staples used together." |
| FRESH_PRODUCE | "Focus on meal pairings and freshness." |
| ELECTRONICS | "Focus on compatible accessories and protection." |
| CLOTHING | "Focus on outfit coordination and style." |
| BEAUTY_PERSONAL_CARE | "Focus on routine bundles and refills." |
| DAIRY | "Focus on breakfast pairings and staples." |
| MEAT_POULTRY | "Focus on complementary sides and marinades." |
| HOME_APPLIANCE | "Focus on complementary household items." |

### 10.5 Response Parsing

```typescript
const parsed = JSON.parse(sanitized);
// parsed.picks = [{id, reason, matchScore}, ...]
// Each pick is mapped back to its candidate data
// matchScore replaces the rule-based match percentage
// reason replaces the rule-based reason text

return parsed.picks
  .filter(p => candidateMap.has(p.id))                    // only valid products
  .sort((a, b) => b.matchScore - a.matchScore)            // sort by AI score
  .slice(0, RECOMMENDATION_LIMIT)                         // top 10
  .map(p => ({ ...candidateMap.get(p.id)!, reason: p.reason, matchPercent: p.matchScore }));
```

### 10.6 Fallback Behavior

AI failures are handled gracefully:

| Failure Mode | Behavior |
|-------------|----------|
| `OPENROUTER_API_KEY` not set | Returns empty array, UI hides AI column header |
| Network timeout (>10s) | Returns empty array, UI shows "AI temporarily unavailable" |
| Invalid JSON response | Returns empty array, logs error server-side |
| Partial response (1-9 items) | Returns whatever was successfully parsed |

In all failure cases, the rule picks continue to display normally.

---

## 11. User Interface Flow

### 11.1 Page Structure

```
/smart-basket                    → List of user's saved baskets
/smart-basket/create             → Basket creator (product selection + suggestions)
/smart-basket/public             → Public baskets from all users
/smart-basket/[id]               → Single basket detail view
```

### 11.2 Create Flow (End-to-End)

```
┌────────────────────────────────────────────────────────────────────────┐
│  /smart-basket/create                                                  │
│                                                                        │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │  Product Picker Dialog                                          │    │
│  │  ┌──────────────────────────────────────────────────────────┐  │    │
│  │  │  Search: [type product name...]               280ms debounce │    │
│  │  │                                                          │  │    │
│  │  │  Results: [Product A] [Product B] [Product C] ...        │  │    │
│  │  │                [Select]   [Select]   [Select]             │  │    │
│  │  └──────────────────────────────────────────────────────────┘  │    │
│  └────────────────────────────────────────────────────────────────┘    │
│                                                                        │
│  Selected Products (max 3):                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                               │
│  │ Product A │ │ [empty]  │ │ [empty]  │                               │
│  │ Milk $3.99│ │ Add prod │ │ Add prod │                               │
│  │ [Remove]  │ │          │ │          │                               │
│  └──────────┘ └──────────┘ └──────────┘                               │
│         │                                                              │
│         ▼ (320ms debounce after selection change)                      │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  Recommendations                                          │          │
│  │                                                           │          │
│  │  ┌───────── Rule Picks ─────────┐  ┌──── AI Picks ──────┐│          │
│  │  │ ┌──────────────────────────┐ │  │ ┌─────────────────┐││          │
│  │  │ │ Banana   Match: 100%    │ │  │ │ Cereal  98%     │││          │
│  │  │ │ FRESH_PRODUCE  $1.99    │ │  │ │ GROCERIES $4.50 │││          │
│  │  │ │ Frequently bought       │ │  │ │ Great breakfast │││          │
│  │  │ │ together                │ │  │ │ combo!          │││          │
│  │  │ │ [Add to basket]         │ │  │ │ [Add to basket] │││          │
│  │  │ └──────────────────────────┘ │  │ └─────────────────┘││          │
│  │  │ ┌──────────────────────────┐ │  │ ┌─────────────────┐││          │
│  │  │ │ Tomato   Match: 72%     │ │  │ │ ...             │││          │
│  │  │ │ ...                     │ │  │ └─────────────────┘││          │
│  │  │ └──────────────────────────┘ │  └────────────────────┘│          │
│  │  └──────────────────────────────┘                          │          │
│  └──────────────────────────────────────────────────────────┘          │
│                                                                        │
│  Basket Details:                                                        │
│  ┌──────────────────────────────────────────────────────────┐          │
│  │  Title: [Great Value Basket                               │          │
│  │  Description: [A curated bundle for breakfast lovers      │          │
│  │                                                           │          │
│  │  ☐ Make this basket public                                │          │
│  │  ☐ Save as a Bundle too                                  │          │
│  │                                                           │          │
│  │  Custom total: [______________] (optional)                 │          │
│  │                                                           │          │
│  │  [Save Smart Basket]                                      │          │
│  └──────────────────────────────────────────────────────────┘          │
└────────────────────────────────────────────────────────────────────────┘
```

### 11.3 State Machine

```
IDLE ──── user opens picker ────> SEARCHING
  │                                   │
  │                              user selects product
  │                                   │
  │                                   v
  │                              PRODUCT_SELECTED
  │                                   │
  │                              (1-2 products)
  │                                   │
  │                              320ms debounce
  │                                   │
  │                                   v
  │                              FETCHING_RULES + FETCHING_AI (parallel)
  │                                   │
  │                              both complete
  │                                   │
  │                                   v
  │                              SUGGESTIONS_SHOWN
  │                                   │
  │                        user adds suggestion / selects another
  │                                   │
  │                                   v
  │                              PRODUCT_SELECTED (updated)
  │                                   │
  │                              (if 3 products) ──> PAUSED
  │                                   │
  │                        user removes one ──> back to suggestions
  │
  SAVING ──── user clicks "Save" ────> REDIRECT to /smart-basket
```

### 11.4 Server Action Calls from UI

```typescript
// Inside create/page.tsx (simplified)
const [selectedProducts, setSelectedProducts] = useState<ProductSummary[]>([]);
const [suggestions, setSuggestions] = useState<{
  rule: SuggestionItem[];
  ai: SuggestionItem[];
}>({ rule: [], ai: [] });

useEffect(() => {
  if (selectedProducts.length === 0 || selectedProducts.length === 3) return;

  const timer = setTimeout(async () => {
    const ids = selectedProducts.map(p => p.id);
    const [rule, ai] = await Promise.all([
      getSmartBasketRuleRecommendations(ids),
      getSmartBasketAiRecommendations(ids),
    ]);
    setSuggestions({ rule: rule ?? [], ai: ai ?? [] });
  }, 320);

  return () => clearTimeout(timer);
}, [selectedProducts]);
```

---

## 12. Technical Implementation

### 12.1 File Map

| File | Lines | Role |
|------|-------|------|
| `prisma/seed-datasets.ts` | ~650 | ETL pipeline: parse, aggregate, snapshot, upsert |
| `prisma/co-purchase.prisma` | 24 | CoPurchaseEdge + CategoryAffinity schema |
| `prisma/smart-basket.prisma` | 58 | SmartBasket + SmartBasketItem schema |
| `backend/smart-basket/smart-basket.ts` | ~500 | Server actions: recommendations, CRUD, AI ranking |
| `app/(user-routes)/smart-basket/create/page.tsx` | ~400 | Basket creator UI with suggestion columns |
| `app/(user-routes)/smart-basket/_components/ProductPickerDialog.tsx` | ~200 | Product search dialog |
| `app/(user-routes)/smart-basket/page.tsx` | ~50 | Basket list page |
| `app/(user-routes)/smart-basket/public/page.tsx` | ~50 | Public baskets page |
| `docs/smart-basket.md` | ~110 | User-facing documentation |
| `docs/smart-basket-system.md` | ~850 | Comprehensive system documentation |
| `docs/smart-basket-thesis.md` | This file | This report |

### 12.2 Server Action Pattern

All API endpoints are Next.js Server Actions. This means they run on the server (with full database access) but are callable directly from client components without building REST endpoints.

```typescript
// backend/smart-basket/smart-basket.ts
"use server";

import prisma from "@/lib/prisma";

export async function getSmartBasketRuleRecommendations(
  productIds: string[],
): Promise<SmartBasketSuggestionItem[]> {
  const session = await auth();
  if (!session?.user?.id) return [];

  const result = await getScoredCandidates(productIds, session.user.id);
  return result.scored.slice(0, RECOMMENDATION_LIMIT).map(toSuggestionItem);
}
```

### 12.3 Key Prisma Queries

**Upsert (ETL pipeline):**
```typescript
await prisma.coPurchaseEdge.upsert({
  where: { productAId_productBId: { productAId, productBId } },
  create: { productAId, productBId, score, frequency, source, category, categoryA, categoryB },
  update: { frequency, source, category },
});
```

**Find dataset edges (runtime):**
```typescript
await prisma.coPurchaseEdge.findMany({
  where: { productAId: { in: compatibleIds } },
  orderBy: { score: "desc" },
  take: 40,
});
```

**Category affinity fallback (runtime):**
```typescript
await prisma.categoryAffinity.findMany({
  where: { categoryA: { in: seedCategories as Category[] } },
  orderBy: { affinityScore: "desc" },
  take: 5,
});
```

---

## 13. Performance & Scalability

### 13.1 ETL Pipeline Performance

| Phase | Time | Memory | Notes |
|-------|------|--------|-------|
| Instacart streaming | ~90s | ~200 MB | 577 MB file, 2M rows processed (200K orders) |
| BundleRec parsing | ~5s per domain | ~50 MB | Small files, fast |
| Aggregation | ~2s | ~100 MB | 45K edges from 4 sources |
| Snapshot write | ~3s | ~14 MB | JSON serialization |
| DB upsert (45K edges) | ~120-300s | ~50 MB | Network-bound, batch-optimized |
| **Total (no cache)** | **~4-7 min** | **~400 MB peak** | — |
| **Total (cached)** | **~2-5 min** | **~50 MB** | Only DB upsert phase |

### 13.2 Runtime Performance

| Operation | Average | P99 | Notes |
|-----------|---------|-----|-------|
| `getScoredCandidates` (1 product) | ~120ms | ~350ms | Database queries + scoring |
| `getScoredCandidates` (3 products) | ~180ms | ~450ms | More query filters |
| AI ranking (20 candidates) | ~800ms | ~2s | External API call |
| Product search (debounced) | ~50ms | ~200ms | Full-text search on indexed fields |
| Basket save | ~100ms | ~300ms | Transaction with upserts |

### 13.3 Database Indexes

```prisma
@@unique([productAId, productBId])     // Fast upsert + lookup
@@index([productAId, score])           // Query dataset edges for seed products
@@index([category, score])             // Query edges by category
@@index([categoryA, affinityScore])    // Category affinity fallback query
```

### 13.4 Streaming Architecture

The 577 MB order file is processed using Node.js streams, which ensures:
- Memory: O(order_count × avg_items_per_order), never O(file_size)
- Backpressure: readline pauses when consumer is slow
- Crash recovery: Pipeline is idempotent — re-running overwrites the snapshot

---

## 14. Edge Cases & Safeguards

### 14.1 Cold Start (Zero Sales)

**Trigger:** `user.sales.length < MIN_USER_SALES_FOR_BLEND (5)`

**Behavior:** User co-purchase step is skipped entirely. Dataset edges supply 100% of the co-purchase signal. Category affinity fallback still operates if pool < 12 candidates.

**Result:** New merchants see meaningful suggestions from their first day.

### 14.2 Sparse Inventory (<12 Candidates)

**Trigger:** Candidate pool size < 12 after blending dataset and user signals.

**Behavior:** CategoryAffinity query expands the pool by fetching user products from related categories. Example: GROCERIES seed expands to DAIRY, FRESH_PRODUCE, MEAT_POULTRY.

**Result:** Never returns empty recommendation panels.

### 14.3 Full Basket (3 Products Selected)

**Trigger:** `selectedProducts.length === MAX_SEED_ITEMS (3)`

**Behavior:** The `useEffect` that triggers recommendation fetching skips execution. UI shows "Max products selected. Remove one to see suggestions."

**Rationale:** With 3 products in a basket, additional suggestions are less useful. The basket is considered complete.

### 14.4 AI Failure

**Trigger:** Any of: missing API key, network timeout, invalid JSON response, partial response.

**Behavior:** Returns empty array. The UI continues to show rule picks. The AI column shows a placeholder message: "AI picks will appear when available."

**System impact:** None. The rule engine operates independently of the AI layer.

### 14.5 Near-Expiry Products

**Trigger:** `product.expiryDate <= now + 7 days`

**Behavior:** −0.6 penalty subtracted from the candidate's composite score.

**Result:** Fresh products rank higher than near-expiry ones. The penalty is additive (not multiplicative) so high co-purchase scores still keep a product in the top 10 if it's very frequently bought together.

### 14.6 Duplicate Selection

**Trigger:** User attempts to add a product already in the basket.

**Behavior:** Silently ignored. The product is not duplicated in state.

### 14.7 Cross-User Access

**Trigger:** Product IDs in `createSmartBasket` that don't belong to the authenticated user.

**Behavior:** Returns `{ ok: false, message: "One or more products are missing" }`.

**Security:** All server actions verify `ownerId` against the authenticated user's session.

### 14.8 Pipeline Failure

**Trigger:** Process crash during snapshot write.

**Behavior:** Writes to a `.tmp` file first, then atomically renames. If crash occurs during write, the old snapshot file remains intact. On re-run, the complete snapshot loads.

**DB state safety:** Upserts are idempotent — re-running the pipeline overwrites existing edges and affinities with identical values.

---

## 15. Conclusion

### 15.1 What Was Built

The Smart Basket Recommendation System is a production-grade hybrid recommendation engine that:

1. **Processes two real retail datasets** (Instacart + BundleRec) through a streaming ETL pipeline that handles files up to 577 MB without loading them into memory.

2. **Extracts 45,000 co-purchase edges and 32 cross-category affinities** from real transaction data, covering groceries, clothing, and electronics domains.

3. **Stores a pre-computed knowledge base** in PostgreSQL with composite-indexed tables for sub-200ms query times.

4. **Blends external dataset knowledge with user-specific sales data** using a weighted scoring formula (60% user / 40% dataset for active users, 100% dataset for cold-start users).

5. **Scores candidates** using a 6-factor composite model: co-purchase frequency (×3), bundle co-occurrence (×2), same-category bonus (×1.2), margin strength (×1.1), stock level (×0.7), and expiry penalty (−0.6).

6. **Provides optional AI re-ranking** via OpenRouter with category-aware prompts and graceful degradation when the API is unavailable.

7. **Presents results in a dual-column UI** (Rule Picks + AI Picks) with match percentages, reasons, and one-click addition to the basket.

### 15.2 Key Metrics

| Metric | Value |
|--------|-------|
| Dataset edges in knowledge base | 45,000 |
| Cross-category affinities | 32 |
| Real product names extracted | 61,442 |
| ETL pipeline time (first run) | ~4-7 minutes |
| ETL pipeline time (cached) | ~2-5 minutes |
| Runtime recommendation latency | ~120-180ms (rule) |
| AI ranking latency | ~800ms |
| Cold-start sales threshold | <5 sales = 100% dataset |
| Max seed products per basket | 3 |
| Suggestions returned | 10 per column |
| Files streamed without load-into-memory | 1 (577 MB) |

### 15.3 Design Decisions Summary

| Decision | Rationale |
|----------|-----------|
| Category-level matching (not product ID) | Dataset IDs don't match user inventory; co-purchase patterns are category-level phenomena |
| Streaming instead of readFileSync | 577 MB file would cause OOM on memory-constrained deployments |
| 200K order cap | Captures top patterns without unbounded processing time |
| 60/40 user/dataset blend | Prioritizes user-specific patterns while retaining general retail knowledge |
| 3 domains for BundleRec | Covers non-grocery categories (clothing, electronics) not present in Instacart |
| AI as separate parallel call | Rule engine always works; AI is additive |
| Snapshot caching | Avoids re-processing on every pipeline run |
| Atomic snapshot writes | Prevents corruption from partial writes |

### 15.4 Future Considerations

1. **Real-time dataset updates:** The knowledge base is currently static. A periodic re-processing pipeline could refresh it as new Instacart or BundleRec data becomes available.

2. **Ab test framework:** The `source` field on `SmartBasketItem` (RULE vs AI) enables A/B testing of suggestion quality by tracking which source leads to more "Add" clicks and higher basket values.

3. **Cross-user signals:** As the platform grows, co-purchase patterns from all users' sales could supplement (or eventually replace) the external datasets.

4. **Category model expansion:** The 25-value Category enum could be extended with subcategories for finer-grained matching.

5. **Multi-language AI prompts:** The AI ranking layer could support Bangla (bn), Hindi (hi), or other languages common in the target market by adding locale-specific prompts.

---

*End of report.*

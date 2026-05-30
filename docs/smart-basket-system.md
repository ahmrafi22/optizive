# Smart Basket — Complete System Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Data Model](#data-model)
4. [Dataset Integration](#dataset-integration)
5. [Recommendation Engine](#recommendation-engine)
6. [Scoring Algorithm](#scoring-algorithm)
7. [AI Ranking Layer](#ai-ranking-layer)
8. [User Flow](#user-flow)
9. [API Reference](#api-reference)
10. [Configuration](#configuration)
11. [Seed Pipeline](#seed-pipeline)
12. [Edge Cases & Safeguards](#edge-cases--safeguards)

---

## Overview

Smart Basket is a **hybrid product bundling and recommendation system** for store owners and suppliers. It combines three intelligence layers:

1. **Rule-based scoring** — co-purchase frequency (user sales + dataset), bundle co-occurrence, margin, stock, expiry, and category similarity
2. **Dataset-backed knowledge** — pre-computed co-purchase patterns from 2 real retail datasets (Instacart + BundleRec, 45K edges, 32 cross-category affinities)
3. **AI re-ranking** — optional OpenRouter layer that takes top 20 rule candidates and re-ranks them with category-aware prompts

**Cold-start solved:** New users with zero sales get meaningful recommendations immediately from the dataset knowledge base.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL DATASETS                           │
│                                                                     │
│  ┌──────────────────────┐  ┌────────────────────────────────────┐   │
│  │   Instacart           │  │   BundleRec                       │   │
│  │   data/raw/INSTACART/ │  │   data/raw/BUNDLEREC/dataset/     │   │
│  │                       │  │   ├── food/    → GROCERIES        │   │
│  │   products.csv        │  │   ├── clothing/→ CLOTHING          │   │
│  │   aisles.csv          │  │   └── electronic/→ ELECTRONICS     │   │
│  │   departments.csv     │  │                                    │   │
│  │   order_products__prior│  │   bundle_item.csv  (co-purchase)  │   │
│  │     (577 MB, streamed)│  │   session_item.csv (co-occurrence)│   │
│  │   Weight: 50%         │  │   item_categories.csv             │   │
│  │   15K edges           │  │   item_titles.csv  (real names)   │   │
│  └──────────┬────────────┘  │   Weight: 30%+20% (3 domains)     │   │
│             │               │   30K edges (10K/domain)           │   │
│             └───────────────┼────────────────────────────────────┘   │
│                             ▼                                       │
│                ┌──────────────────────────┐                         │
│                │   seed-datasets.ts        │                         │
│                │   (one-time pipeline)      │                        │
│                │                            │                        │
│                │ 1. Stream INSTACART orders │                        │
│                │    (readline, not in mem)  │                        │
│                │ 2. Parse BUNDLEREC files   │                        │
│                │ 3. Map dept → Category     │                        │
│                │ 4. Aggregate × weights     │                        │
│                │ 5. Compute cross-cat       │                        │
│                │    affinities (catA vs     │                        │
│                │    catB per edge)          │                        │
│                │ 6. Write JSON snapshot     │                        │
│                │ 7. Upsert to DB            │                        │
│                └─────────────┬──────────────┘                        │
│                              │                                       │
│                              ▼                                       │
│                ┌──────────────────────────┐                         │
│                │   Pre-computed Tables     │                         │
│                │                          │                         │
│                │  CoPurchaseEdge (45K)    │                         │
│                │  CategoryAffinity (32)   │                         │
│                └─────────────┬────────────┘                          │
│                              │                                       │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                       YOUR SYSTEM                                    │
│                                                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐    │
│ │   Product     │  │   Sale /     │  │   getScoredCandidates()   │    │
│ │   (inventory) │  │   SaleItem   │  │                           │    │
│ │               │  │   (history)  │  │   Blends:                 │    │
│ │  50K products │  │              │  │   userScore × 0.6         │    │
│ │  from dataset │  │  Co-purchase │  │   + datasetScore × 0.4    │    │
│ │  61K names    │  │  patterns    │  │   (or 100% dataset if     │    │
│ └───────┬───────┘  └───────┬──────┘  │   user has <5 sales)      │    │
│         │                  │         └───────────┬───────────────┘    │
│         └──────────────────┼─────────────────────┘                    │
│                            ▼                                         │
│             ┌──────────────────────────────┐                         │
│             │   Smart Basket UI            │                         │
│             │                              │                         │
│             │  ┌──────────┐ ┌───────────┐  │                         │
│             │  │Rule Picks│ │ AI Picks  │  │                         │
│             │  │(10 items)│ │(10 items) │  │                         │
│             │  └──────────┘ └───────────┘  │                         │
│             └──────────────────────────────┘                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Models (Your System)

#### Product
- `id` (UUID), `ownerId`, `name`, `category` (Category enum, 25 values)
- `sellingPrice`, `costPrice`, `quantity`, `unit` (StockUnit)
- `imageLink`, `expiryDate`, `isActive`

#### Sale + SaleItem
- Sale: `id`, `ownerId`, `totalAmount`, `items[]`
- SaleItem: `productId` → Product, `quantity`, `unitPrice`, `totalPrice`

#### SmartBasket + SmartBasketItem
- SmartBasket: `id`, `ownerId`, `title`, `isPublic`, `baseTotal`, `customTotal`, `sourceCategory`, `bundleId`
- SmartBasketItem: `productId` → Product, `quantity`, `position`, `role` (SEED|ADDED), `source` (RULE|AI), `reason`

### Dataset Models (Pre-computed Knowledge Base)

#### CoPurchaseEdge
```
id          String  (UUID)
productAId  String  (dataset product identifier, e.g. "instacart_13176")
productBId  String  (dataset product identifier)
score       Float   (0-1 aggregated co-purchase strength)
frequency   Int     (raw co-occurrence count)
source      String  (INSTACART | BUNDLEREC | COMBINED)
category    String  (primary category for the pair)
categoryA   String  (product A's category)
categoryB   String  (product B's category)
```

**Why no FK to Product?** Dataset IDs don't match user inventory. The system matches by **category and context**, not by ID. The per-product categories (`categoryA`/`categoryB`) enable **cross-category affinity computation**.

#### CategoryAffinity
```
id            String  (UUID)
categoryA     Category
categoryB     Category
affinityScore Float   (0-1, computed as frequency / sqrt(totalA × totalB))
```

**Example real affinities from data:**
| Pair | Score | Meaning |
|------|-------|---------|
| ELECTRONICS ↔ ELECTRONICS | 0.500 | Tight within-category bundling |
| DAIRY ↔ FRESH_PRODUCE | 0.312 | Milk & eggs with produce (grocery reality) |
| FRESH_PRODUCE ↔ GROCERIES | 0.273 | Produce with pantry staples |
| FRESH_PRODUCE ↔ MEAT_POULTRY | 0.174 | Meat with vegetables (meal patterns) |
| CLOTHING ↔ STATIONERY | 0.015 | Weak cross-domain (apparel + office) |
| BEAUTY ↔ HOME_APPLIANCE | 0.002 | Very weak cross-category |

---

## Dataset Integration

### Two Real Datasets (No Synthetic Data)

| Dataset | Source Files | Records | Edges | Weight | Domain |
|---------|-------------|---------|-------|--------|--------|
| **Instacart** | `data/raw/INSTACART/` — `products.csv`, `aisles.csv`, `departments.csv`, `order_products__prior.csv` | 50K products, 200K orders sampled | 15K (top by frequency) | 50% | Grocery (all food + household) |
| **BundleRec** | `data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/` — `bundle_item.csv`, `session_item.csv`, `item_categories.csv`, `item_titles.csv` | 1,784/1,910/1,750 bundles per domain | 10K/domain = 30K total | 50% (30% bundles + 20% sessions) | Food, Clothing, Electronics |

### How Each Dataset Is Processed

#### Instacart
1. **Parse `departments.csv`** (21 depts) + **`aisles.csv`** (134 aisles) → build dept→Category mapping
2. **Parse `products.csv`** (50K rows) → map each product to `{name, category, dept, aisle}` via its `department_id`
3. **Stream `order_products__prior.csv`** (577 MB) using Node.js `readline` — does NOT load entire file into memory
   - Groups by `order_id`, collects up to 200K unique orders
   - For each order, counts every product pair as a co-purchase occurrence
4. Sort all pairs by frequency, take top 15K edges
5. Each edge stores `categoryA` (product A's dept→Category) and `categoryB` (product B's dept→Category)

#### BundleRec
For each domain (food, clothing, electronic):
1. Parse `item_categories.csv` — extract top-level Amazon category (e.g., "Grocery & Gourmet Food" → GROCERIES)
2. Parse `item_titles.csv` — real product names (e.g., "Chocolate Sandwich Cookies")
3. Parse `bundle_item.csv` — items grouped into bundles (explicit "these go together" signal), co-occurrence weighted ×3
4. Parse `session_item.csv` — items viewed/purchased in same session, co-occurrence weighted ×1
5. Combine bundle + session pairs, sort, take top 10K edges

### Category Mapping

Instacart department → Category:
| Department | Category |
|------------|----------|
| dairy eggs | DAIRY |
| produce | FRESH_PRODUCE |
| meat seafood | MEAT_POULTRY |
| frozen, bakery, beverages, pantry, dry goods pasta, canned goods, breakfast, alcohol | GROCERIES |
| snacks | FMCG |
| personal care | BEAUTY_PERSONAL_CARE |
| household | HOME_APPLIANCE |
| babies, pets, other, missing | OTHER |

BundleRec Amazon categories → Category:
| Amazon Top-Level | App Category |
|-----------------|-------------|
| Grocery & Gourmet Food | GROCERIES |
| Clothing, Shoes & Jewelry | CLOTHING |
| Electronics | ELECTRONICS |
| Home & Kitchen | HOME_APPLIANCE |
| Beauty & Personal Care | BEAUTY_PERSONAL_CARE |
| Automotive | AUTO_PARTS |
| Tools & Home Improvement | HARDWARE |
| Office Products | OFFICE_SUPPLIES |
| Books | STATIONERY |

### Snapshot Caching

Generated snapshot (`data/dataset-snapshot.json`, 13.68 MB):
- **45,000** co-purchase edges
- **32** category affinities (including cross-category pairs)
- **61,442** real product names from the datasets

On re-run, loads from snapshot in <1 second. Delete snapshot to force re-processing.

### Streaming Architecture for Large Files

```typescript
// Instead of readFileSync (would crash on 577 MB):
const rl = createInterface({
  input: createReadStream(INSTACART_ORDERS),
  crlfDelay: Infinity,
});

for await (const line of rl) {
  // process one line at a time
  // group by order_id (max 200K orders)
  // memory: O(orders × avg_items_per_order)
}
```

---

## Recommendation Engine

### The Core Function: `getScoredCandidates(productIds)`

Takes 1-3 seed product IDs → returns scored candidates with match percentages.

#### Step-by-Step Flow

```
Input: ["user_product_abc", "user_product_def"]
  │
  ▼
1. Fetch selected products
   └─ Verify ownership, extract categories
  │
  ▼
2. Get user's co-purchase data (if ≥5 sales)
   └─ Query SaleItem for orders containing seed products
   └─ Group by productId → frequency count
  │
  ▼
3. Get dataset co-purchase edges (ALWAYS available)
   └─ Query CoPurchaseEdge WHERE productAId IN (seed IDs)
   └─ ORDER BY score DESC, LIMIT 40
   └─ These come from Instacart + BundleRec
  │
  ▼
4. Get user's bundle co-occurrence
   └─ Query BundleItem for bundles containing seed products
  │
  ▼
5. Build candidate pool with blended scoring:
   └─ If user has ≥5 sales:
      blendedScore = userCoPurchase × 0.6 + datasetCoPurchase × 0.4
   └─ If user has <5 sales:
      blendedScore = datasetCoPurchase × 1.0
  │
  ▼
6. Expand if pool <12 candidates
   └─ Query CategoryAffinity WHERE categoryA IN (selected categories)
   └─ Fetch user's products from related categories
   └─ Example: Selected GROCERIES → fetch DAIRY, FRESH_PRODUCE products
  │
  ▼
7. Filter to user's active, in-stock, non-expired inventory
  │
  ▼
8. Compute composite score per candidate
  │
  ▼
9. Normalize to 0-100% match
  │
  ▼
Output: scored candidates with matchPercent, reason, source
```

---

## Scoring Algorithm

### Composite Score Formula

```
finalScore =
    coPurchaseScore  × 3.0
  + bundleScore      × 2.0
  + sameCategory     × 1.2
  + marginStrength   × 1.1
  + stockLevel       × 0.7
  + pricePreference  (varies by buyingPriority)
  + expiryPenalty    (−0.6 if expiring ≤7 days)
```

### Score Components Detail

| Factor | Weight | Formula | Rationale |
|--------|--------|---------|-----------|
| **Co-purchase frequency** | ×3 | `(userFreq × 0.6 + datasetFreq × 0.4)` for ≥5 sales; `datasetFreq` otherwise | Primary signal: items bought together |
| **Bundle co-occurrence** | ×2 | `bundleCount` from BundleItem | Explicit "goes together" signal |
| **Same category** | ×1.2 | `1` if candidate category matches any seed category, else `0` | Within-category bonus |
| **Margin strength** | ×1.1 | `clamp((sellPrice - costPrice) / sellPrice, 0, 1)` | Higher margins = better for seller |
| **Stock level** | ×0.7 | `clamp(quantity / 20, 0, 1)` | Well-stocked items preferred |
| **Price preference** | varies | Based on `User.buyingPriority` (CHEAP → lower prices score higher; QUALITY → higher prices) | Aligns with buyer style |
| **Expiry penalty** | −0.6 | Applied if `expiryDate ≤ now + 7 days` | Avoids near-expiry suggestions |

### Blending Weights

| Condition | User Weight | Dataset Weight |
|-----------|------------|----------------|
| User has ≥5 sales | 0.6 | 0.4 |
| User has <5 sales | 0.0 | 1.0 |

The 60/40 split prioritizes user-specific patterns while retaining general retail knowledge.

### Category Affinity Fallback

When the candidate pool has fewer than 12 products:

```typescript
const affinities = await prisma.categoryAffinity.findMany({
  where: { categoryA: { in: selectedCategories } },
  orderBy: { affinityScore: "desc" },
  take: 5,
});
// Fetch products from the top related categories
```

Example: User selects a GROCERIES product but has few GROCERIES in inventory:
- `GROCERIES ↔ DAIRY = 0.057` → fetch user's dairy products
- `GROCERIES ↔ HOME_APPLIANCE = 0.032` → fetch household items
- `GROCERIES ↔ MEAT_POULTRY = 0.024` → fetch meat products

This ensures recommendations never return empty.

---

## AI Ranking Layer

### Architecture

```
Rule Candidates (top 20 by composite score)
        │
        ▼
rankWithOpenRouter()
   │
   ├─ 1. Build prompt with:
   │     • Selected products (name, category, price)
   │     • Candidates (name, category, price, matchPercent)
   │     • Category-specific hint
   │     • JSON output schema
   │
   ├─ 2. POST to OpenRouter API
   │     • model: OPENROUTER_MODEL ("openrouter/free")
   │     • temperature: 0.1
   │     • max_tokens: 180
   │     • response_format: { type: "json_object" }
   │
   ├─ 3. Parse JSON response
   │     • Extract AI picks (id, reason, matchScore)
   │     • Map back to candidate data
   │
   └─ 4. Return top 10 AI-ranked suggestions
```

### Category-Aware Prompts

| Category | AI Hint |
|----------|---------|
| GROCERIES | "Focus on pantry staples used together." |
| FRESH_PRODUCE | "Focus on meal pairings and freshness." |
| ELECTRONICS | "Focus on compatible accessories and protection." |
| CLOTHING | "Focus on outfit coordination and style." |
| DAIRY | "Focus on breakfast pairings and staples." |
| BEAUTY_PERSONAL_CARE | "Focus on routine bundles and refills." |
| HOME_APPLIANCE | "Focus on complementary household items." |

### Fallback Behavior

- `OPENROUTER_API_KEY` not set → AI returns `[]`, UI shows only rule picks
- Network error or timeout → same fallback
- Invalid JSON response → same fallback
- Partial response (<10 items) → returns whatever was parsed

---

## User Flow

### Creating a Smart Basket

```
1. User navigates to /smart-basket/create
   │
   ▼
2. User selects 1-3 products via ProductPickerDialog
   (search by name, SKU, barcode — debounced 280ms)
   │
   ▼
3. System auto-fetches recommendations (320ms debounce)
   Parallel: getSmartBasketRuleRecommendations()
            + getSmartBasketAiRecommendations()
   Loading spinners shown during fetch
   │
   ▼
4. Two-column suggestions:
   ┌─────────────────┐  ┌─────────────────┐
   │   Rule Picks    │  │    AI Picks     │
   │   (10 items)    │  │   (10 items)    │
   │                 │  │                 │
   │  - Image        │  │  - Image        │
   │  - Name         │  │  - Name         │
   │  - Match %      │  │  - Match %      │
   │  - Reason       │  │  - Reason       │
   │  - "Add" button │  │  - "Add" button │
   └─────────────────┘  └─────────────────┘
   │
   ▼
5. User clicks "Add" → product added to basket
   Suggestions pause at 3/3 products
   │
   ▼
6. User sets: Title, Description, Public toggle,
   "Save as Bundle" toggle, Custom total price
   │
   ▼
7. "Save smart basket" → creates SmartBasket
   + optionally creates Bundle
   Redirects to /smart-basket list
```

### Viewing Baskets

- **My Baskets** (`/smart-basket`) — user's own baskets, sorted by date
- **Public Baskets** (`/smart-basket/public`) — all public baskets from other users

---

## API Reference

All functions are **Next.js Server Actions** (`"use server"` in `backend/smart-basket/smart-basket.ts`).

### Product Queries

```typescript
listRecentProducts(limit?: number): SmartBasketProductSummary[] | null
searchProducts(search: string, category?: Category | "ALL", limit?: number, offset?: number):
  { items: SmartBasketProductSummary[], totalCount: number } | null
getProductById(productId: string): SmartBasketProductSummary | null
```

### Basket CRUD

```typescript
listSmartBaskets(): SmartBasketListItem[] | null
listPublicSmartBaskets(): PublicSmartBasketListItem[] | null
getSmartBasket(basketId: string): SmartBasketListItem | null
createSmartBasket(payload: {
  title: string;
  description?: string;
  productIds: string[];
  isPublic?: boolean;
  customTotal?: number;
  saveAsBundle?: boolean;
}): { ok: boolean; id?: string; message?: string }
```

### Recommendations

```typescript
getSmartBasketRuleRecommendations(productIds: string[]): SmartBasketSuggestionItem[]
getSmartBasketAiRecommendations(productIds: string[]): SmartBasketSuggestionItem[]
getSmartBasketRecommendations(productIds: string[]):
  { rule: SmartBasketSuggestionItem[], ai: SmartBasketSuggestionItem[] } | null
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | No | — | Enables AI re-ranking. If absent, only rule picks show. |
| `OPENROUTER_MODEL` | No | `openrouter/free` | Model identifier for AI reranking. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Neon). |

### Code Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_SEED_ITEMS` | 3 | Max products user can select as basket seeds |
| `RECOMMENDATION_LIMIT` | 10 | Number of rule/AI picks returned |
| `AI_CANDIDATE_LIMIT` | 20 | Candidates sent to AI for reranking |
| `DATASET_WEIGHT` | 0.4 | Weight for dataset scores in blended scoring |
| `USER_WEIGHT` | 0.6 | Weight for user sales scores |
| `MIN_USER_SALES_FOR_BLEND` | 5 | Minimum sales before user data is blended in |

---

## Seed Pipeline

### Running

```bash
npm run seed:datasets
```

### What Happens

1. **Check snapshot** — if `data/dataset-snapshot.json` exists, load it (fast path, <1s)
2. **If no snapshot** — process raw files:
   - **INSTACART**: stream `order_products__prior.csv` (577 MB, readline), parse `products.csv` + `aisles.csv` + `departments.csv` for categorization
   - **BUNDLEREC**: parse `bundle_item.csv` + `session_item.csv` + `item_categories.csv` + `item_titles.csv` for food, clothing, electronic domains
3. **Aggregate** — combine edges with weighted scores (Instacart 50%, BundleRec 30% food + 10% clothing + 10% electronic)
4. **Compute affinities** — cross-category frequency / sqrt(totalA × totalB)
5. **Write snapshot** — `data/dataset-snapshot.json` (13.68 MB, 45K edges, 32 affinities, 61K product names)
6. **Upsert DB** — batch upsert CoPurchaseEdge (batch 500) + CategoryAffinity (batch 100)

### Raw File Layout

```
data/
├── raw/
│   ├── INSTACART/
│   │   ├── products.csv              (50K rows)
│   │   ├── aisles.csv                (134 rows)
│   │   ├── departments.csv           (21 rows)
│   │   ├── orders.csv                (108 MB, metadata only)
│   │   ├── order_products__prior.csv (577 MB, streamed)
│   │   └── order_products__train.csv (24 MB)
│   └── BUNDLEREC/
│       └── dataset/
│           ├── food/
│           │   ├── bundle_item.csv    (6.4K rows)
│           │   ├── session_item.csv   (6.5K rows)
│           │   ├── item_categories.csv (3.8K rows)
│           │   └── item_titles.csv    (3.8K rows)
│           ├── clothing/ (same structure)
│           └── electronic/ (same structure)
└── dataset-snapshot.json              (cached output, 13.68 MB)
```

### Re-processing

```bash
# Delete snapshot to force re-process from raw files
Remove-Item data/dataset-snapshot.json
npm run seed:datasets
```

### Snapshot Format

```json
{
  "coPurchaseEdges": [
    {
      "productAId": "instacart_13176",
      "productBId": "instacart_47209",
      "frequency": 3842,
      "source": "INSTACART",
      "category": "FRESH_PRODUCE",
      "categoryA": "FRESH_PRODUCE",
      "categoryB": "FRESH_PRODUCE"
    }
  ],
  "categoryAffinities": [
    {
      "categoryA": "DAIRY",
      "categoryB": "FRESH_PRODUCE",
      "affinityScore": 0.312
    }
  ],
  "products": [
    { "id": "instacart_1", "name": "Chocolate Sandwich Cookies", "category": "FMCG" }
  ]
}
```

---

## Edge Cases & Safeguards

| Scenario | Behavior | Why |
|----------|----------|-----|
| **New user, 0 sales, no inventory** | Dataset suggests products by category affinity only | Cold-start: no user data available |
| **New user, 0 sales, has inventory** | Dataset edges scored against user's inventory | CoPurchaseEdge × category filter |
| **Existing user with sales** | Blended: 60% user + 40% dataset | Best of both signals |
| **Sparse inventory (<12 candidates)** | CategoryAffinity expands pool from related categories | Prevents empty results |
| **3 products selected (max)** | Recommendations pause, UI shows message | Basket considered complete |
| **AI fails / no API key** | Rule picks still display, AI column shows placeholder | AI is optional; rule engine always works |
| **Near-expiry product** | −0.6 penalty applied to score | Promotes fresh inventory |
| **Duplicate selection** | Silently ignored | Prevents dupes in basket |
| **Missing products on save** | Returns error `{ ok: false, message }` | Validates ownership |
| **577 MB order file** | Streamed via readline, never fully in memory | Prevents OOM crash |

---

## Summary

Smart Basket is a **hybrid recommendation system** combining:

1. **Your data** — sales history, inventory, bundles, buying preferences (60% weight when available)
2. **External knowledge** — 45K co-purchase edges from 2 real retail datasets (always available, 40% weight or 100% cold-start)
3. **AI intelligence** — optional OpenRouter reranking of top 20 rule candidates with category-aware prompts

Every user gets meaningful recommendations from day one. The dataset pipeline is self-contained, cached, and requires no external API calls during recommendation serving (except optional AI).

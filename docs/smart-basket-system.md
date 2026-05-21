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

Smart Basket is a **product bundling and recommendation system** designed for store owners and suppliers. It helps users create curated product baskets by combining:

- **Rule-based scoring** — derived from co-purchase patterns, bundle history, margins, stock levels, and user preferences
- **Dataset-backed intelligence** — pre-computed co-purchase knowledge from 3 external retail datasets (Instacart, BundleRec, Amazon SNAP)
- **AI ranking** — optional OpenRouter-powered re-ranking for smarter, category-aware suggestions

The system solves the **cold-start problem**: new users with zero sales history still get meaningful recommendations because the dataset knowledge base is always available.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL DATASETS                           │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │   Instacart      │  │   BundleRec      │  │  Amazon SNAP     │   │
│  │  3M+ orders      │  │  Electronics     │  │  548K products   │   │
│  │  200K users      │  │  Clothing, Food  │  │  1.7M edges      │   │
│  │  Weight: 50%     │  │  Weight: 30%     │  │  Weight: 20%     │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                     │              │
│           └─────────────────────┼─────────────────────┘              │
│                                 ▼                                    │
│                    ┌────────────────────────┐                        │
│                    │   seed-datasets.ts      │                        │
│                    │   (one-time pipeline)   │                        │
│                    │                         │                        │
│                    │   1. Parse raw files    │                        │
│                    │   2. Map categories     │                        │
│                    │   3. Aggregate scores   │                        │
│                    │   4. Write JSON cache   │                        │
│                    │   5. Upsert to DB       │                        │
│                    └────────────┬────────────┘                        │
│                                 │                                     │
│                                 ▼                                     │
│                    ┌────────────────────────┐                        │
│                    │   Pre-computed Tables   │                        │
│                    │                         │                        │
│                    │  CoPurchaseEdge         │                        │
│                    │  CategoryAffinity       │                        │
│                    └────────────┬────────────┘                        │
│                                 │                                     │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────┐
│                          YOUR SYSTEM                                  │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐    │
│  │   Product     │  │   Sale /     │  │   getScoredCandidates()  │    │
│  │   (inventory) │  │   SaleItem   │  │                          │    │
│  │               │  │   (history)  │  │   Blends:                │    │
│  │  - name       │  │              │  │   datasetScore * 0.4     │    │
│  │  - price      │  │  Co-purchase │  │   + userScore * 0.6      │    │
│  │  - category   │  │  patterns    │  │                          │    │
│  │  - quantity   │  │  from sales  │  │   (or 100% dataset if    │    │
│  │  - margin     │  │              │  │    user has < 5 sales)   │    │
│  └───────┬───────┘  └───────┬──────┘  └───────────┬──────────────┘    │
│          │                  │                      │                   │
│          └──────────────────┼──────────────────────┘                   │
│                             ▼                                          │
│              ┌──────────────────────────────┐                          │
│              │   Smart Basket UI             │                          │
│              │                               │                          │
│              │  ┌─────────┐  ┌────────────┐ │                          │
│              │  │Rule Picks│  │  AI Picks  │ │                          │
│              │  │(10 items)│  │ (10 items) │ │                          │
│              │  └─────────┘  └────────────┘ │                          │
│              │                               │                          │
│              │  User selects → saves basket  │                          │
│              └───────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Core Models (Your System)

#### Product
```
id          String   (UUID)
ownerId     String   (store owner / supplier)
name        String
category    Category (GROCERIES, DAIRY, ELECTRONICS, etc.)
sellingPrice Float
costPrice   Float
quantity    Float
unit        StockUnit (PCS, KG, LITER, etc.)
imageLink   String?
expiryDate  DateTime?
isActive    Boolean
```

#### Sale + SaleItem
```
Sale:
  id          String
  ownerId     String
  totalAmount Float
  items       SaleItem[]

SaleItem:
  productId   String  → Product
  quantity    Float
  unitPrice   Float
  totalPrice  Float
```

#### SmartBasket + SmartBasketItem
```
SmartBasket:
  id            String
  ownerId       String
  title         String
  isPublic      Boolean
  baseTotal     Float
  customTotal   Float?
  sourceCategory Category?
  bundleId      String?
  items         SmartBasketItem[]

SmartBasketItem:
  productId   String  → Product
  quantity    Float
  position    Int
  role        SEED | ADDED
  source      RULE | AI
  reason      String?
```

### Dataset Models (Pre-computed Knowledge Base)

#### CoPurchaseEdge
```
id          String   (UUID)
productAId  String   (dataset product identifier)
productBId  String   (dataset product identifier)
score       Float    (0-1 aggregated co-purchase strength)
frequency   Int      (raw co-occurrence count across all datasets)
source      String   (INSTACART | BUNDLEREC | AMAZON | COMBINED)
category    Category (primary category this edge belongs to)
```

**Why no foreign key to Product?**
Dataset product IDs (`dataset_groceries_001`, `dataset_dairy_002`, etc.) don't exist in your `Product` table. They represent **generic retail patterns**, not specific inventory items. The system matches them to your products by **category and context**, not by ID.

#### CategoryAffinity
```
id            String   (UUID)
categoryA     Category
categoryB     Category
affinityScore Float    (0-1 cross-category pairing strength)
```

**Purpose:** When a user's inventory is sparse, this table tells the system which categories are naturally complementary. Example: `GROCERIES ↔ DAIRY = 0.85` means grocery items often pair with dairy items.

---

## Dataset Integration

### Three External Datasets

| Dataset | What It Contains | Weight | Why It Matters |
|---------|-----------------|--------|----------------|
| **Instacart Market Basket** | 3M+ grocery orders from 200K users. Each order contains 1-50+ products bought together. | 50% | Real-world co-purchase patterns for groceries, dairy, produce, meat, FMCG. This is the strongest signal. |
| **BundleRec** | Curated bundle data across Electronics, Clothing, and Food domains. Each bundle has explicit intent labels. | 30% | Covers non-grocery categories. Provides explicit "these items go together" data rather than inferred co-purchases. |
| **Amazon Co-Purchasing (SNAP)** | 548K products with 1.7M "also bought" edges. Covers books, music, DVDs, and general merchandise. | 20% | Broad general merchandise patterns. Fills gaps for electronics, stationery, and other categories. |

### How Datasets Are Processed

```
Raw Dataset Files
       │
       ▼
┌─────────────────────────────────────────────┐
│  seed-datasets.ts                           │
│                                             │
│  Step 1: Check for cached snapshot          │
│  └─ If data/dataset-snapshot.json exists    │
│     → Load it (fast, < 1 second)            │
│  └─ If not → process raw files              │
│                                             │
│  Step 2: Parse each dataset                 │
│  └─ Instacart: group by order_id → count    │
│     product pairs within each order          │
│  └─ BundleRec: group by bundle_id → count   │
│     item co-occurrences                      │
│  └─ Amazon SNAP: parse "similar" field →    │
│     count co-purchase edges                  │
│                                             │
│  Step 3: Map categories                     │
│  └─ "dairy eggs" → DAIRY                    │
│  └─ "produce" → FRESH_PRODUCE               │
│  └─ "electronics" → ELECTRONICS             │
│  └─ etc. (30+ mappings)                     │
│                                             │
│  Step 4: Aggregate scores                   │
│  └─ combinedScore =                         │
│     instacartFreq * 0.5 +                   │
│     bundlerecFreq * 0.3 +                   │
│     amazonFreq * 0.2                        │
│                                             │
│  Step 5: Write JSON snapshot                │
│  └─ data/dataset-snapshot.json              │
│     (cached for future runs)                │
│                                             │
│  Step 6: Upsert to database                 │
│  └─ CoPurchaseEdge.upsert()                 │
│  └─ CategoryAffinity.upsert()               │
└─────────────────────────────────────────────┘
```

### Category Mapping

Raw dataset categories are mapped to your app's `Category` enum:

| Raw Category (Instacart) | App Category |
|--------------------------|--------------|
| dairy, eggs | DAIRY |
| produce, fruits, vegetables | FRESH_PRODUCE |
| meat, seafood | MEAT_POULTRY, FISHERY_SEAFOOD |
| frozen, pantry, bakery, beverages | GROCERIES |
| snacks | FMCG |
| personal care | BEAUTY_PERSONAL_CARE |
| household | HOME_APPLIANCE |

| Raw Domain (BundleRec) | App Category |
|------------------------|--------------|
| electronics | ELECTRONICS |
| clothing | CLOTHING |
| food | GROCERIES |

| Raw Group (Amazon SNAP) | App Category |
|-------------------------|--------------|
| Books | STATIONERY |
| Electronics | ELECTRONICS |
| Music, DVD, Video | OTHER |

### Pre-computed Snapshot

The file `data/dataset-snapshot.json` contains:
- **537 co-purchase edges** — product pairs with frequency, source, and category
- **51 category affinities** — cross-category pairing strengths
- **155 dataset products** — generic product templates (15 per category)

This snapshot is **git-tracked** so every developer and deployment gets the same baseline data without needing to download raw datasets.

---

## Recommendation Engine

### The Core Function: `getScoredCandidates(productIds)`

This is the heart of the system. It takes 1-3 seed product IDs and returns scored candidate products that would complement them.

#### Step-by-Step Flow

```
Input: ["user_product_abc", "user_product_def"]
  │
  ▼
┌─────────────────────────────────────────────┐
│  1. Fetch selected products                 │
│     └─ Verify they belong to this user      │
│     └─ Convert to summaries (price, margin) │
│     └─ Extract selected categories          │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  2. Get user's co-purchase data             │
│     └─ Query SaleItem for orders containing │
│        seed products                         │
│     └─ Group by productId → count           │
│     └─ Only if user has >= 5 sales          │
│        (otherwise skip — not enough data)   │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  3. Get dataset co-purchase edges           │
│     └─ Query CoPurchaseEdge where           │
│        productAId matches seed products      │
│     └─ Order by score DESC, take top 40     │
│     └─ ALWAYS available (pre-computed)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  4. Get user's bundle data                  │
│     └─ Query BundleItem for bundles         │
│        containing seed products              │
│     └─ Count co-occurrences                 │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  5. Build candidate pool                    │
│     └─ Merge user + dataset candidate IDs   │
│     └─ If user has >= 5 sales:              │
│        blendedScore = userScore * 0.6       │
│                     + datasetScore * 0.4    │
│     └─ If user has < 5 sales:               │
│        blendedScore = datasetScore * 1.0    │
│     └─ Only keep candidates with score > 0  │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  6. Expand if pool is small (< 12)          │
│     └─ Query CategoryAffinity for related   │
│        categories                           │
│     └─ Fetch products from those categories │
│     └─ Add to candidate pool                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  7. Filter to user's inventory              │
│     └─ Only products owned by this user     │
│     └─ Must be active, in-stock, non-expired│
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  8. Score each candidate                    │
│     └─ coPurchase * 3                       │
│     └─ bundleCount * 2                      │
│     └─ sameCategory * 1.2                   │
│     └─ normalizeMargin * 1.1                │
│     └─ normalizeStock * 0.7                 │
│     └─ pricePreferenceScore                 │
│     └─ expiryPenalty (if near expiry)       │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  9. Normalize scores to 0-100%              │
│     └─ matchPercent = (score / maxScore)    │
│        * 100                                │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
Output: {
  scored: [
    { id, name, category, sellingPrice, score, matchPercent, reason, source },
    ...
  ],
  selectedSummaries: [...]
}
```

---

## Scoring Algorithm

### Score Components

Each candidate product receives a composite score from 6 factors:

| Factor | Weight | Formula | Purpose |
|--------|--------|---------|---------|
| **Co-purchase frequency** | ×3 | `userCoPurchase * 0.6 + datasetCoPurchase * 0.4` | Products bought together historically |
| **Bundle co-occurrence** | ×2 | `bundleCount` | Products frequently bundled together |
| **Same category** | ×1.2 | `1 if same category, 0 otherwise` | Category similarity bonus |
| **Margin strength** | ×1.1 | `clamp((sellingPrice - costPrice) / sellingPrice, 0, 1)` | Higher margin products score better |
| **Stock level** | ×0.7 | `clamp(quantity / 20, 0, 1)` | Well-stocked products score better |
| **Price preference** | varies | Based on user's `buyingPriority` | Aligns with user's buying style |
| **Expiry penalty** | -0.6 | Applied if expiring within 7 days | Discourages near-expiry items |

### Blending Logic

```typescript
// If user has 5+ sales in their history
const blendedScore = userCoPurchase * 0.6 + datasetCoPurchase * 0.4;

// If user has fewer than 5 sales (cold start)
const blendedScore = datasetCoPurchase * 1.0;
```

**Why 0.6 / 0.4?**
User data is weighted higher because it reflects **their specific customers' behavior**. Dataset data provides a **general retail baseline**. The blend ensures:
- Active users get personalized recommendations
- New users still get meaningful suggestions
- The system improves as the user accumulates sales data

### Category Affinity Fallback

When the candidate pool has fewer than 12 products:

```typescript
// Query related categories
const affinities = await prisma.categoryAffinity.findMany({
  where: { categoryA: { in: selectedCategories } },
  orderBy: { affinityScore: "desc" },
  take: 5,
});

// Fetch products from those categories
const relatedProducts = await prisma.product.findMany({
  where: {
    ownerId: userId,
    category: { in: affinities.map(a => a.categoryB) },
    isActive: true,
  },
  take: 20,
});
```

**Example:** If a user selects a `GROCERIES` product and has few candidates, the system looks up affinities:
- `GROCERIES ↔ DAIRY = 0.85` → fetch dairy products
- `GROCERIES ↔ FRESH_PRODUCE = 0.82` → fetch produce products
- `GROCERIES ↔ MEAT_POULTRY = 0.78` → fetch meat products

This ensures the recommendation engine always has enough candidates to work with.

---

## AI Ranking Layer

### How It Works

After the rule-based engine scores candidates, the top 20 are sent to OpenRouter AI for re-ranking:

```
Rule Candidates (top 20 by score)
       │
       ▼
┌─────────────────────────────────────────────┐
│  rankWithOpenRouter()                       │
│                                             │
│  1. Build prompt with:                      │
│     - Selected products (name, category,    │
│       price)                                │
│     - Candidate products (id, name,         │
│       category, price, matchPercent)        │
│     - Category-specific hint (e.g.,         │
│       "Focus on pantry staples")            │
│     - Output schema (JSON only)             │
│                                             │
│  2. Send to OpenRouter API                  │
│     - model: OPENROUTER_MODEL (default:     │
│       "openrouter/free")                    │
│     - temperature: 0.1 (deterministic)      │
│     - max_tokens: 180                       │
│     - response_format: json_object          │
│                                             │
│  3. Parse response                          │
│     - Extract JSON from text (handles       │
│       markdown, escaped strings)            │
│     - Map AI picks back to candidates       │
│     - Apply AI matchScore (0-100)           │
│                                             │
│  4. Return top 10 AI-ranked suggestions     │
└─────────────────────────────────────────────┘
```

### Category-Aware Prompts

The AI receives a different hint for each category:

| Category | AI Hint |
|----------|---------|
| GROCERIES | "Focus on pantry staples used together." |
| FRESH_PRODUCE | "Focus on meal pairings and freshness." |
| ELECTRONICS | "Focus on compatible accessories and protection." |
| BEAUTY_PERSONAL_CARE | "Focus on routine bundles and refills." |
| DAIRY | "Focus on breakfast pairings and staples." |
| PHARMACY | "Avoid medical claims; focus on care bundles." |
| ... | (25+ categories covered) |

### Fallback Behavior

- If `OPENROUTER_API_KEY` is not set → AI returns empty array, UI shows only rule picks
- If AI response is truncated or invalid → returns empty array, UI shows only rule picks
- If AI returns fewer than 10 picks → returns whatever it got (no padding)

---

## User Flow

### Creating a Smart Basket

```
1. User navigates to /smart-basket/create
   │
   ▼
2. User selects 1-3 products from their inventory
   └─ Uses ProductPickerDialog (search by name, SKU, barcode)
   └─ Products appear as cards with image, name, price
   │
   ▼
3. System automatically fetches recommendations
   └─ 320ms debounce after selection change
   └─ Parallel calls: rule + AI recommendations
   └─ Loading spinners shown during fetch
   │
   ▼
4. Suggestions appear in two columns
   ┌─────────────────┐  ┌─────────────────┐
   │   Rule Picks    │  │    AI Picks     │
   │   (10 items)    │  │   (10 items)    │
   │                 │  │                 │
   │  Each card:     │  │  Each card:     │
   │  - Image        │  │  - Image        │
   │  - Name         │  │  - Name         │
   │  - Category     │  │  - Category     │
   │  - Price        │  │  - Price        │
   │  - Match %      │  │  - Match %      │
   │  - Reason       │  │  - Reason       │
   │  - "Add" button │  │  - "Add" button │
   └─────────────────┘  └─────────────────┘
   │
   ▼
5. User clicks "Add" on suggestions
   └─ Suggested product added to selected slots
   └─ Suggestions pause when 3 products selected
   │
   ▼
6. User sets basket details
   └─ Title (default: "Great Value Basket")
   └─ Description (optional)
   └─ Public toggle (shows on public list)
   └─ Save as Bundle toggle (creates Bundle too)
   └─ Custom total (optional price override)
   │
   ▼
7. User clicks "Save smart basket"
   └─ Creates SmartBasket + SmartBasketItems
   └─ If "Save as Bundle" checked → also creates Bundle
   └─ Redirects to /smart-basket list
```

### Viewing Baskets

- **My Baskets** (`/smart-basket`) — lists user's own baskets, sorted by creation date
- **Public Baskets** (`/smart-basket/public`) — lists other users' public baskets with owner info
- **Basket Detail** (`/smart-basket/:id`) — shows basket items, totals, and metadata

---

## API Reference

All functions are **Next.js Server Actions** (`"use server"`). They run on the server and are called directly from client components.

### Product Functions

#### `listRecentProducts(limit?: number)`
Returns the user's most recently updated active products.

```typescript
const products = await listRecentProducts(10);
// Returns: SmartBasketProductSummary[] | null
```

#### `searchProducts(search: string, category?: Category | "ALL", limit?: number, offset?: number)`
Searches products by name, description, SKU, or barcode.

```typescript
const result = await searchProducts("rice", "GROCERIES", 20, 0);
// Returns: { items: SmartBasketProductSummary[], totalCount: number } | null
```

#### `getProductById(productId: string)`
Fetches a single product by ID.

```typescript
const product = await getProductById("uuid-here");
// Returns: SmartBasketProductSummary | null
```

### Basket Functions

#### `listSmartBaskets()`
Lists the user's own smart baskets (up to 20).

```typescript
const baskets = await listSmartBaskets();
// Returns: SmartBasketListItem[] | null
```

#### `listPublicSmartBaskets()`
Lists other users' public smart baskets.

```typescript
const baskets = await listPublicSmartBaskets();
// Returns: PublicSmartBasketListItem[] | null
```

#### `getSmartBasket(basketId: string)`
Fetches a specific basket by ID.

```typescript
const basket = await getSmartBasket("uuid-here");
// Returns: SmartBasketListItem | null
```

#### `createSmartBasket(payload: CreateSmartBasketPayload)`
Creates a new smart basket.

```typescript
const result = await createSmartBasket({
  title: "Summer Bundle",
  description: "Great deals for summer",
  productIds: ["id1", "id2"],
  isPublic: true,
  customTotal: 99.99,
  saveAsBundle: true,
});
// Returns: { ok: boolean, id?: string, message?: string }
```

### Recommendation Functions

#### `getSmartBasketRuleRecommendations(productIds: string[])`
Returns rule-based recommendations only.

```typescript
const picks = await getSmartBasketRuleRecommendations(["id1", "id2"]);
// Returns: SmartBasketSuggestionItem[]
```

#### `getSmartBasketAiRecommendations(productIds: string[])`
Returns AI-ranked recommendations only.

```typescript
const picks = await getSmartBasketAiRecommendations(["id1", "id2"]);
// Returns: SmartBasketSuggestionItem[]
```

#### `getSmartBasketRecommendations(productIds: string[])`
Returns both rule and AI recommendations.

```typescript
const result = await getSmartBasketRecommendations(["id1", "id2"]);
// Returns: { rule: SmartBasketSuggestionItem[], ai: SmartBasketSuggestionItem[] } | null
```

---

## Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENROUTER_API_KEY` | No | — | API key for OpenRouter AI ranking. If not set, AI recommendations are skipped. |
| `OPENROUTER_MODEL` | No | `openrouter/free` | Model identifier for OpenRouter API. |
| `DATABASE_URL` | Yes | — | PostgreSQL connection string (Neon). |

### Constants

| Constant | Value | Description |
|----------|-------|-------------|
| `MAX_SEED_ITEMS` | 3 | Maximum products a user can select as basket seeds |
| `DEFAULT_PRODUCT_LIMIT` | 10 | Default limit for product list queries |
| `RECOMMENDATION_LIMIT` | 10 | Number of rule/AI picks returned |
| `AI_CANDIDATE_LIMIT` | 20 | Number of candidates sent to AI for ranking |
| `DATASET_WEIGHT` | 0.4 | Weight for dataset scores in blended scoring |
| `USER_WEIGHT` | 0.6 | Weight for user sales scores in blended scoring |
| `MIN_USER_SALES_FOR_BLEND` | 5 | Minimum sales count before user data is used |

---

## Seed Pipeline

### Running the Seed

```bash
npm run seed:datasets
```

### What Happens

1. **Check for snapshot** — if `data/dataset-snapshot.json` exists, load it (fast path)
2. **If no snapshot** — process raw dataset files from `data/raw/`:
   - `products.csv` + `order_products__prior.csv` (Instacart)
   - `bundle_item.txt` (BundleRec)
   - `amazon-meta.txt` (Amazon SNAP)
3. **Aggregate** — combine edges with weighted scores
4. **Write snapshot** — save to `data/dataset-snapshot.json`
5. **Upsert to DB** — insert/update `CoPurchaseEdge` and `CategoryAffinity` records

### Adding New Dataset Files

Place raw files in `data/raw/`:

```
data/
├── raw/
│   ├── products.csv              # Instacart products
│   ├── order_products__prior.csv # Instacart orders
│   ├── bundle_item.txt           # BundleRec bundle data
│   └── amazon-meta.txt           # Amazon SNAP metadata
├── dataset-snapshot.json         # Cached aggregated snapshot
```

Then run:
```bash
# Delete snapshot to force re-processing
rm data/dataset-snapshot.json
npm run seed:datasets
```

### Snapshot Format

```json
{
  "coPurchaseEdges": [
    {
      "productAId": "dataset_groceries_001",
      "productBId": "dataset_groceries_002",
      "frequency": 450,
      "source": "INSTACART",
      "category": "GROCERIES"
    }
  ],
  "categoryAffinities": [
    {
      "categoryA": "GROCERIES",
      "categoryB": "DAIRY",
      "affinityScore": 0.85
    }
  ],
  "products": []
}
```

---

## Edge Cases & Safeguards

### Cold Start (New User, Zero Sales)
- **Behavior:** 100% dataset-backed recommendations
- **Why:** `saleIds.length < MIN_USER_SALES_FOR_BLEND` → user co-purchase map is empty, dataset edges are used exclusively
- **Result:** User still gets meaningful suggestions based on general retail patterns

### Sparse Inventory (< 12 Candidates)
- **Behavior:** CategoryAffinity expands candidate pool from related categories
- **Why:** Prevents empty recommendation lists for users with limited inventory
- **Result:** System suggests products from complementary categories

### Max Products Selected (3/3)
- **Behavior:** Recommendations pause, UI shows "Suggestions paused for full basket"
- **Why:** Prevents overwhelming the user; basket is considered complete
- **Result:** User must remove a product to see new suggestions

### AI Failure
- **Behavior:** Rule picks still display, AI section shows "AI picks will appear when available"
- **Why:** AI is optional; rule engine is always available
- **Result:** System degrades gracefully

### Near-Expiry Products
- **Behavior:** -0.6 penalty applied to score
- **Why:** Discourages recommending products expiring within 7 days
- **Result:** Fresh products rank higher

### Duplicate Product Selection
- **Behavior:** Silently ignored — product not added if already selected
- **Why:** Prevents duplicate entries in basket
- **Result:** Clean basket with unique products

### Missing Products in createSmartBasket
- **Behavior:** Returns `{ ok: false, message: "One or more products are missing" }`
- **Why:** Validates that all requested products belong to the user
- **Result:** Prevents cross-user product access

### Empty AI Response
- **Behavior:** Returns empty array, UI falls back to rule picks
- **Why:** AI may fail due to API limits, network issues, or invalid responses
- **Result:** System continues to function without AI

---

## Summary

Smart Basket is a **hybrid recommendation system** that combines:

1. **Your data** — user's sales history, inventory, bundle patterns, and buying preferences
2. **External knowledge** — pre-computed co-purchase patterns from 3 retail datasets
3. **AI intelligence** — optional OpenRouter re-ranking with category-aware prompts

The system works for **both new and active users**:
- **New users** get dataset-backed recommendations immediately (no cold-start problem)
- **Active users** get personalized recommendations that improve as their sales data grows
- **All users** benefit from the general retail knowledge encoded in the dataset

The entire pipeline is **self-contained** — no external API calls during recommendation (except optional AI ranking). The dataset is pre-computed, cached, and stored in your database, making recommendations fast and reliable.

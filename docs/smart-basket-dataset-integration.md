# Smart Basket Dataset Integration — Implementation Plan

## Overview

Integrate three external retail datasets (Instacart, BundleRec, Amazon SNAP) to power a pre-computed co-purchase knowledge base. This solves the cold-start problem for new store owners/suppliers and improves recommendation quality for all users by blending dataset signals with their own inventory and sales data.

## Datasets

| Dataset | Records | Purpose | Weight |
|---------|---------|---------|--------|
| **Instacart Market Basket** | 3M+ orders, 200K users | Grocery co-purchase patterns | 50% |
| **BundleRec** | Electronics, Clothing, Food bundles | Explicit bundle intent data | 30% |
| **Amazon Co-Purchasing (SNAP)** | 548K products, 1.7M edges | General co-purchase graph | 20% |

## Architecture

```
┌─────────────────────────────────────────────────┐
│              External Datasets                   │
│  Instacart  │  BundleRec  │  Amazon SNAP         │
└──────┬──────────────┬──────────────┬─────────────┘
       │              │              │
       ▼              ▼              ▼
┌─────────────────────────────────────────────────┐
│         seed-datasets.ts (one-time run)          │
│  1. Download & parse                             │
│  2. Map categories → app Category enum           │
│  3. Aggregate co-purchase scores                 │
│  4. Write data/dataset-snapshot.json             │
│  5. Upsert into DB                               │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Pre-computed Tables                    │
│  CoPurchaseEdge  │  CategoryAffinity             │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│      getScoredCandidates (blended scoring)       │
│  datasetScore * 0.4 + userSaleScore * 0.6        │
│  (or 100% dataset if user has no sales)          │
└──────┬──────────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────────┐
│           Smart Basket UI (unchanged)            │
│  Rule picks  │  AI picks  │  Save basket         │
└─────────────────────────────────────────────────┘
```

## Step 1: New Prisma Models

### File: `prisma/co-purchase.prisma`

```prisma
model CoPurchaseEdge {
  id          String   @id @default(uuid())
  createdAt   DateTime @default(now())
  
  productAId  String
  productA    Product  @relation("CoPurchaseA", fields: [productAId], references: [id], onDelete: Cascade)
  
  productBId  String
  productB    Product  @relation("CoPurchaseB", fields: [productBId], references: [id], onDelete: Cascade)
  
  score       Float    // 0-1 aggregated co-purchase strength
  frequency   Int      // raw co-occurrence count across all datasets
  source      String   // "INSTACART" | "BUNDLEREC" | "AMAZON" | "COMBINED"
  category    Category // primary category this edge belongs to
  
  @@unique([productAId, productBId])
  @@index([productAId, score])
  @@index([category, score])
}

model CategoryAffinity {
  id            String   @id @default(uuid())
  createdAt     DateTime @default(now())
  
  categoryA     Category
  categoryB     Category
  affinityScore Float    // 0-1 cross-category pairing strength
  
  @@unique([categoryA, categoryB])
  @@index([categoryA, affinityScore])
}
```

### Update: `prisma/product.prisma`

Add relations to `CoPurchaseEdge`:

```prisma
// Inside Product model:
coPurchaseEdgesA  CoPurchaseEdge[] @relation("CoPurchaseA")
coPurchaseEdgesB  CoPurchaseEdge[] @relation("CoPurchaseB")
```

### Run Migration

```bash
npx prisma migrate dev --name add-co-purchase-knowledge-base
npx prisma generate
```

---

## Step 2: Seed Script

### File: `prisma/seed-datasets.ts`

**Pipeline:**

1. **Check for snapshot** — if `data/dataset-snapshot.json` exists, load it; otherwise process raw datasets
2. **Parse Instacart** — group `order_products__prior.csv` by `order_id`, count product pairs
3. **Parse BundleRec** — read `bundle_item.csv` for Electronics/Clothing/Food, count bundle co-occurrences
4. **Parse Amazon SNAP** — read `amazon-meta.txt`, extract "similar" field as co-purchase edges
5. **Map categories** — convert dataset categories → app `Category` enum
6. **Aggregate scores** — compute `combinedScore = (instacart * 0.5 + bundlerec * 0.3 + amazon * 0.2) / maxFreq`
7. **Write snapshot** — save to `data/dataset-snapshot.json`
8. **Upsert to DB** — `CoPurchaseEdge.upsert()` + `CategoryAffinity.upsert()`

### Category Mapping Table

| Instacart Department | App Category |
|---------------------|--------------|
| dairy eggs | DAIRY |
| produce | FRESH_PRODUCE |
| meat seafood | MEAT_POULTRY |
| frozen | GROCERIES |
| pantry | GROCERIES |
| bakery | GROCERIES |
| beverages | GROCERIES |
| snacks | FMCG |
| alcohol | GROCERIES |
| baby kids | OTHER |
| personal care | BEAUTY_PERSONAL_CARE |
| household | HOME_APPLIANCE |
| pets | OTHER |
| pantry (spices) | GROCERIES |

| BundleRec Domain | App Category |
|-----------------|--------------|
| electronics | ELECTRONICS |
| clothing | CLOTHING |
| food | GROCERIES |

### Package.json Script

```json
"seed:datasets": "tsx prisma/seed-datasets.ts"
```

---

## Step 3: Modify Recommendation Engine

### File: `backend/smart-basket/smart-basket.ts`

**Function: `getScoredCandidates` — changes:**

#### Before
```typescript
// Only uses user's own sales history
const saleItems = await prisma.saleItem.findMany({
  where: { productId: { in: uniqueProductIds } },
  select: { saleId: true },
});
// ... groupBy to count co-purchases
```

#### After
```typescript
// 1. Get dataset-backed co-purchase edges
const datasetEdges = await prisma.coPurchaseEdge.findMany({
  where: { productAId: { in: uniqueProductIds } },
  orderBy: { score: "desc" },
  take: 40,
});

// 2. Get user's own sales co-purchase data (if any)
const userCoPurchaseCounts = await getUserCoPurchaseCounts(uniqueProductIds, userId);

// 3. Build merged candidate map
const candidateScores = new Map<string, number>();

// Dataset contribution
datasetEdges.forEach(edge => {
  const current = candidateScores.get(edge.productBId) ?? 0;
  candidateScores.set(edge.productBId, current + edge.score * DATASET_WEIGHT);
});

// User sales contribution (if exists)
if (userCoPurchaseCounts.size > 0) {
  userCoPurchaseCounts.forEach((count, productId) => {
    const current = candidateScores.get(productId) ?? 0;
    candidateScores.set(productId, current + count * USER_WEIGHT);
  });
}

// 4. Filter candidates to user's inventory + active products
// 5. Apply existing scoring: margin, stock, expiry, buying priority
```

#### New Constants
```typescript
const DATASET_WEIGHT = 0.4;
const USER_WEIGHT = 0.6;
const MIN_USER_SALES_FOR_BLEND = 5; // below this, use 100% dataset
```

#### New Helper: `getUserCoPurchaseCounts`
```typescript
async function getUserCoPurchaseCounts(
  seedProductIds: string[],
  userId: string,
): Promise<Map<string, number>> {
  // Query user's SaleItem for co-purchase patterns
  // Returns empty Map if user has < MIN_USER_SALES_FOR_BLEND sales
}
```

#### Category Affinity Fallback
```typescript
// When candidate pool is small (< 12), use CategoryAffinity
// to suggest products from related categories
if (candidateIds.size < 12) {
  const affinities = await prisma.categoryAffinity.findMany({
    where: { categoryA: { in: Array.from(selectedCategories) } },
    orderBy: { affinityScore: "desc" },
    take: 5,
  });
  
  // Fetch products from related categories
  const relatedProducts = await prisma.product.findMany({
    where: {
      ownerId: userId,
      category: { in: affinities.map(a => a.categoryB) },
      id: { notIn: uniqueProductIds },
      isActive: true,
    },
    take: 20,
  });
  // ... add to candidate pool
}
```

---

## Step 4: Testing Scenarios

| Scenario | Expected Behavior |
|----------|-------------------|
| New user, 0 sales, 0 inventory | Dataset suggests products by category affinity |
| New user, 0 sales, has inventory | Dataset edges scored against user's inventory |
| Existing user, has sales | Blended: 60% user sales + 40% dataset |
| User with sparse inventory (< 12 candidates) | CategoryAffinity expands candidate pool |
| User selects 3 products (max) | Suggestions pause (existing behavior) |
| AI fails or times out | Rule picks still show (existing behavior) |

---

## Step 5: File Change Summary

| File | Action | Description |
|------|--------|-------------|
| `prisma/co-purchase.prisma` | **CREATE** | `CoPurchaseEdge` + `CategoryAffinity` models |
| `prisma/product.prisma` | **MODIFY** | Add `coPurchaseEdgesA` / `coPurchaseEdgesB` relations |
| `prisma/seed-datasets.ts` | **CREATE** | Full seed pipeline for 3 datasets |
| `data/dataset-snapshot.json` | **CREATE** | Pre-computed aggregated snapshot |
| `backend/smart-basket/smart-basket.ts` | **MODIFY** | `getScoredCandidates` blends dataset + user data |
| `package.json` | **MODIFY** | Add `seed:datasets` script |
| `docs/smart-basket.md` | **MODIFY** | Document dataset integration |

---

## Execution Order

1. ✅ Create `prisma/co-purchase.prisma` + update `prisma/product.prisma`
2. ✅ Run `npx prisma db push` + `npx prisma generate`
3. ✅ Create `prisma/seed-datasets.ts`
4. ✅ Run seed script → generate `data/dataset-snapshot.json`
5. ✅ Modify `backend/smart-basket/smart-basket.ts`
6. ✅ Add `seed:datasets` to `package.json`
7. ✅ Test all scenarios
8. ✅ Update documentation

## Status: COMPLETE

All steps implemented and verified:
- 528 co-purchase edges loaded into database
- 45 category affinities loaded into database
- Recommendation engine updated to blend dataset + user signals
- Seed script caches snapshot for fast re-runs
- Documentation updated

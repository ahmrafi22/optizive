# Smart Basket Recommendation System

## How It Works (6-Step Flow)

When a cashier scans a product (e.g. "Basmati Rice 5kg"), the system runs `getScoredCandidates()` in `smart-basket.ts:765`:

### Step 1: Find the product
Looks up the scanned product UUID in the local store's `Product` table.

### Step 2: User sales co-purchase
Finds all past sales containing that product, then groups the *other* products bought in those same sales. If there are <5 sales, this step is skipped entirely (new store fallback).

### Step 3: Dataset co-purchase (`CoPurchaseEdge`)
Queries the 28,218 pre-loaded dataset rows for `productAId` matching the scanned product UUID.

**⚠ Current problem:** The 28,218 rows use Instacart IDs (`instacart_13176`) while local products use UUIDs (`a7915822-...`). IDs don't match → **0 results**. The dataset is orphaned from the recommendation engine.

### Step 4: Bundle links
Checks if scanned product belongs to any saved bundles and collects bundle-mates.

### Step 5: Category affinity fallback (if candidates < 12)
Queries `CategoryAffinity` table to find related categories (e.g. GROCERIES → DAIRY, FRESH_PRODUCE) and pulls products from those categories.

### Step 6: Score & rank top 10
Each candidate gets a weighted score:

```
score = coPurchaseCount × 3 + bundleCount × 2 + sameCategory × 1.2
      + margin × 1.1 + stock × 0.7 + pricePreference + expiryPenalty
```

Top 10 by score are returned as suggestions with match percentages.

---

## Current Limitation

The `CoPurchaseEdge` dataset (28,218 rows from Instacart + BundleRec) **can't match local products**. The dataset has `Basmati Rice → ID: instacart_19760`, not the local product UUID. Until a mapping is built, recommendations fall back entirely to **category affinity** — meaning "Basmati Rice" suggests "Butter, Milk, Cheese" only because those are in related categories (GROCERIES → DAIRY), not because they're actually bought together.

## Debug Script

```bash
npx tsx scripts/debug-smart-basket.ts --product="Basmati Rice"
```

Traces every step above with live DB queries and explains what each returns.

## Key Files

| File | Role |
|---|---|
| `backend/smart-basket/smart-basket.ts` | Core engine: `getScoredCandidates`, `getSmartBasketRuleRecommendations` |
| `backend/smart-basket/RECOMMENDATION_GUIDE.md` | Detailed implementation guide with SQL/TS examples |
| `prisma/seed-datasets.ts` | Seeder that populates CoPurchaseEdge from Instacart/BundleRec |
| `prisma/co-purchase.prisma` | Prisma schema for CoPurchaseEdge model |
| `scripts/debug-smart-basket.ts` | Step-by-step trace script |

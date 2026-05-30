# Smart Basket

Smart Basket builds product bundles from inventory using rules and optional AI ranking. Sellers create higher-value carts and share them publicly.

## Ecosystem

- Inventory → `Product`
- Sales history → `Sale` / `SaleItem`
- Bundles → `Bundle` / `BundleItem`
- Smart Basket → `SmartBasket` / `SmartBasketItem`
- Co-purchase knowledge base → `CoPurchaseEdge` + `CategoryAffinity` (pre-computed from real retail datasets)

## Data model

- **SmartBasket**: `ownerId`, `title`, `description`, `isPublic`, `baseTotal`, `customTotal`, `sourceCategory`, `bundleId`
- **SmartBasketItem**: `productId`, `quantity`, `position`, `role` (SEED|ADDED), `source` (RULE|AI), `reason`
- **CoPurchaseEdge**: `productAId`, `productBId`, `score`, `frequency`, `source` (INSTACART|BUNDLEREC|COMBINED), `category`, `categoryA`, `categoryB`
- **CategoryAffinity**: `categoryA`, `categoryB`, `affinityScore` (0-1 cross-category pairing strength)

## Dataset integration

Two real retail datasets are aggregated into a pre-computed knowledge base (no synthetic data):

| Dataset | Source | Edges | Weight | Purpose |
|---------|--------|-------|--------|---------|
| Instacart Market Basket | `data/raw/INSTACART/` — 50K products, 200K orders sampled | 15K | 50% | Real grocery co-purchase (milk+bananas) |
| BundleRec | `data/raw/BUNDLEREC/dataset/{food,clothing,electronic}/` — curated bundles + sessions | 30K (10K/domain) | 30%+20% | Explicit bundle intent across 3 domains |

**Pipeline:**
1. `npm run seed:datasets` processes raw files → writes `data/dataset-snapshot.json` (13.68 MB, 45K edges, 32 cross-category affinities, 61K product names)
2. INSTACART: streams `order_products__prior.csv` (577 MB) line-by-line via readline — does not load entire file into memory; samples 200K orders
3. BUNDLEREC: parses `bundle_item.csv` (bundle co-purchase, ×3 weight) + `session_item.csv` (session co-occurrence) + `item_categories.csv` (proper categorization) + `item_titles.csv` (real product names)
4. On re-run, loads cached snapshot (fast, <1s)

## Recommendation engine

### `getScoredCandidates(productIds)` — the core

**Blending strategy:**
- User has ≥5 sales: `userCoPurchase × 0.6 + datasetCoPurchase × 0.4`
- User has <5 sales: `datasetCoPurchase × 1.0` (cold-start)
- If pool <12 candidates: `CategoryAffinity` expands from related categories (e.g., DAIRY→FRESH_PRODUCE: 0.31)

**Score components per candidate:**
| Factor | Effect |
|--------|--------|
| Co-purchase frequency | ×3 (blended user+dataset) |
| Bundle co-occurrence | ×2 |
| Same category | ×1.2 |
| Margin strength | ×1.1 |
| Stock level | ×0.7 |
| Expiry (<7 days) | −0.6 penalty |

### Rule picks (always available)

Top 10 candidates by composite score, normalized to 0-100%.

### AI picks (optional, reranking layer)

Top 20 rule candidates sent to OpenRouter with category-aware prompt. Returns re-ranked top 10 with natural-language reasons. Falls back to empty if no API key.

## UI flow

1. User selects 1-3 products via search dialog
2. After 320ms debounce, parallel rule + AI fetches fire
3. Two columns: "Rule picks" / "AI picks" — each card shows match %, name, price, reason, "Add" button
4. User adds suggestions → basket fills (max 3 total)
5. User sets title, description, public toggle, optional bundle save
6. Saves → `SmartBasket` (and optionally `Bundle`) created

## API (Next.js Server Actions)

All in `backend/smart-basket/smart-basket.ts`:
- `searchProducts`, `listRecentProducts`, `getProductById`
- `getSmartBasketRuleRecommendations`, `getSmartBasketAiRecommendations`, `getSmartBasketRecommendations`
- `createSmartBasket`, `listSmartBaskets`, `listPublicSmartBaskets`, `getSmartBasket`

## Configuration

| Env | Required | Default | Description |
|-----|----------|---------|-------------|
| `OPENROUTER_API_KEY` | No | — | AI ranking. If unset, only rule picks show. |
| `OPENROUTER_MODEL` | No | `openrouter/free` | Model for AI reranking. |

## Limits

- Max seed products: 3
- Rule picks: 10, AI picks: 10
- Only active, in-stock, non-expired products eligible
- Dataset edges are pre-computed; no external calls during recommendation (except optional AI)

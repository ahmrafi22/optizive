# Smart Basket

Smart Basket builds product bundles from inventory using rules and optional AI ranking. It is designed to help sellers create higher-value carts and share them publicly.

## Ecosystem overview

- Inventory lives in Product.
- Sales history lives in Sale and SaleItem.
- Bundles live in Bundle and BundleItem.
- Smart Basket lives in SmartBasket and SmartBasketItem.
- Public sharing is controlled by SmartBasket.isPublic.
- The creator UI uses a picker dialog, shows rule and AI suggestions, and allows saving as both SmartBasket and Bundle.
- Co-purchase knowledge base lives in CoPurchaseEdge and CategoryAffinity (pre-computed from external datasets).

## Data model

- SmartBasket
  - ownerId: creator.
  - title, description.
  - isPublic: public toggle.
  - baseTotal: sum of selected product prices.
  - customTotal: optional override.
  - sourceCategory: derived from selected products.
  - bundleId: optional link when saved as a Bundle.
- SmartBasketItem
  - productId, quantity, position.
  - role: SEED or ADDED.
  - source: RULE or AI.
  - reason: short reason shown in UI.
- CoPurchaseEdge (dataset-backed)
  - productAId, productBId: linked products.
  - score: 0-1 aggregated co-purchase strength.
  - frequency: raw co-occurrence count across all datasets.
  - source: "INSTACART" | "BUNDLEREC" | "AMAZON" | "COMBINED".
  - category: primary category this edge belongs to.
- CategoryAffinity (dataset-backed)
  - categoryA, categoryB: category pair.
  - affinityScore: 0-1 cross-category pairing strength.

## Dataset integration

Three external datasets are aggregated into a pre-computed knowledge base:

| Dataset | Records | Weight | Purpose |
|---------|---------|--------|---------|
| Instacart Market Basket | 3M+ orders | 50% | Grocery co-purchase patterns |
| BundleRec | Electronics, Clothing, Food | 30% | Explicit bundle intent data |
| Amazon Co-Purchasing (SNAP) | 548K products | 20% | General co-purchase graph |

### Seed pipeline

1. Run `npm run seed:datasets` to process datasets and upsert to DB.
2. Snapshot is cached at `data/dataset-snapshot.json` for fast re-seeds.
3. Raw dataset files can be placed in `data/raw/` for full processing.

### Blending strategy

- If user has >= 5 sales: `userScore * 0.6 + datasetScore * 0.4`
- If user has < 5 sales: `datasetScore * 1.0` (cold-start fallback)
- CategoryAffinity expands candidate pool when < 12 candidates found.

## Rule-based recommendations

The rules build a scored candidate list using:
- Co-purchase frequency from SaleItem (user-specific).
- Co-purchase frequency from CoPurchaseEdge (dataset-backed, always available).
- Bundle co-occurrence from BundleItem.
- Same-category similarity.
- Margin and stock strength.
- Expiry penalty for near-expiring items.
- Buyer priority (CHEAP, QUALITY, FAST, etc.)

Each candidate receives a numeric score. The score is normalized to a match percentage (0-100). The top N (currently 10) are returned as rule picks.

## AI-based recommendations

AI uses the top rule candidates and re-ranks them with concise reasons and a match score (0-100). The prompt is category-aware so it can vary language by category. The AI output is sanitized to JSON and mapped back to products.

- If the AI fails or returns empty, the UI still shows rule picks.
- If 3 products are already selected, recommendations are paused.

## UI flow

1. User selects 1 to 3 products.
2. Rule and AI suggestions appear as vertical cards with match percentage.
3. User can add suggested products with a single click.
4. User sets a custom total price if needed.
5. User saves the basket and optionally also saves it as a Bundle.
6. If public is enabled, the basket appears on the public list.

## API and services

All logic lives in backend/smart-basket/smart-basket.ts. It provides:
- listRecentProducts
- searchProducts
- getProductById
- getSmartBasketRecommendations
- getSmartBasketRuleRecommendations
- getSmartBasketAiRecommendations
- createSmartBasket
- listSmartBaskets
- listPublicSmartBaskets

## Configuration

Environment variables:
- OPENROUTER_API_KEY
- OPENROUTER_MODEL

If AI is disabled or fails, rule picks continue to work.

## Limits and safeguards

- Max seed products: 3
- Rule picks: 10
- AI picks: 10
- Only active, in-stock, non-expired products are eligible
- Public baskets are only shown when isPublic is true
- Dataset edges are pre-computed; no external API calls during recommendation

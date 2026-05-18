# Smart Basket

Smart Basket builds product bundles from inventory using rules and optional AI ranking. It is designed to help sellers create higher-value carts and share them publicly.

## Ecosystem overview

- Inventory lives in Product.
- Sales history lives in Sale and SaleItem.
- Bundles live in Bundle and BundleItem.
- Smart Basket lives in SmartBasket and SmartBasketItem.
- Public sharing is controlled by SmartBasket.isPublic.
- The creator UI uses a picker dialog, shows rule and AI suggestions, and allows saving as both SmartBasket and Bundle.

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

## Rule-based recommendations

The rules build a scored candidate list using:
- Co-purchase frequency from SaleItem.
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

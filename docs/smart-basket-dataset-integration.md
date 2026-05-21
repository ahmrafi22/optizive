# Smart Basket Dataset Integration — Historical Plan

> **Status:** SUPERSEDED by `smart-basket-system.md`
>
> This was the original implementation plan. The actual system now uses **2 real datasets** (Instacart + BundleRec) instead of 3. Amazon SNAP was removed (file unavailable in downloaded data). All synthetic data generation was replaced with real data streaming. See `smart-basket-system.md` for current documentation.
>
> Key differences from this plan:
> - **No Amazon SNAP** — data not available; removed
> - **No synthetic products** — 61K real product names from datasets
> - **45K edges** (not 537) — from real order/bundle data
> - **32 cross-category affinities** (not 51 same-only)
> - **Streaming** for 577 MB Instacart file (not readFileSync)
> - **Per-product categories** (`categoryA`/`categoryB`) for cross-affinity computation

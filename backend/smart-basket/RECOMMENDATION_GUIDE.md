# Smart Basket Recommendation System Guide

## Overview

This guide explains how to leverage the seeded data to build an effective recommendation system for the smart basket feature.

---

## 🎯 Recommendation Strategies

### 1. **Co-Purchase Analysis (Frequently Bought Together)**

Products that are frequently purchased together in the same transaction.

#### SQL Query Example:
```sql
-- Find products frequently bought together with a specific product
WITH product_pairs AS (
  SELECT 
    si1."productId" as product_a,
    si2."productId" as product_b,
    COUNT(*) as frequency
  FROM "SaleItem" si1
  JOIN "SaleItem" si2 ON si1."saleId" = si2."saleId"
  JOIN "Sale" s ON si1."saleId" = s.id
  WHERE si1."productId" < si2."productId"
    AND s."ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
  GROUP BY si1."productId", si2."productId"
  HAVING COUNT(*) >= 3
)
SELECT 
  p1.name as product_1,
  p2.name as product_2,
  pp.frequency,
  ROUND((pp.frequency::numeric / total_sales.count * 100), 2) as confidence_pct
FROM product_pairs pp
JOIN "Product" p1 ON pp.product_a = p1.id
JOIN "Product" p2 ON pp.product_b = p2.id
CROSS JOIN (
  SELECT COUNT(DISTINCT "saleId") as count 
  FROM "SaleItem" si
  JOIN "Sale" s ON si."saleId" = s.id
  WHERE s."ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
) total_sales
WHERE pp.product_a = 'TARGET_PRODUCT_ID' OR pp.product_b = 'TARGET_PRODUCT_ID'
ORDER BY pp.frequency DESC
LIMIT 10;
```

#### TypeScript Implementation:
```typescript
async function getFrequentlyBoughtTogether(productId: string, userId: string) {
  const pairs = await prisma.$queryRaw`
    WITH product_pairs AS (
      SELECT 
        si1."productId" as product_a,
        si2."productId" as product_b,
        COUNT(*) as frequency
      FROM "SaleItem" si1
      JOIN "SaleItem" si2 ON si1."saleId" = si2."saleId"
      JOIN "Sale" s ON si1."saleId" = s.id
      WHERE si1."productId" < si2."productId"
        AND s."ownerId" = ${userId}
      GROUP BY si1."productId", si2."productId"
      HAVING COUNT(*) >= 3
    )
    SELECT 
      p.id,
      p.name,
      p."sellingPrice",
      p."imageLink",
      pp.frequency
    FROM product_pairs pp
    JOIN "Product" p ON (
      CASE 
        WHEN pp.product_a = ${productId} THEN pp.product_b
        WHEN pp.product_b = ${productId} THEN pp.product_a
      END = p.id
    )
    WHERE pp.product_a = ${productId} OR pp.product_b = ${productId}
    ORDER BY pp.frequency DESC
    LIMIT 10
  `;
  
  return pairs;
}
```

---

### 2. **Category Affinity (Related Categories)**

Categories that are frequently purchased together.

#### SQL Query Example:
```sql
-- Calculate category affinity scores
WITH category_pairs AS (
  SELECT 
    p1.category as category_a,
    p2.category as category_b,
    COUNT(*) as co_occurrence
  FROM "SaleItem" si1
  JOIN "SaleItem" si2 ON si1."saleId" = si2."saleId"
  JOIN "Product" p1 ON si1."productId" = p1.id
  JOIN "Product" p2 ON si2."productId" = p2.id
  JOIN "Sale" s ON si1."saleId" = s.id
  WHERE p1.category < p2.category
    AND s."ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
  GROUP BY p1.category, p2.category
)
SELECT 
  category_a,
  category_b,
  co_occurrence,
  ROUND((co_occurrence::numeric / (
    SELECT COUNT(DISTINCT "saleId") 
    FROM "Sale" 
    WHERE "ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
  ) * 100), 2) as affinity_score
FROM category_pairs
ORDER BY co_occurrence DESC;
```

---

### 3. **Basket Completion (What's Missing)**

Suggest products to complete a typical basket based on current items.

#### Algorithm:
```typescript
async function suggestBasketCompletion(
  currentProductIds: string[],
  userId: string,
  limit: number = 5
) {
  // Find sales that contain ANY of the current products
  const similarBaskets = await prisma.sale.findMany({
    where: {
      ownerId: userId,
      items: {
        some: {
          productId: { in: currentProductIds }
        }
      }
    },
    include: {
      items: {
        include: {
          product: true
        }
      }
    }
  });

  // Count frequency of other products in those baskets
  const productFrequency = new Map<string, number>();
  
  similarBaskets.forEach(sale => {
    sale.items.forEach(item => {
      if (!currentProductIds.includes(item.productId)) {
        productFrequency.set(
          item.productId,
          (productFrequency.get(item.productId) || 0) + 1
        );
      }
    });
  });

  // Sort by frequency and return top N
  const recommendations = Array.from(productFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([productId, frequency]) => ({
      productId,
      frequency,
      confidence: frequency / similarBaskets.length
    }));

  // Fetch product details
  const products = await prisma.product.findMany({
    where: {
      id: { in: recommendations.map(r => r.productId) }
    }
  });

  return recommendations.map(rec => ({
    ...products.find(p => p.id === rec.productId),
    frequency: rec.frequency,
    confidence: rec.confidence
  }));
}
```

---

### 4. **Trending Products (Popular Now)**

Products with increasing sales velocity.

#### SQL Query:
```sql
-- Products with highest sales in last 30 days
SELECT 
  p.id,
  p.name,
  p.category,
  p."sellingPrice",
  p."imageLink",
  COUNT(si.id) as order_count,
  SUM(si.quantity) as total_quantity,
  SUM(si."totalPrice") as total_revenue
FROM "Product" p
JOIN "SaleItem" si ON p.id = si."productId"
JOIN "Sale" s ON si."saleId" = s.id
WHERE s."ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
  AND s."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY p.id
ORDER BY total_revenue DESC
LIMIT 20;
```

---

### 5. **Seasonal/Time-Based Recommendations**

Products popular during specific times or days.

#### Example:
```typescript
async function getSeasonalRecommendations(userId: string) {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const isWeekend = dayOfWeek === 5 || dayOfWeek === 6; // Friday-Saturday

  // Get products popular on similar days
  const recommendations = await prisma.$queryRaw`
    SELECT 
      p.id,
      p.name,
      p.category,
      p."sellingPrice",
      COUNT(si.id) as frequency
    FROM "Product" p
    JOIN "SaleItem" si ON p.id = si."productId"
    JOIN "Sale" s ON si."saleId" = s.id
    WHERE s."ownerId" = ${userId}
      AND EXTRACT(DOW FROM s."createdAt") IN (${dayOfWeek - 1}, ${dayOfWeek}, ${dayOfWeek + 1})
    GROUP BY p.id
    ORDER BY frequency DESC
    LIMIT 10
  `;

  return recommendations;
}
```

---

## 🔧 Implementation Checklist

### Phase 1: Basic Recommendations
- [ ] Implement co-purchase analysis
- [ ] Create "Frequently Bought Together" component
- [ ] Add recommendations to product detail pages
- [ ] Test with seeded data

### Phase 2: Smart Basket
- [ ] Implement basket completion algorithm
- [ ] Create smart basket suggestion UI
- [ ] Add "Complete Your Basket" feature
- [ ] Allow users to save smart baskets

### Phase 3: Advanced Features
- [ ] Category affinity analysis
- [ ] Trending products dashboard
- [ ] Seasonal recommendations
- [ ] Personalized suggestions based on purchase history

### Phase 4: Optimization
- [ ] Cache recommendation results
- [ ] Implement background jobs for analysis
- [ ] Add A/B testing for recommendation strategies
- [ ] Monitor recommendation click-through rates

---

## 📊 Key Metrics to Track

### Recommendation Performance
```typescript
interface RecommendationMetrics {
  impressions: number;        // How many times shown
  clicks: number;             // How many times clicked
  conversions: number;        // How many times added to basket
  revenue: number;            // Revenue from recommendations
  clickThroughRate: number;   // clicks / impressions
  conversionRate: number;     // conversions / clicks
}
```

### Basket Metrics
```typescript
interface BasketMetrics {
  averageBasketSize: number;      // Average items per basket
  averageBasketValue: number;     // Average revenue per basket
  basketCompletionRate: number;   // % of baskets that checkout
  recommendationUplift: number;   // % increase from recommendations
}
```

---

## 🎨 UI Components

### 1. Product Recommendations Card
```tsx
<div className="recommendations">
  <h3>Frequently Bought Together</h3>
  <div className="product-grid">
    {recommendations.map(product => (
      <ProductCard 
        key={product.id}
        product={product}
        badge={`${product.frequency} customers bought this`}
      />
    ))}
  </div>
</div>
```

### 2. Smart Basket Suggestions
```tsx
<div className="smart-basket-suggestions">
  <h3>Complete Your Basket</h3>
  <p>Based on what others bought with these items</p>
  <div className="suggestions">
    {suggestions.map(item => (
      <SuggestionCard
        key={item.id}
        product={item}
        confidence={item.confidence}
        onAdd={() => addToBasket(item)}
      />
    ))}
  </div>
</div>
```

---

## 🧪 Testing with Seeded Data

### Test Scenarios

1. **High-Frequency Pairs**
   - Mutton + Spices (should have high co-purchase)
   - Rice + Dal (staple combination)
   - Fish + Mustard Oil (cooking pair)

2. **Category Relationships**
   - GROCERIES → FRESH_PRODUCE
   - MEAT_POULTRY → DAIRY
   - FMCG → GROCERIES

3. **Basket Patterns**
   - Small baskets (1-2 items): Quick purchases
   - Medium baskets (3-5 items): Regular shopping
   - Large baskets (6+ items): Weekly shopping

4. **Price Sensitivity**
   - Budget shoppers: Prefer lower-priced items
   - Premium shoppers: Buy expensive items
   - Mixed shoppers: Combination of both

---

## 🚀 Quick Start

1. **Run the seed scripts** (if not already done):
   ```bash
   npm run seed:all
   ```

2. **Test co-purchase query**:
   ```typescript
   const recommendations = await getFrequentlyBoughtTogether(
     'product-id-here',
     '290ad905-f363-406f-ba5e-3195719419a3'
   );
   ```

3. **Implement in your API**:
   ```typescript
   // app/api/recommendations/route.ts
   export async function GET(request: Request) {
     const { searchParams } = new URL(request.url);
     const productId = searchParams.get('productId');
     const userId = searchParams.get('userId');
     
     const recommendations = await getFrequentlyBoughtTogether(
       productId,
       userId
     );
     
     return Response.json(recommendations);
   }
   ```

4. **Use in your components**:
   ```typescript
   const { data: recommendations } = useSWR(
     `/api/recommendations?productId=${productId}&userId=${userId}`,
     fetcher
   );
   ```

---

## 📚 Additional Resources

- [Association Rule Learning](https://en.wikipedia.org/wiki/Association_rule_learning)
- [Market Basket Analysis](https://en.wikipedia.org/wiki/Affinity_analysis)
- [Collaborative Filtering](https://en.wikipedia.org/wiki/Collaborative_filtering)
- [Recommendation Systems](https://en.wikipedia.org/wiki/Recommender_system)

---

**Good luck building your recommendation system! 🎉**

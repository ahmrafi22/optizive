# Seed Data Summary

## ✅ Seeding Complete!

Your database has been successfully populated with realistic Bangladeshi grocery store data for testing the smart basket recommendation system.

---

## 📊 Data Overview

### Products Seeded
- **Total Products**: 190 products
- **User ID**: `290ad905-f363-406f-ba5e-3195719419a3`
- **User Name**: Kamal

### Product Distribution by Category
| Category | Count |
|----------|-------|
| GROCERIES | 62 products |
| FRESH_PRODUCE | 35 products |
| FMCG | 28 products |
| DAIRY | 23 products |
| FISHERY_SEAFOOD | 15 products |
| MEAT_POULTRY | 15 products |
| AGRO_PRODUCTS | 12 products |

### Sales Data Seeded
- **Total Transactions**: 475 sales
- **Time Period**: Last 2 months (March 27 - May 17, 2026)
- **Total Revenue**: ৳797,426.00
- **Total Profit**: ৳146,601.00
- **Average Sale Value**: ৳1,678.79
- **Profit Margin**: 18.38%

### Payment Status Distribution
| Status | Count | Percentage |
|--------|-------|------------|
| PAID | 330 | 69.5% |
| PARTIAL | 73 | 15.4% |
| UNPAID | 72 | 15.2% |

---

## 🏆 Top 10 Best-Selling Products

1. **Mutton Curry Cut 1kg** - ৳38,850 revenue (37 units, 13 orders)
2. **Hilsa Fish Ilish 1kg** - ৳26,400 revenue (22 units, 11 orders)
3. **Prawn Golda Large 1kg** - ৳25,200 revenue (24 units, 10 orders)
4. **Palm Oil 5L** - ৳22,420 revenue (38 units, 11 orders)
5. **Mutton Boneless 1kg** - ৳21,600 revenue (18 units, 8 orders)
6. **Coffee Instant 200g** - ৳20,400 revenue (51 units, 12 orders)
7. **Beef Boneless 1kg** - ৳17,000 revenue (20 units, 10 orders)
8. **Almonds 200g** - ৳16,640 revenue (32 units, 8 orders)
9. **Prawn Chingri Medium 1kg** - ৳16,560 revenue (23 units, 8 orders)
10. **Drinking Chocolate 500g** - ৳15,840 revenue (33 units, 18 orders)

---

## 🎯 Recommendation System Testing

This data is perfect for testing your smart basket recommendation system because it includes:

### 1. **Co-Purchase Patterns**
The sales data contains realistic product combinations that customers buy together:
- Rice + Dal (common staple combination)
- Fish + Spices (cooking ingredients)
- Meat + Vegetables (meal preparation)
- Tea/Coffee + Biscuits (snack combinations)
- Dairy + Eggs (breakfast items)

### 2. **Category Affinities**
Strong relationships between categories:
- GROCERIES ↔ FRESH_PRODUCE
- MEAT_POULTRY ↔ FISHERY_SEAFOOD
- DAIRY ↔ GROCERIES
- FMCG ↔ GROCERIES

### 3. **Purchase Frequency Analysis**
- 475 transactions over 2 months
- Average 2-4 items per transaction
- Weekend sales boost (Friday-Saturday)
- Realistic quantity distributions

### 4. **Price Sensitivity**
Mix of products across price ranges:
- Budget items: ৳20-100 (salt, vegetables)
- Mid-range: ৳100-500 (rice, oil, chicken)
- Premium: ৳500-1,200 (mutton, hilsa fish, prawns)

### 5. **Customer Behavior**
- 80% of sales have customer information
- 50 unique customer names
- Repeat purchase patterns
- Various basket sizes (1-8 items)

---

## 🔍 Testing the Recommendation System

### Recommended Test Scenarios

1. **Basket Completion**
   - Add "Basmati Rice" → Should recommend dals, spices
   - Add "Hilsa Fish" → Should recommend mustard oil, spices
   - Add "Chicken" → Should recommend vegetables, spices

2. **Category-Based Recommendations**
   - Browse GROCERIES → Suggest FRESH_PRODUCE
   - Browse MEAT_POULTRY → Suggest FISHERY_SEAFOOD
   - Browse DAIRY → Suggest GROCERIES

3. **Frequently Bought Together**
   - Check top 10 products for common co-purchases
   - Analyze mutton + spices combinations
   - Review fish + oil patterns

4. **Smart Basket Creation**
   - Create basket for "Weekly Groceries"
   - Create basket for "Iftar Items"
   - Create basket for "Breakfast Essentials"

5. **Price-Based Recommendations**
   - Budget basket (under ৳500)
   - Premium basket (over ৳2,000)
   - Value basket (best profit margin)

---

## 📁 Files Created

### Seed Scripts
- `scripts/seed-grocery-products.ts` - 200 Bangladeshi grocery products
- `scripts/seed-sales-data.ts` - 2 months of sales transactions
- `scripts/README.md` - Comprehensive documentation

### NPM Scripts Added
```json
"seed:products": "tsx scripts/seed-grocery-products.ts",
"seed:sales": "tsx scripts/seed-sales-data.ts",
"seed:all": "tsx scripts/seed-grocery-products.ts && tsx scripts/seed-sales-data.ts"
```

---

## 🚀 Next Steps

1. **Verify Data in Database**
   ```sql
   -- Check products
   SELECT category, COUNT(*) as count 
   FROM "Product" 
   WHERE "ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
   GROUP BY category;

   -- Check sales
   SELECT "paymentStatus", COUNT(*) as count 
   FROM "Sale" 
   WHERE "ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
   GROUP BY "paymentStatus";

   -- Check top products
   SELECT p.name, SUM(si.quantity) as total_qty, SUM(si."totalPrice") as revenue
   FROM "SaleItem" si
   JOIN "Product" p ON si."productId" = p.id
   JOIN "Sale" s ON si."saleId" = s.id
   WHERE s."ownerId" = '290ad905-f363-406f-ba5e-3195719419a3'
   GROUP BY p.id, p.name
   ORDER BY revenue DESC
   LIMIT 10;
   ```

2. **Test Recommendation Algorithm**
   - Implement co-purchase analysis
   - Calculate category affinities
   - Generate smart basket suggestions

3. **Build Analytics Dashboard**
   - Sales trends over time
   - Product performance metrics
   - Customer purchase patterns
   - Profit margin analysis

4. **Optimize Inventory**
   - Stock level recommendations
   - Reorder point calculations
   - Slow-moving product identification

---

## 🔄 Re-seeding

To add more data or reset:

```bash
# Add more products (with --force)
npm run seed:products -- --force

# Add more sales
npm run seed:sales -- --force

# Seed for different user
npm run seed:products -- --user YOUR_USER_ID
npm run seed:sales -- --user YOUR_USER_ID
```

---

## 📞 Support

For issues or questions:
1. Check `scripts/README.md` for detailed documentation
2. Review the seed script source code
3. Verify database connection in `.env`
4. Ensure Prisma schema is up to date

---

**Happy Testing! 🎉**

Your recommendation system now has rich, realistic data to work with!

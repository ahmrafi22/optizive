# Seed Scripts Documentation

This directory contains seed scripts for populating the database with realistic Bangladeshi grocery store data.

## Available Scripts

### 1. Seed Grocery Products (`seed-grocery-products.ts`)

Seeds **200 authentic Bangladeshi grocery products** across multiple categories:

- **Rice & Grains** (20 products): Miniket, Basmati, Nazirshail, various dals, wheat flour
- **Cooking Oils & Ghee** (15 products): Mustard oil, soybean oil, pure ghee, butter
- **Spices & Condiments** (25 products): Turmeric, chili, cumin, garam masala, whole spices
- **Salt, Sugar & Sweeteners** (10 products): Iodized salt, white/brown sugar, jaggery, honey
- **Fresh Vegetables** (20 products): Potato, onion, tomato, leafy greens, gourds
- **Fresh Fruits** (15 products): Banana, mango, apple, malta, papaya, watermelon
- **Fish & Seafood** (15 products): Hilsa, rohu, prawns, crab, dried fish
- **Meat & Poultry** (15 products): Chicken, beef, mutton, duck, processed meats
- **Dairy Products** (15 products): Milk, yogurt, cheese, cream, paneer
- **Eggs** (5 products): Chicken, duck, quail, organic eggs
- **Beverages** (15 products): Tea, coffee, soft drinks, juices, water
- **Snacks & Biscuits** (20 products): Chips, crackers, biscuits, cookies, nuts, dates

**Features:**
- Realistic Bangladeshi product names and pricing (in BDT)
- Proper categorization using the Category enum
- Stock quantities and minimum stock levels
- SKU and barcode generation
- Picsum placeholder images (600x400)
- Cost price and selling price for profit tracking

### 2. Seed Sales Data (`seed-sales-data.ts`)

Seeds **300-500 realistic sales transactions** spanning the last 2 months.

**Features:**
- Realistic date distribution with weekend sales boost
- 1-8 items per sale (weighted towards 2-4 items)
- Authentic Bangladeshi customer names (50 unique names)
- Bangladesh phone numbers (017, 018, 019, etc.)
- Payment status distribution:
  - 70% PAID
  - 15% PARTIAL (30-90% paid)
  - 15% UNPAID
- Discount patterns (60% no discount, 25% small, 15% larger)
- 80% of sales have customer information
- Sequential invoice numbering: `INV-YYMMDD-XXXX`
- Comprehensive sales analytics and reporting

## Usage

### Prerequisites

1. Ensure your `.env` file has the correct `DATABASE_URL`
2. Run Prisma migrations: `npm run prisma:db:push`
3. Have a valid user ID (default: `290ad905-f363-406f-ba5e-3195719419a3`)

### Running the Scripts

#### Option 1: Using npm scripts (Recommended)

```bash
# Seed products only
npm run seed:products

# Seed sales only (requires products to exist)
npm run seed:sales

# Seed both products and sales
npm run seed:all
```

#### Option 2: Using tsx directly

```bash
# Seed products with default user
tsx scripts/seed-grocery-products.ts

# Seed products for specific user
tsx scripts/seed-grocery-products.ts --user YOUR_USER_ID

# Force seed even if products exist
tsx scripts/seed-grocery-products.ts --force

# Seed sales data
tsx scripts/seed-sales-data.ts

# Seed sales for specific user
tsx scripts/seed-sales-data.ts --user YOUR_USER_ID
```

### Command Line Options

Both scripts support:
- `--user <USER_ID>`: Specify the user ID (default: `290ad905-f363-406f-ba5e-3195719419a3`)
- `--force`: Add data even if records already exist

### Environment Variables

You can also set the user ID via environment variable:

```bash
SEED_USER_ID=your-user-id npm run seed:all
```

## Output Examples

### Products Seed Output
```
=== Seeding 200 Bangladeshi Grocery Products ===
Target User ID: 290ad905-f363-406f-ba5e-3195719419a3

📦 Creating 200 products...

✅ Successfully seeded 200 products for user 290ad905-f363-406f-ba5e-3195719419a3!

Product Categories:
   FRESH_PRODUCE: 35 products
   GROCERIES: 60 products
   FMCG: 40 products
   DAIRY: 20 products
   FISHERY_SEAFOOD: 15 products
   MEAT_POULTRY: 15 products
   AGRO_PRODUCTS: 15 products

=== Seeding Complete ===
```

### Sales Seed Output
```
=== Seeding Sales Data for Last 2 Months ===
Target User ID: 290ad905-f363-406f-ba5e-3195719419a3

✅ Found 200 products for user Kamal
📊 Generating 387 sales transactions...

   Progress: 50/387 (12.9%) - Latest: INV-260322-0050
   Progress: 100/387 (25.8%) - Latest: INV-260405-0100
   Progress: 150/387 (38.8%) - Latest: INV-260418-0150
   Progress: 200/387 (51.7%) - Latest: INV-260502-0200
   Progress: 250/387 (64.6%) - Latest: INV-260512-0250
   Progress: 300/387 (77.5%) - Latest: INV-260518-0300
   Progress: 350/387 (90.4%) - Latest: INV-260520-0350
   Progress: 387/387 (100.0%) - Latest: INV-260522-0387

✅ Successfully created 387 sales transactions!

📈 Sales Summary:
   Total Revenue: ৳1,245,680.00
   Total Profit: ৳312,420.00
   Average Sale: ৳3,218.50
   Profit Margin: 25.08%

💰 Payment Status:
   PAID: 271 (70.0%)
   PARTIAL: 58 (15.0%)
   UNPAID: 58 (15.0%)

🏆 Top 10 Products by Revenue:
   1. Hilsa Fish Ilish 1kg
      Revenue: ৳48,000, Qty: 40, Orders: 35
   2. Mutton Boneless 1kg
      Revenue: ৳36,000, Qty: 30, Orders: 28
   3. Prawn Golda Large 1kg
      Revenue: ৳31,500, Qty: 30, Orders: 25
   ...

=== Seeding Complete ===
```

## Data Characteristics

### Product Data
- **Total Products**: 200
- **Price Range**: ৳20 - ৳1,200
- **Stock Levels**: Realistic inventory quantities
- **Images**: Picsum placeholder images with unique seeds
- **Barcodes**: Sequential 12-digit barcodes starting from 880000000001

### Sales Data
- **Total Sales**: 300-500 transactions
- **Time Period**: Last 2 months
- **Average Items per Sale**: 2-4 items
- **Revenue Range**: ৳100 - ৳15,000 per sale
- **Customer Coverage**: 80% with customer info
- **Payment Distribution**: Realistic mix of paid/partial/unpaid

## Testing the Recommendation System

This seed data is specifically designed to test smart basket recommendations:

1. **Co-purchase Patterns**: Common product combinations (rice + dal, fish + spices)
2. **Category Affinities**: Related categories frequently bought together
3. **Seasonal Patterns**: Date-based sales distribution
4. **Customer Behavior**: Repeat purchases and basket sizes
5. **Price Sensitivity**: Mix of budget and premium products

## Troubleshooting

### "User not found" error
Make sure the user ID exists in your database. Check with:
```sql
SELECT id, name, email FROM "User" WHERE id = 'your-user-id';
```

### "No products found" error (when seeding sales)
Run the products seed script first:
```bash
npm run seed:products
```

### "Products already exist" warning
Use the `--force` flag to add more products:
```bash
npm run seed:products -- --force
```

### Database connection issues
Verify your `.env` file has the correct `DATABASE_URL` and the database is accessible.

## Notes

- All prices are in Bangladeshi Taka (৳)
- Product names use authentic Bangladeshi terminology
- Phone numbers follow Bangladesh mobile number format
- Invoice numbers include date stamps for easy tracking
- The scripts are idempotent with the `--force` flag
- Sales data automatically calculates profit margins
- Customer names are culturally appropriate for Bangladesh

## Next Steps

After seeding:
1. Test the inventory management features
2. Verify sales reporting and analytics
3. Test the smart basket recommendation system
4. Check co-purchase pattern detection
5. Validate profit margin calculations

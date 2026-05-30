import "dotenv/config";
import { PrismaClient } from "../prisma/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

const PASSWORD = "test1234";
const BUYER_ID = "290ad905-f363-406f-ba5e-3195719419a3";

const SUPPLIERS = [
  {
    name: "FreshSource",
    businessName: "FreshSource Dhaka",
    email: "supplier1@test.com",
    businessType: "WHOLESALER",
    businessSize: "MEDIUM",
    primaryCategory: "GROCERIES",
    subCategories: ["FRESH_PRODUCE", "DAIRY"],
    district: "Dhaka",
    area: "Mirpur",
    serviceArea: "CITY",
    serviceRadiusKm: 30,
    deliveryMethod: "BOTH",
    deliveryTimeRange: "SAME_DAY",
    pricingType: "BUDGET",
    bulkDiscountAvailable: true,
    orderCapacity: "MEDIUM",
    supplierTags: ["LOW_PRICE", "BULK_DISCOUNT", "CASH_ON_DELIVERY"],
    avgRating: 4.2,
    totalTransactions: 340,
    isVerified: true,
    yearsInBusiness: 4,
    minOrderValue: 500,
    maxOrderValue: 50000,
    paymentTerms: "Cash / Mobile Banking",
    phone: "01710000001",
  },
  {
    name: "QualityMart",
    businessName: "Quality Mart Ltd",
    email: "supplier2@test.com",
    businessType: "RETAILER",
    businessSize: "SMALL",
    primaryCategory: "GROCERIES",
    subCategories: ["DAIRY", "FMCG"],
    district: "Dhaka",
    area: "Gulshan",
    serviceArea: "LOCAL",
    serviceRadiusKm: 15,
    deliveryMethod: "SELF",
    deliveryTimeRange: "NEXT_DAY",
    pricingType: "PREMIUM",
    bulkDiscountAvailable: false,
    orderCapacity: "SMALL",
    supplierTags: ["PREMIUM_QUALITY", "FAST_DELIVERY", "VAT_INVOICE"],
    avgRating: 4.8,
    totalTransactions: 520,
    isVerified: true,
    yearsInBusiness: 6,
    minOrderValue: 1000,
    maxOrderValue: 20000,
    paymentTerms: "Bank Transfer / Credit",
    phone: "01710000002",
  },
  {
    name: "BulkBazaar",
    businessName: "Bulk Bazaar Wholesale",
    email: "supplier3@test.com",
    businessType: "DISTRIBUTOR",
    businessSize: "LARGE",
    primaryCategory: "FMCG",
    subCategories: ["GROCERIES", "DAIRY"],
    district: "Dhaka",
    area: "Tejgaon",
    serviceArea: "NATIONWIDE",
    serviceRadiusKm: 200,
    deliveryMethod: "COURIER",
    deliveryTimeRange: "TWO_THREE_DAYS",
    pricingType: "VALUE",
    bulkDiscountAvailable: true,
    orderCapacity: "LARGE",
    supplierTags: ["BULK_DISCOUNT", "FACTORY_DIRECT", "LOW_PRICE", "EXPORT_READY"],
    avgRating: 4.0,
    totalTransactions: 890,
    isVerified: true,
    yearsInBusiness: 8,
    minOrderValue: 5000,
    maxOrderValue: 500000,
    paymentTerms: "Bank Transfer / LC",
    phone: "01710000003",
  },
  {
    name: "DairyDirect",
    businessName: "Dairy Direct BD",
    email: "supplier4@test.com",
    businessType: "MANUFACTURER",
    businessSize: "MEDIUM",
    primaryCategory: "DAIRY",
    subCategories: ["GROCERIES"],
    district: "Dhaka",
    area: "Savar",
    serviceArea: "REGIONAL",
    serviceRadiusKm: 80,
    deliveryMethod: "SELF",
    deliveryTimeRange: "SAME_DAY",
    pricingType: "MID_RANGE",
    bulkDiscountAvailable: true,
    orderCapacity: "MEDIUM",
    supplierTags: ["FAST_DELIVERY", "BULK_DISCOUNT", "COLD_CHAIN", "HALAL_CERTIFIED"],
    avgRating: 4.5,
    totalTransactions: 670,
    isVerified: true,
    yearsInBusiness: 5,
    minOrderValue: 1000,
    maxOrderValue: 100000,
    paymentTerms: "Cash / Mobile Banking",
    phone: "01710000004",
  },
  {
    name: "ProduceFresh",
    businessName: "Produce Fresh Farm",
    email: "supplier5@test.com",
    businessType: "PROCESSOR",
    businessSize: "SMALL",
    primaryCategory: "FRESH_PRODUCE",
    subCategories: ["GROCERIES"],
    district: "Dhaka",
    area: "Keraniganj",
    serviceArea: "CITY",
    serviceRadiusKm: 25,
    deliveryMethod: "SELF",
    deliveryTimeRange: "SAME_DAY",
    pricingType: "VALUE",
    bulkDiscountAvailable: false,
    orderCapacity: "SMALL",
    supplierTags: ["LOW_PRICE", "FAST_DELIVERY", "CASH_ON_DELIVERY"],
    avgRating: 4.3,
    totalTransactions: 210,
    isVerified: true,
    yearsInBusiness: 3,
    minOrderValue: 300,
    maxOrderValue: 15000,
    paymentTerms: "Cash on Delivery",
    phone: "01710000005",
  },
  {
    name: "MetroSupply",
    businessName: "Metro Supply Chain",
    email: "supplier6@test.com",
    businessType: "WHOLESALER",
    businessSize: "ENTERPRISE",
    primaryCategory: "GROCERIES",
    subCategories: ["FMCG", "DAIRY", "FRESH_PRODUCE", "MEAT_POULTRY"],
    district: "Dhaka",
    area: "Motijheel",
    serviceArea: "NATIONWIDE",
    serviceRadiusKm: 300,
    deliveryMethod: "FREIGHT",
    deliveryTimeRange: "WITHIN_WEEK",
    pricingType: "BUDGET",
    bulkDiscountAvailable: true,
    orderCapacity: "ENTERPRISE",
    supplierTags: ["LOW_PRICE", "BULK_DISCOUNT", "FACTORY_DIRECT", "VAT_INVOICE", "EXPORT_READY"],
    avgRating: 3.8,
    totalTransactions: 1500,
    isVerified: true,
    yearsInBusiness: 12,
    minOrderValue: 10000,
    maxOrderValue: 1000000,
    paymentTerms: "Bank Transfer / LC / Credit",
    phone: "01710000006",
  },
  {
    name: "QuickShip",
    businessName: "QuickShip Groceries",
    email: "supplier7@test.com",
    businessType: "RETAILER",
    businessSize: "SMALL",
    primaryCategory: "GROCERIES",
    subCategories: ["FMCG"],
    district: "Dhaka",
    area: "Uttara",
    serviceArea: "LOCAL",
    serviceRadiusKm: 10,
    deliveryMethod: "SELF",
    deliveryTimeRange: "SAME_DAY",
    pricingType: "MID_RANGE",
    bulkDiscountAvailable: false,
    orderCapacity: "SMALL",
    supplierTags: ["FAST_DELIVERY", "SAMPLE_AVAILABLE", "CASH_ON_DELIVERY"],
    avgRating: 4.6,
    totalTransactions: 180,
    isVerified: true,
    yearsInBusiness: 2,
    minOrderValue: 200,
    maxOrderValue: 10000,
    paymentTerms: "Cash / Mobile Banking",
    phone: "01710000007",
  },
  {
    name: "FrozenFoods",
    businessName: "Frozen Foods Depot",
    email: "supplier8@test.com",
    businessType: "DISTRIBUTOR",
    businessSize: "MEDIUM",
    primaryCategory: "MEAT_POULTRY",
    subCategories: ["FISHERY_SEAFOOD", "DAIRY"],
    district: "Dhaka",
    area: "Khilgaon",
    serviceArea: "REGIONAL",
    serviceRadiusKm: 100,
    deliveryMethod: "COURIER",
    deliveryTimeRange: "NEXT_DAY",
    pricingType: "MID_RANGE",
    bulkDiscountAvailable: true,
    orderCapacity: "MEDIUM",
    supplierTags: ["COLD_CHAIN", "BULK_DISCOUNT", "FAST_DELIVERY", "HALAL_CERTIFIED"],
    avgRating: 4.1,
    totalTransactions: 430,
    isVerified: true,
    yearsInBusiness: 7,
    minOrderValue: 2000,
    maxOrderValue: 80000,
    paymentTerms: "Bank Transfer / Cash",
    phone: "01710000008",
  },
  {
    name: "GreenFields",
    businessName: "Green Fields Agro",
    email: "supplier9@test.com",
    businessType: "AGRO_PROCESSOR",
    businessSize: "MEDIUM",
    primaryCategory: "FRESH_PRODUCE",
    subCategories: ["GROCERIES", "AGRO_PRODUCTS"],
    district: "Dhaka",
    area: "Demra",
    serviceArea: "CITY",
    serviceRadiusKm: 40,
    deliveryMethod: "BOTH",
    deliveryTimeRange: "NEXT_DAY",
    pricingType: "VALUE",
    bulkDiscountAvailable: true,
    orderCapacity: "MEDIUM",
    supplierTags: ["LOW_PRICE", "BULK_DISCOUNT", "COLD_CHAIN", "CASH_ON_DELIVERY"],
    avgRating: 4.4,
    totalTransactions: 310,
    isVerified: false,
    yearsInBusiness: 4,
    minOrderValue: 500,
    maxOrderValue: 30000,
    paymentTerms: "Cash on Delivery",
    phone: "01710000009",
  },
  {
    name: "CityStaples",
    businessName: "City Staples Ltd",
    email: "supplier10@test.com",
    businessType: "WHOLESALER",
    businessSize: "LARGE",
    primaryCategory: "GROCERIES",
    subCategories: ["DAIRY", "FMCG"],
    district: "Dhaka",
    area: "Mohammadpur",
    serviceArea: "CITY",
    serviceRadiusKm: 35,
    deliveryMethod: "BOTH",
    deliveryTimeRange: "SAME_DAY",
    pricingType: "VALUE",
    bulkDiscountAvailable: true,
    orderCapacity: "LARGE",
    supplierTags: ["FAST_DELIVERY", "BULK_DISCOUNT", "VAT_INVOICE", "BSTI_CERTIFIED"],
    avgRating: 4.7,
    totalTransactions: 1100,
    isVerified: true,
    yearsInBusiness: 10,
    minOrderValue: 1000,
    maxOrderValue: 200000,
    paymentTerms: "Bank Transfer / Credit",
    phone: "01710000010",
  },
];

const SUPPLIER_PRODUCTS: Array<{
  name: string;
  category: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  minStock: number;
}> = [
  { name: "Basmati Rice 5kg", category: "GROCERIES", sellingPrice: 550, costPrice: 480, quantity: 200, unit: "KG", minStock: 20 },
  { name: "Cooking Oil 5L", category: "GROCERIES", sellingPrice: 750, costPrice: 650, quantity: 100, unit: "LITER", minStock: 10 },
  { name: "Sugar 1kg (Refined)", category: "GROCERIES", sellingPrice: 95, costPrice: 72, quantity: 500, unit: "KG", minStock: 50 },
  { name: "Wheat Flour 2kg", category: "GROCERIES", sellingPrice: 110, costPrice: 85, quantity: 300, unit: "PACK", minStock: 30 },
  { name: "Tea Bags 100pk", category: "GROCERIES", sellingPrice: 180, costPrice: 140, quantity: 150, unit: "PACK", minStock: 15 },
  { name: "Fresh Milk 1L", category: "DAIRY", sellingPrice: 75, costPrice: 55, quantity: 200, unit: "LITER", minStock: 20 },
  { name: "Butter 500g Block", category: "DAIRY", sellingPrice: 220, costPrice: 160, quantity: 80, unit: "PACK", minStock: 10 },
  { name: "Cheddar Cheese 200g", category: "DAIRY", sellingPrice: 160, costPrice: 120, quantity: 60, unit: "PACK", minStock: 8 },
  { name: "Potatoes 10kg Bag", category: "FRESH_PRODUCE", sellingPrice: 350, costPrice: 280, quantity: 100, unit: "KG", minStock: 10 },
  { name: "Onions 5kg Bag", category: "FRESH_PRODUCE", sellingPrice: 250, costPrice: 200, quantity: 100, unit: "KG", minStock: 10 },
  { name: "Bottled Water 6x1.5L", category: "FMCG", sellingPrice: 180, costPrice: 140, quantity: 120, unit: "PACK", minStock: 15 },
  { name: "Toilet Tissue 12pk", category: "FMCG", sellingPrice: 320, costPrice: 250, quantity: 90, unit: "PACK", minStock: 10 },
  { name: "Eggs 30pc Tray", category: "DAIRY", sellingPrice: 210, costPrice: 165, quantity: 80, unit: "PACK", minStock: 10 },
  { name: "Salt 1kg Iodized", category: "GROCERIES", sellingPrice: 28, costPrice: 18, quantity: 600, unit: "PACK", minStock: 60 },
  { name: "Lentils 2kg (Masoor)", category: "GROCERIES", sellingPrice: 260, costPrice: 210, quantity: 150, unit: "KG", minStock: 15 },
];

async function main() {
  console.log("Seeding 10 suppliers...\n");
  const hashedPassword = await bcrypt.hash(PASSWORD, 12);

  for (let i = 0; i < SUPPLIERS.length; i++) {
    const s = SUPPLIERS[i];
    console.log(`[${i + 1}/10] Creating ${s.businessName} (${s.email})...`);

    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        phone: s.phone,
        password: hashedPassword,
        role: "SUPPLIER",
        businessName: s.businessName,
        businessType: s.businessType as any,
        businessSize: s.businessSize as any,
        primaryCategory: s.primaryCategory as any,
        subCategories: s.subCategories,
        district: s.district,
        area: s.area,
        serviceArea: s.serviceArea as any,
        serviceRadiusKm: s.serviceRadiusKm,
        deliveryMethod: s.deliveryMethod as any,
        deliveryTimeRange: s.deliveryTimeRange as any,
        pricingType: s.pricingType as any,
        bulkDiscountAvailable: s.bulkDiscountAvailable,
        orderCapacity: s.orderCapacity as any,
        supplierTags: s.supplierTags as any,
        avgRating: s.avgRating,
        totalTransactions: s.totalTransactions,
        isVerified: s.isVerified,
        yearsInBusiness: s.yearsInBusiness,
        minOrderValue: s.minOrderValue,
        maxOrderValue: s.maxOrderValue,
        paymentTerms: s.paymentTerms,
        onboarded: true,
        isActive: true,
      },
    });

    // Create 12-15 products per supplier (mix of shared + unique products)
    const numProducts = 12 + (i % 3);
    const shuffled = [...SUPPLIER_PRODUCTS].sort(() => 0.5 - Math.random()).slice(0, numProducts);

    for (const p of shuffled) {
      const priceVariation = 0.85 + Math.random() * 0.3;
      const adjustedPrice = Math.round(p.sellingPrice * priceVariation);
      const adjustedCost = Math.round(p.costPrice * priceVariation * 0.85);

      await prisma.product.create({
        data: {
          ownerId: user.id,
          name: p.name,
          category: p.category as any,
          sellingPrice: adjustedPrice,
          costPrice: adjustedCost,
          quantity: Math.round(p.quantity * (0.8 + Math.random() * 0.4)),
          unit: p.unit as any,
          minStock: p.minStock,
          isActive: true,
        },
      });
    }

    console.log(`  ✓ Created with ${numProducts} products`);
    console.log(`    Rating: ${s.avgRating} ★  |  Deliver: ${s.deliveryTimeRange}  |  Price: ${s.pricingType}`);
    console.log(`    Tags: ${s.supplierTags.join(", ")}`);
    console.log(`    Area: ${s.area}, ${s.district} (${s.serviceRadiusKm}km radius)`);
    console.log();
  }

  console.log("--- SUMMARY ---");
  console.log(`Password for all suppliers: ${PASSWORD}`);
  console.log("Emails: supplier1@test.com through supplier10@test.com");
  console.log("All located in/near Dhaka, selling GROCERIES/DAIRY/FRESH_PRODUCE/FMCG");

  const total = await prisma.user.count({ where: { OR: [{ role: "SUPPLIER" }, { role: "BOTH" }] } });
  const totalProducts = await prisma.product.count();
  console.log(`\nTotal suppliers in DB now: ${total}`);
  console.log(`Total products in DB now: ${totalProducts}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

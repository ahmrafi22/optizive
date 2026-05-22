import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, PaymentStatus } from "../prisma/generated/prisma/client.js";

const DEFAULT_USER_ID = "290ad905-f363-406f-ba5e-3195719419a3";

function getArgValue(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const userId = getArgValue("--user") || process.env.SEED_USER_ID || DEFAULT_USER_ID;
const force = process.argv.includes("--force");

if (!process.env.DATABASE_URL) {
  console.error("Missing DATABASE_URL. Add it to your environment before running the seed script.");
  process.exit(1);
}

const adapter = new PrismaNeon(
  { connectionString: process.env.DATABASE_URL },
  { schema: process.env.DATABASE_SCHEMA ?? "public" },
);
const prisma = new PrismaClient({ adapter });

// Customer names for Bangladesh
const CUSTOMER_NAMES = [
  "Kamal Hossain", "Rahim Ahmed", "Fatema Begum", "Salma Khatun", "Abdul Jabbar",
  "Nasrin Akter", "Jahangir Alam", "Rupa Das", "Mizanur Rahman", "Shirin Sultana",
  "Habibur Rahman", "Ayesha Siddika", "Rafiqul Islam", "Taslima Nasrin", "Monir Hossain",
  "Shamima Akter", "Delwar Hossain", "Roksana Begum", "Shahin Alam", "Parveen Akter",
  "Azizul Haque", "Nargis Parvin", "Kamrul Islam", "Rehana Khatun", "Shafiqul Islam",
  "Sultana Razia", "Mofizul Rahman", "Hasina Begum", "Nurul Amin", "Farida Yasmin",
  "Alamgir Kabir", "Rowshan Ara", "Sirajul Islam", "Mahmuda Khatun", "Anwar Hossain",
  "Bilkis Banu", "Golam Mostafa", "Jahanara Begum", "Khorshed Alam", "Laila Arjumand",
  "Mostafa Kamal", "Nasima Akter", "Omar Faruk", "Parvin Sultana", "Quamrul Hasan",
  "Rahima Khatun", "Saiful Islam", "Tahmina Begum", "Uzzal Hossain", "Wahida Khanam",
];

// Phone number generator for Bangladesh
function generatePhone(): string {
  const prefixes = ["017", "018", "019", "013", "014", "015", "016"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(10000000 + Math.random() * 90000000);
  return `${prefix}${number}`;
}

// Generate invoice number
function generateInvoiceNumber(date: Date, index: number): string {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const seq = index.toString().padStart(4, "0");
  return `INV-${year}${month}${day}-${seq}`;
}

// Random date within last 2 months
function randomDateInLast2Months(): Date {
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(now.getMonth() - 2);
  
  const start = twoMonthsAgo.getTime();
  const end = now.getTime();
  const randomTime = start + Math.random() * (end - start);
  
  return new Date(randomTime);
}

// Random payment status with realistic distribution
function randomPaymentStatus(): { status: PaymentStatus; paidRatio: number } {
  const rand = Math.random();
  if (rand < 0.70) return { status: PaymentStatus.PAID, paidRatio: 1.0 }; // 70% fully paid
  if (rand < 0.85) return { status: PaymentStatus.PARTIAL, paidRatio: 0.3 + Math.random() * 0.6 }; // 15% partial
  return { status: PaymentStatus.UNPAID, paidRatio: 0 }; // 15% unpaid
}

// Generate realistic sales patterns
function generateSalesPattern(totalSales: number): Date[] {
  const dates: Date[] = [];
  const now = new Date();
  
  // More sales on weekends and evenings
  for (let i = 0; i < totalSales; i++) {
    const date = randomDateInLast2Months();
    
    // Boost weekend sales (Friday-Saturday in Bangladesh)
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6;
    
    if (isWeekend && Math.random() < 0.3) {
      // Add extra weekend sale
      dates.push(date);
    }
    
    dates.push(date);
  }
  
  return dates.sort((a, b) => a.getTime() - b.getTime());
}

async function seed() {
  console.log(`\n=== Seeding Sales Data for Last 2 Months ===`);
  console.log(`Target User ID: ${userId}\n`);

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    console.error(`❌ User with ID ${userId} not found!`);
    console.error(`   Please provide a valid user ID using --user flag.\n`);
    process.exit(1);
  }

  // Get all products for this user
  const products = await prisma.product.findMany({
    where: { ownerId: userId },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      costPrice: true,
      category: true,
    },
  });

  if (products.length === 0) {
    console.error(`❌ No products found for user ${userId}!`);
    console.error(`   Please run the product seed script first.\n`);
    process.exit(1);
  }

  console.log(`✅ Found ${products.length} products for user ${user.name || userId}`);

  // Check existing sales
  const existingSalesCount = await prisma.sale.count({
    where: { ownerId: userId },
  });

  if (existingSalesCount > 0 && !force) {
    console.log(`❌ User already has ${existingSalesCount} sales records.`);
    console.log(`   Use --force flag to add more sales data.\n`);
    return;
  }

  if (existingSalesCount > 0 && force) {
    console.log(`⚠️  User already has ${existingSalesCount} sales, but --force flag is set.`);
    console.log(`   Adding more sales data...\n`);
  }

  // Generate sales data
  const numberOfSales = 300 + Math.floor(Math.random() * 200); // 300-500 sales
  console.log(`📊 Generating ${numberOfSales} sales transactions...\n`);

  const salesDates = generateSalesPattern(numberOfSales);
  let totalRevenue = 0;
  let totalProfit = 0;

  for (let i = 0; i < numberOfSales; i++) {
    const saleDate = salesDates[i];
    
    // Random number of items per sale (1-8 items, weighted towards 2-4)
    const numItems = Math.random() < 0.7 
      ? 2 + Math.floor(Math.random() * 3) // 2-4 items (70%)
      : 1 + Math.floor(Math.random() * 8); // 1-8 items (30%)

    // Select random products for this sale
    const selectedProducts = [];
    const usedIndices = new Set<number>();
    
    for (let j = 0; j < numItems; j++) {
      let productIndex;
      do {
        productIndex = Math.floor(Math.random() * products.length);
      } while (usedIndices.has(productIndex));
      
      usedIndices.add(productIndex);
      const product = products[productIndex];
      
      // Random quantity (weighted towards smaller quantities)
      let quantity: number;
      const qtyRand = Math.random();
      if (qtyRand < 0.5) quantity = 1;
      else if (qtyRand < 0.8) quantity = 2;
      else if (qtyRand < 0.95) quantity = 3 + Math.floor(Math.random() * 3);
      else quantity = 5 + Math.floor(Math.random() * 10);

      selectedProducts.push({
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
        totalPrice: quantity * product.sellingPrice,
      });
    }

    // Calculate totals
    const totalAmount = selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    
    // Random discount (0-15%, weighted towards lower discounts)
    let discount = 0;
    const discountRand = Math.random();
    if (discountRand < 0.6) discount = 0; // 60% no discount
    else if (discountRand < 0.85) discount = Math.floor(totalAmount * (0.02 + Math.random() * 0.05)); // 25% small discount (2-7%)
    else discount = Math.floor(totalAmount * (0.08 + Math.random() * 0.07)); // 15% larger discount (8-15%)

    const finalAmount = totalAmount - discount;
    
    // Payment status
    const { status: paymentStatus, paidRatio } = randomPaymentStatus();
    const paidAmount = Math.floor(finalAmount * paidRatio);
    const dueAmount = finalAmount - paidAmount;

    // Customer info (80% have customer info)
    const hasCustomerInfo = Math.random() < 0.8;
    const customerName = hasCustomerInfo ? CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)] : null;
    const customerPhone = hasCustomerInfo ? generatePhone() : null;

    // Create sale with items
    const sale = await prisma.sale.create({
      data: {
        ownerId: userId,
        invoiceNumber: generateInvoiceNumber(saleDate, i + 1),
        customerName,
        customerPhone,
        totalAmount,
        discount,
        finalAmount,
        paymentStatus,
        paidAmount,
        dueAmount,
        notes: Math.random() < 0.1 ? "Regular customer" : null,
        createdAt: saleDate,
        updatedAt: saleDate,
        items: {
          create: selectedProducts.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
    });

    // Calculate profit
    const saleProfit = selectedProducts.reduce((sum, item) => {
      return sum + ((item.unitPrice - item.costPrice) * item.quantity);
    }, 0) - discount;

    totalRevenue += finalAmount;
    totalProfit += saleProfit;

    // Progress indicator
    if ((i + 1) % 50 === 0 || i === numberOfSales - 1) {
      const progress = ((i + 1) / numberOfSales * 100).toFixed(1);
      console.log(`   Progress: ${i + 1}/${numberOfSales} (${progress}%) - Latest: ${sale.invoiceNumber}`);
    }
  }

  console.log(`\n✅ Successfully created ${numberOfSales} sales transactions!`);
  console.log(`\n📈 Sales Summary:`);
  console.log(`   Total Revenue: ৳${totalRevenue.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`);
  console.log(`   Total Profit: ৳${totalProfit.toLocaleString('en-BD', { minimumFractionDigits: 2 })}`);
  console.log(`   Average Sale: ৳${(totalRevenue / numberOfSales).toLocaleString('en-BD', { minimumFractionDigits: 2 })}`);
  console.log(`   Profit Margin: ${((totalProfit / totalRevenue) * 100).toFixed(2)}%`);

  // Payment status breakdown
  const paymentBreakdown = await prisma.sale.groupBy({
    by: ['paymentStatus'],
    where: { ownerId: userId },
    _count: true,
  });

  console.log(`\n💰 Payment Status:`);
  paymentBreakdown.forEach(item => {
    const percentage = ((item._count / numberOfSales) * 100).toFixed(1);
    console.log(`   ${item.paymentStatus}: ${item._count} (${percentage}%)`);
  });

  // Top selling products
  const topProducts = await prisma.saleItem.groupBy({
    by: ['productId'],
    where: {
      sale: { ownerId: userId },
    },
    _sum: {
      quantity: true,
      totalPrice: true,
    },
    _count: true,
    orderBy: {
      _sum: {
        totalPrice: 'desc',
      },
    },
    take: 10,
  });

  console.log(`\n🏆 Top 10 Products by Revenue:`);
  for (let i = 0; i < topProducts.length; i++) {
    const item = topProducts[i];
    const product = products.find(p => p.id === item.productId);
    const revenue = item._sum.totalPrice || 0;
    const quantity = item._sum.quantity || 0;
    console.log(`   ${i + 1}. ${product?.name || 'Unknown'}`);
    console.log(`      Revenue: ৳${revenue.toLocaleString('en-BD')}, Qty: ${quantity}, Orders: ${item._count}`);
  }

  console.log(`\n=== Seeding Complete ===\n`);
}

try {
  await seed();
} catch (error) {
  console.error("❌ Seed failed:", error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}

"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";

export interface DashboardStats {
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  lowStockProducts: number;
  revenueChange: number;
  salesChange: number;
}

export interface TopProduct {
  id: string;
  name: string;
  imageLink: string | null;
  category: string | null;
  totalSales: number;
  totalRevenue: number;
}

export interface RecentSale {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  finalAmount: number;
  createdAt: string;
  itemCount: number;
}

export interface CategorySales {
  category: string;
  sales: number;
  revenue: number;
}

export interface DailySales {
  date: string;
  sales: number;
  revenue: number;
}

export interface DashboardData {
  stats: DashboardStats;
  topProducts: TopProduct[];
  recentSales: RecentSale[];
  categorySales: CategorySales[];
  dailySales: DailySales[];
  monthlySales: DailySales[];
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(now.getDate() - 60);

  // Fetch current period stats (last 30 days)
  const [currentStats] = await prisma.$queryRaw<Array<{
    totalRevenue: number;
    totalSales: number;
  }>>`
    SELECT 
      COALESCE(SUM("finalAmount"), 0) as "totalRevenue",
      COUNT(*) as "totalSales"
    FROM "Sale"
    WHERE "ownerId" = ${userId}
      AND "createdAt" >= ${thirtyDaysAgo}
  `;

  // Fetch previous period stats (30-60 days ago)
  const [previousStats] = await prisma.$queryRaw<Array<{
    totalRevenue: number;
    totalSales: number;
  }>>`
    SELECT 
      COALESCE(SUM("finalAmount"), 0) as "totalRevenue",
      COUNT(*) as "totalSales"
    FROM "Sale"
    WHERE "ownerId" = ${userId}
      AND "createdAt" >= ${sixtyDaysAgo}
      AND "createdAt" < ${thirtyDaysAgo}
  `;

  // Calculate percentage changes
  const revenueChange = previousStats?.totalRevenue > 0
    ? ((Number(currentStats?.totalRevenue || 0) - Number(previousStats.totalRevenue)) / Number(previousStats.totalRevenue)) * 100
    : 0;

  const salesChange = previousStats?.totalSales > 0
    ? ((Number(currentStats?.totalSales || 0) - Number(previousStats.totalSales)) / Number(previousStats.totalSales)) * 100
    : 0;

  // Fetch product stats
  const [productStats] = await prisma.$queryRaw<Array<{
    totalProducts: number;
    lowStockProducts: number;
  }>>`
    SELECT 
      COUNT(*) as "totalProducts",
      COUNT(*) FILTER (WHERE "isActive" = true AND "minStock" IS NOT NULL AND "quantity" > 0 AND "quantity" <= "minStock") as "lowStockProducts"
    FROM "Product"
    WHERE "ownerId" = ${userId}
  `;

  // Fetch top products (last 30 days)
  const topProducts = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    imageLink: string | null;
    category: string | null;
    totalSales: number;
    totalRevenue: number;
  }>>`
    SELECT 
      p.id,
      p.name,
      p."imageLink",
      p.category,
      COALESCE(SUM(si.quantity), 0) as "totalSales",
      COALESCE(SUM(si."totalPrice"), 0) as "totalRevenue"
    FROM "Product" p
    LEFT JOIN "SaleItem" si ON p.id = si."productId"
    LEFT JOIN "Sale" s ON si."saleId" = s.id AND s."ownerId" = ${userId} AND s."createdAt" >= ${thirtyDaysAgo}
    WHERE p."ownerId" = ${userId}
    GROUP BY p.id, p.name, p."imageLink", p.category
    HAVING COALESCE(SUM(si.quantity), 0) > 0
    ORDER BY "totalSales" DESC
    LIMIT 5
  `;

  // Fetch recent sales
  const recentSales = await prisma.sale.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      items: {
        select: { id: true },
      },
    },
  });

  // Fetch category sales (last 30 days)
  const categorySales = await prisma.$queryRaw<Array<{
    category: string | null;
    sales: number;
    revenue: number;
  }>>`
    SELECT 
      p.category,
      COALESCE(SUM(si.quantity), 0) as sales,
      COALESCE(SUM(si."totalPrice"), 0) as revenue
    FROM "SaleItem" si
    INNER JOIN "Sale" s ON si."saleId" = s.id
    INNER JOIN "Product" p ON si."productId" = p.id
    WHERE s."ownerId" = ${userId}
      AND s."createdAt" >= ${thirtyDaysAgo}
    GROUP BY p.category
    ORDER BY revenue DESC
  `;

  // Fetch daily sales (last 30 days)
  const dailySales = await prisma.$queryRaw<Array<{
    date: Date;
    sales: number;
    revenue: number;
  }>>`
    SELECT 
      DATE(s."createdAt") as date,
      COUNT(*) as sales,
      COALESCE(SUM(s."finalAmount"), 0) as revenue
    FROM "Sale" s
    WHERE s."ownerId" = ${userId}
      AND s."createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE(s."createdAt")
    ORDER BY date ASC
  `;

  // Fetch monthly sales (last 6 months)
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const monthlySales = await prisma.$queryRaw<Array<{
    month: number;
    year: number;
    sales: number;
    revenue: number;
  }>>`
    SELECT 
      EXTRACT(MONTH FROM s."createdAt")::int as month,
      EXTRACT(YEAR FROM s."createdAt")::int as year,
      COUNT(*) as sales,
      COALESCE(SUM(s."finalAmount"), 0) as revenue
    FROM "Sale" s
    WHERE s."ownerId" = ${userId}
      AND s."createdAt" >= ${sixMonthsAgo}
    GROUP BY EXTRACT(MONTH FROM s."createdAt"), EXTRACT(YEAR FROM s."createdAt")
    ORDER BY year, month ASC
  `;

  // Format daily sales with missing dates filled
  const dailySalesMap = new Map<string, { sales: number; revenue: number }>();
  dailySales.forEach((row) => {
    const dateStr = row.date.toISOString().split('T')[0];
    dailySalesMap.set(dateStr, {
      sales: Number(row.sales),
      revenue: Number(row.revenue),
    });
  });

  const formattedDailySales: DailySales[] = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const data = dailySalesMap.get(dateStr) || { sales: 0, revenue: 0 };
    
    formattedDailySales.push({
      date: dateStr,
      sales: data.sales,
      revenue: data.revenue,
    });
  }

  // Format monthly sales
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const formattedMonthlySales: DailySales[] = monthlySales.map((row) => ({
    date: `${monthNames[row.month - 1]} ${row.year}`,
    sales: Number(row.sales),
    revenue: Number(row.revenue),
  }));

  return {
    stats: {
      totalRevenue: Number(currentStats?.totalRevenue || 0),
      totalSales: Number(currentStats?.totalSales || 0),
      totalProducts: Number(productStats?.totalProducts || 0),
      lowStockProducts: Number(productStats?.lowStockProducts || 0),
      revenueChange: Number(revenueChange.toFixed(1)),
      salesChange: Number(salesChange.toFixed(1)),
    },
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      imageLink: p.imageLink,
      category: p.category,
      totalSales: Number(p.totalSales),
      totalRevenue: Number(p.totalRevenue),
    })),
    recentSales: recentSales.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName,
      finalAmount: s.finalAmount,
      createdAt: s.createdAt.toISOString(),
      itemCount: s.items.length,
    })),
    categorySales: categorySales
      .filter((c) => c.category !== null)
      .map((c) => ({
        category: c.category || "Other",
        sales: Number(c.sales),
        revenue: Number(c.revenue),
      })),
    dailySales: formattedDailySales,
    monthlySales: formattedMonthlySales,
  };
}

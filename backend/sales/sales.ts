"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { PaymentStatus, BuyerType, OrderStatus, Prisma } from "@/prisma/generated/prisma/client";

export interface SalesListItem {
  id: string;
  invoiceNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  buyerType: BuyerType;
  buyerId: string | null;
  buyerBusinessName: string | null;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  dueAmount: number;
  orderStatus: OrderStatus;
  itemCount: number;
  createdAt: string;
}

export interface SalesListResponse {
  sales: SalesListItem[];
  total: number;
  totalPages: number;
  page: number;
}

export interface SaleDetail extends SalesListItem {
  items: SaleItemDetail[];
  deliveryAddress: string | null;
  deliveryDate: string | null;
  notes: string | null;
}

export interface SaleItemDetail {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface SaleStats {
  totalSales: number;
  totalRevenue: number;
  totalDue: number;
  totalPaid: number;
  avgSaleValue: number;
  salesToday: number;
  revenueToday: number;
  salesThisMonth: number;
  revenueThisMonth: number;
  paidCount: number;
  unpaidCount: number;
  partialCount: number;
  platformUserSales: number;
  externalSales: number;
}

export interface CreateSaleInput {
  customerName?: string;
  customerPhone?: string;
  buyerType: BuyerType;
  buyerId?: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  discount?: number;
  paymentStatus?: PaymentStatus;
  paidAmount?: number;
  deliveryAddress?: string;
  deliveryDate?: string;
  notes?: string;
}

export interface SalesQuery {
  page?: number;
  limit?: number;
  search?: string;
  paymentStatus?: PaymentStatus | "ALL";
  buyerType?: BuyerType | "ALL";
  orderStatus?: OrderStatus | "ALL";
  dateFrom?: string;
  dateTo?: string;
  sort?: "createdAt" | "finalAmount" | "customerName";
  order?: "asc" | "desc";
}

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

export async function listSales(query: SalesQuery = {}): Promise<SalesListResponse | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  const where: Prisma.SaleWhereInput = { ownerId: userId };

  if (query.search) {
    where.OR = [
      { invoiceNumber: { contains: query.search, mode: "insensitive" } },
      { customerName: { contains: query.search, mode: "insensitive" } },
      { customerPhone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  if (query.paymentStatus && query.paymentStatus !== "ALL") {
    where.paymentStatus = query.paymentStatus;
  }

  if (query.buyerType && query.buyerType !== "ALL") {
    where.buyerType = query.buyerType;
  }

  if (query.orderStatus && query.orderStatus !== "ALL") {
    where.orderStatus = query.orderStatus;
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom);
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo);
  }

  const orderBy: Prisma.SaleOrderByWithRelationInput = {};
  if (query.sort === "finalAmount") orderBy.finalAmount = query.order || "desc";
  else if (query.sort === "customerName") orderBy.customerName = query.order || "asc";
  else orderBy.createdAt = query.order || "desc";

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      include: {
        items: { select: { id: true, quantity: true, totalPrice: true } },
        buyer: { select: { id: true, businessName: true } },
      },
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    sales: sales.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.buyerType === "PLATFORM_USER" && s.buyer?.businessName ? s.buyer.businessName : s.customerName,
      customerPhone: s.customerPhone,
      buyerType: s.buyerType as BuyerType,
      buyerId: s.buyerId,
      buyerBusinessName: s.buyer?.businessName || null,
      totalAmount: s.totalAmount,
      discount: s.discount,
      finalAmount: s.finalAmount,
      paymentStatus: s.paymentStatus as PaymentStatus,
      paidAmount: s.paidAmount,
      dueAmount: s.dueAmount,
      orderStatus: s.orderStatus as OrderStatus,
      itemCount: s.items.length,
      createdAt: s.createdAt.toISOString(),
    })),
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

export async function getSale(id: string): Promise<SaleDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const sale = await prisma.sale.findFirst({
    where: { id, ownerId: userId },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageLink: true } },
        },
      },
      buyer: { select: { id: true, businessName: true, name: true, phone: true } },
    },
  });

  if (!sale) return null;

  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.buyerType === "PLATFORM_USER" && sale.buyer?.businessName
      ? sale.buyer.businessName
      : sale.customerName,
    customerPhone: sale.customerPhone,
    buyerType: sale.buyerType as BuyerType,
    buyerId: sale.buyerId,
    buyerBusinessName: sale.buyer?.businessName || null,
    totalAmount: sale.totalAmount,
    discount: sale.discount,
    finalAmount: sale.finalAmount,
    paymentStatus: sale.paymentStatus as PaymentStatus,
    paidAmount: sale.paidAmount,
    dueAmount: sale.dueAmount,
    orderStatus: sale.orderStatus as OrderStatus,
    itemCount: sale.items.length,
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productImage: i.product.imageLink,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    deliveryAddress: sale.deliveryAddress,
    deliveryDate: sale.deliveryDate?.toISOString() || null,
    notes: sale.notes,
  };
}

export async function createSale(input: CreateSaleInput): Promise<SaleDetail | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const totalAmount = input.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const discount = input.discount || 0;
  const finalAmount = totalAmount - discount;
  const paidAmount = input.paidAmount || 0;
  const dueAmount = finalAmount - paidAmount;

  let invoiceNumber = generateInvoiceNumber();
  let attempts = 0;
  while (attempts < 5) {
    const existing = await prisma.sale.findUnique({ where: { invoiceNumber } });
    if (!existing) break;
    invoiceNumber = generateInvoiceNumber();
    attempts++;
  }

  const sale = await prisma.sale.create({
    data: {
      ownerId: userId,
      invoiceNumber,
      customerName: input.buyerType === "PLATFORM_USER" ? undefined : (input.customerName || null),
      customerPhone: input.customerPhone || null,
      buyerType: input.buyerType,
      buyerId: input.buyerType === "PLATFORM_USER" ? input.buyerId : null,
      totalAmount,
      discount,
      finalAmount,
      paymentStatus: dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID",
      paidAmount,
      dueAmount,
      deliveryAddress: input.deliveryAddress || null,
      deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
      notes: input.notes || null,
      items: {
        create: input.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice,
        })),
      },
    },
    include: {
      items: {
        include: {
          product: { select: { id: true, name: true, imageLink: true } },
        },
      },
      buyer: { select: { id: true, businessName: true, name: true, phone: true } },
    },
  });

  return {
    id: sale.id,
    invoiceNumber: sale.invoiceNumber,
    customerName: sale.buyerType === "PLATFORM_USER" && sale.buyer?.businessName
      ? sale.buyer.businessName
      : sale.customerName,
    customerPhone: sale.customerPhone,
    buyerType: sale.buyerType as BuyerType,
    buyerId: sale.buyerId,
    buyerBusinessName: sale.buyer?.businessName || null,
    totalAmount: sale.totalAmount,
    discount: sale.discount,
    finalAmount: sale.finalAmount,
    paymentStatus: sale.paymentStatus as PaymentStatus,
    paidAmount: sale.paidAmount,
    dueAmount: sale.dueAmount,
    orderStatus: sale.orderStatus as OrderStatus,
    itemCount: sale.items.length,
    createdAt: sale.createdAt.toISOString(),
    items: sale.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      productName: i.product.name,
      productImage: i.product.imageLink,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    deliveryAddress: sale.deliveryAddress,
    deliveryDate: sale.deliveryDate?.toISOString() || null,
    notes: sale.notes,
  };
}

export async function updateSalePayment(
  saleId: string,
  data: { paidAmount: number; paymentStatus?: PaymentStatus }
): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const sale = await prisma.sale.findFirst({ where: { id: saleId, ownerId: userId } });
  if (!sale) return false;

  const paidAmount = data.paidAmount;
  const dueAmount = sale.finalAmount - paidAmount;
  const paymentStatus = data.paymentStatus || (dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID");

  await prisma.sale.update({
    where: { id: saleId },
    data: { paidAmount, dueAmount, paymentStatus },
  });

  return true;
}

export async function updateSaleOrderStatus(
  saleId: string,
  orderStatus: OrderStatus
): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const sale = await prisma.sale.findFirst({ where: { id: saleId, ownerId: userId } });
  if (!sale) return false;

  await prisma.sale.update({ where: { id: saleId }, data: { orderStatus } });
  return true;
}

export async function deleteSale(saleId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const sale = await prisma.sale.findFirst({ where: { id: saleId, ownerId: userId } });
  if (!sale) return false;

  await prisma.sale.delete({ where: { id: saleId } });
  return true;
}

export async function getSalesStats(): Promise<SaleStats | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [aggregated, todayAgg, monthAgg, statusCounts, buyerTypeCounts] = await Promise.all([
    prisma.sale.aggregate({
      where: { ownerId: userId },
      _count: { id: true },
      _sum: { finalAmount: true, paidAmount: true, dueAmount: true },
      _avg: { finalAmount: true },
    }),
    prisma.sale.aggregate({
      where: { ownerId: userId, createdAt: { gte: startOfToday } },
      _count: { id: true },
      _sum: { finalAmount: true },
    }),
    prisma.sale.aggregate({
      where: { ownerId: userId, createdAt: { gte: startOfMonth } },
      _count: { id: true },
      _sum: { finalAmount: true },
    }),
    prisma.$queryRaw<Array<{ paymentStatus: string; count: bigint }>>`
      SELECT "paymentStatus", COUNT(*)::int as "count"
      FROM "Sale"
      WHERE "ownerId" = ${userId}
      GROUP BY "paymentStatus"
    `,
    prisma.$queryRaw<Array<{ buyerType: string; count: bigint }>>`
      SELECT "buyerType", COUNT(*)::int as "count"
      FROM "Sale"
      WHERE "ownerId" = ${userId}
      GROUP BY "buyerType"
    `,
  ]);

  const statusMap: Record<string, number> = {};
  statusCounts.forEach((s: any) => {
    statusMap[s.paymentStatus] = Number(s.count);
  });

  const buyerTypeMap: Record<string, number> = {};
  buyerTypeCounts.forEach((b: any) => {
    buyerTypeMap[b.buyerType] = Number(b.count);
  });

  return {
    totalSales: aggregated._count.id,
    totalRevenue: aggregated._sum.finalAmount || 0,
    totalDue: aggregated._sum.dueAmount || 0,
    totalPaid: aggregated._sum.paidAmount || 0,
    avgSaleValue: aggregated._count.id > 0 ? (aggregated._sum.finalAmount || 0) / aggregated._count.id : 0,
    salesToday: todayAgg._count.id,
    revenueToday: todayAgg._sum.finalAmount || 0,
    salesThisMonth: monthAgg._count.id,
    revenueThisMonth: monthAgg._sum.finalAmount || 0,
    paidCount: statusMap["PAID"] || 0,
    unpaidCount: statusMap["UNPAID"] || 0,
    partialCount: statusMap["PARTIAL"] || 0,
    platformUserSales: buyerTypeMap["PLATFORM_USER"] || 0,
    externalSales: buyerTypeMap["EXTERNAL"] || 0,
  };
}

export async function searchPlatformUsers(query: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  if (query.length < 2) return [];

  const users = await prisma.user.findMany({
    where: {
      AND: [
        { id: { not: userId } },
        {
          OR: [
            { businessName: { contains: query, mode: "insensitive" } },
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        },
      ],
    },
    select: {
      id: true,
      name: true,
      businessName: true,
      phone: true,
      profileImage: true,
    },
    take: 10,
  });

  return users;
}

export async function getOwnerProducts() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const products = await prisma.product.findMany({
    where: { ownerId: userId, isActive: true },
    select: {
      id: true,
      name: true,
      sellingPrice: true,
      quantity: true,
      unit: true,
      imageLink: true,
      category: true,
    },
    orderBy: { name: "asc" },
  });

  return products;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  sales: number;
}

export interface DistributionItem {
  name: string;
  value: number;
  color: string;
}

export interface SalesChartData {
  monthlyTrend: MonthlyTrend[];
  paymentDistribution: DistributionItem[];
  buyerTypeDistribution: DistributionItem[];
  dailyRevenue: { date: string; revenue: number }[];
}

export async function getSalesChartData(): Promise<SalesChartData | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const now = new Date();

  // Monthly trend (last 12 months)
  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const monthlyRaw = await prisma.$queryRaw<
    Array<{ year: number; month: number; revenue: number; sales: number }>
  >`
    SELECT
      EXTRACT(YEAR FROM "createdAt")::int as year,
      EXTRACT(MONTH FROM "createdAt")::int as month,
      COALESCE(SUM("finalAmount"), 0) as revenue,
      COUNT(*)::int as sales
    FROM "Sale"
    WHERE "ownerId" = ${userId}
      AND "createdAt" >= ${twelveMonthsAgo}
    GROUP BY year, month
    ORDER BY year ASC, month ASC
  `;

  const monthlyMap = new Map<string, MonthlyTrend>();
  for (const row of monthlyRaw) {
    const key = `${row.year}-${row.month}`;
    monthlyMap.set(key, {
      month: new Date(row.year, row.month - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      revenue: Number(row.revenue),
      sales: Number(row.sales),
    });
  }

  // Fill in missing months
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyTrend: MonthlyTrend[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    if (monthlyMap.has(key)) {
      monthlyTrend.push(monthlyMap.get(key)!);
    } else {
      monthlyTrend.push({ month: label, revenue: 0, sales: 0 });
    }
  }

  // Payment status distribution
  const paymentRaw = await prisma.$queryRaw<
    Array<{ paymentStatus: string; count: number; total: number }>
  >`
    SELECT "paymentStatus", COUNT(*)::int as count, COALESCE(SUM("finalAmount"), 0) as total
    FROM "Sale"
    WHERE "ownerId" = ${userId}
    GROUP BY "paymentStatus"
  `;

  const paymentColors: Record<string, string> = {
    PAID: "#10b981",
    PARTIAL: "#f59e0b",
    UNPAID: "#ef4444",
  };
  const paymentDistribution: DistributionItem[] = paymentRaw.map((r) => ({
    name: r.paymentStatus.charAt(0) + r.paymentStatus.slice(1).toLowerCase(),
    value: Number(r.total),
    color: paymentColors[r.paymentStatus] || "#6b7280",
  }));

  // Buyer type distribution
  const buyerRaw = await prisma.$queryRaw<
    Array<{ buyerType: string; count: number; total: number }>
  >`
    SELECT "buyerType", COUNT(*)::int as count, COALESCE(SUM("finalAmount"), 0) as total
    FROM "Sale"
    WHERE "ownerId" = ${userId}
    GROUP BY "buyerType"
  `;

  const buyerColors: Record<string, string> = {
    PLATFORM_USER: "#3b82f6",
    EXTERNAL: "#f59e0b",
  };
  const buyerTypeDistribution: DistributionItem[] = buyerRaw.map((r) => ({
    name: r.buyerType === "PLATFORM_USER" ? "Platform" : "External",
    value: Number(r.total),
    color: buyerColors[r.buyerType] || "#6b7280",
  }));

  // Daily revenue (last 30 days)
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  const dailyRaw = await prisma.$queryRaw<
    Array<{ date: Date; revenue: number }>
  >`
    SELECT DATE("createdAt") as date, COALESCE(SUM("finalAmount"), 0) as revenue
    FROM "Sale"
    WHERE "ownerId" = ${userId}
      AND "createdAt" >= ${thirtyDaysAgo}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;

  const dailyMap = new Map<string, number>();
  dailyRaw.forEach((r) => {
    const ds = r.date.toISOString().split("T")[0];
    dailyMap.set(ds, Number(r.revenue));
  });

  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    dailyRevenue.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dailyMap.get(ds) || 0,
    });
  }

  return { monthlyTrend, paymentDistribution, buyerTypeDistribution, dailyRevenue };
}

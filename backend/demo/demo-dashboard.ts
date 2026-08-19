import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import { demoGetSupplierRecommendations } from "./demo-suppliers";
import type { SupplierSummary } from "@/backend/supplier-recommender/types";
import type {
  DashboardData,
  DailySales,
} from "@/backend/dashboard/dashboard";

const DAY = 86400000;

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export function demoGetDashboardData(): DashboardData {
  const store = getDemoStore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * DAY);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * DAY);

  const sales = store.sales.filter((s) => s.ownerId === DEMO_USER_ID);
  const products = store.products.filter((p) => p.ownerId === DEMO_USER_ID);
  const items = store.saleItems;

  const itemBySale = new Map<string, any[]>();
  items.forEach((it) => {
    const list = itemBySale.get(it.saleId) ?? [];
    list.push(it);
    itemBySale.set(it.saleId, list);
  });
  const productById = new Map(store.products.map((p) => [p.id, p]));

  const salesInRange = (from: Date, to?: Date) =>
    sales.filter((s) => {
      const t = s.createdAt.getTime();
      if (to) return t >= from.getTime() && t < to.getTime();
      return t >= from.getTime();
    });

  const current = salesInRange(thirtyDaysAgo);
  const previous = salesInRange(sixtyDaysAgo, thirtyDaysAgo);

  const sumRevenue = (list: any[]) =>
    list.reduce((s, x) => s + (x.finalAmount ?? 0), 0);

  const revenueChange =
    sumRevenue(previous) > 0
      ? ((sumRevenue(current) - sumRevenue(previous)) / sumRevenue(previous)) * 100
      : 0;
  const salesChange =
    previous.length > 0
      ? ((current.length - previous.length) / previous.length) * 100
      : 0;

  const lowStockProducts = products.filter(
    (p) => p.isActive && p.minStock !== null && p.quantity > 0 && p.quantity <= p.minStock,
  ).length;

  const recentSales = sales
    .map((s) => ({ ...s, itemCount: (itemBySale.get(s.id) ?? []).length }))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 10);

  const topMap = new Map<string, { id: string; name: string; imageLink: string | null; category: string | null; totalSales: number; totalRevenue: number }>();
  current.forEach((s) => {
    (itemBySale.get(s.id) ?? []).forEach((it) => {
      const p = productById.get(it.productId);
      if (!p) return;
      const entry = topMap.get(p.id) ?? {
        id: p.id,
        name: p.name,
        imageLink: p.imageLink ?? null,
        category: p.category ?? null,
        totalSales: 0,
        totalRevenue: 0,
      };
      entry.totalSales += it.quantity;
      entry.totalRevenue += it.totalPrice ?? 0;
      topMap.set(p.id, entry);
    });
  });
  const topProducts = Array.from(topMap.values())
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  const catMap = new Map<string, { category: string; sales: number; revenue: number }>();
  current.forEach((s) => {
    (itemBySale.get(s.id) ?? []).forEach((it) => {
      const p = productById.get(it.productId);
      const cat = p?.category ?? "Other";
      const entry = catMap.get(cat) ?? { category: cat, sales: 0, revenue: 0 };
      entry.sales += it.quantity;
      entry.revenue += it.totalPrice ?? 0;
      catMap.set(cat, entry);
    });
  });
  const categorySales = Array.from(catMap.values())
    .sort((a, b) => b.revenue - a.revenue);

  const dailyMap = new Map<string, { sales: number; revenue: number }>();
  current.forEach((s) => {
    const key = dateKey(s.createdAt);
    const entry = dailyMap.get(key) ?? { sales: 0, revenue: 0 };
    entry.sales += 1;
    entry.revenue += s.finalAmount ?? 0;
    dailyMap.set(key, entry);
  });
  const formattedDailySales: DailySales[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now.getTime() - i * DAY);
    const key = dateKey(d);
    const data = dailyMap.get(key) ?? { sales: 0, revenue: 0 };
    formattedDailySales.push({ date: key, sales: data.sales, revenue: data.revenue });
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthMap = new Map<string, { sales: number; revenue: number }>();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 5);
  sales.forEach((s) => {
    if (s.createdAt < sixMonthsAgo) return;
    const key = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth() + 1}`;
    const entry = monthMap.get(key) ?? { sales: 0, revenue: 0 };
    entry.sales += 1;
    entry.revenue += s.finalAmount ?? 0;
    monthMap.set(key, entry);
  });
  const formattedMonthlySales: DailySales[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    const data = monthMap.get(key) ?? { sales: 0, revenue: 0 };
    formattedMonthlySales.push({
      date: `${monthNames[d.getMonth()]} ${d.getFullYear()}`,
      sales: data.sales,
      revenue: data.revenue,
    });
  }

  const demoUser = store.users.find((u) => u.id === DEMO_USER_ID);
  const recommendedSuppliers: SupplierSummary[] = demoGetSupplierRecommendations(5);

  return {
    userName: demoUser?.name ?? null,
    stats: {
      totalRevenue: Math.round(sumRevenue(current) * 100) / 100,
      totalSales: current.length,
      totalProducts: products.length,
      lowStockProducts: lowStockProducts,
      revenueChange: Math.round(revenueChange * 10) / 10,
      salesChange: Math.round(salesChange * 10) / 10,
    },
    topProducts: topProducts.map((p) => ({
      id: p.id,
      name: p.name,
      imageLink: p.imageLink,
      category: p.category,
      totalSales: p.totalSales,
      totalRevenue: p.totalRevenue,
    })),
    recentSales: recentSales.map((s) => ({
      id: s.id,
      invoiceNumber: s.invoiceNumber,
      customerName: s.customerName ?? null,
      finalAmount: s.finalAmount,
      createdAt: s.createdAt.toISOString(),
      itemCount: s.itemCount,
    })),
    categorySales,
    dailySales: formattedDailySales,
    monthlySales: formattedMonthlySales,
    recommendedSuppliers,
  };
}
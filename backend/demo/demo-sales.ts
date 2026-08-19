import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import type {
  SalesListItem,
  SalesListResponse,
  SaleDetail,
  SaleItemDetail,
  SaleStats,
  CreateSaleInput,
  SalesQuery,
  SalesChartData,
  MonthlyTrend,
  ChartRange,
} from "@/backend/sales/sales";
import type {
  ProcurementRequestDetail,
  ProcurementRequestSummary,
  ProcurementRequestItemData,
} from "@/backend/procurement/procurement";

const DAY = 86400000;

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(-2);
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const d = now.getDate().toString().padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `INV-${y}${m}${d}-${rand}`;
}

function buyerBusinessName(buyerId: string | null): string | null {
  if (!buyerId) return null;
  const u = getDemoStore().users.find((x) => x.id === buyerId);
  return u?.businessName ?? null;
}

function serializeSaleItem(it: any): SaleItemDetail {
  const p = getDemoStore().products.find((x) => x.id === it.productId);
  return {
    id: it.id,
    productId: it.productId,
    productName: p?.name ?? "Unknown Product",
    productImage: p?.imageLink ?? null,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    totalPrice: it.totalPrice,
  };
}

function serializeSaleList(s: any, itemCount: number): SalesListItem {
  return {
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    customerName:
      s.buyerType === "PLATFORM_USER"
        ? buyerBusinessName(s.buyerId) ?? s.customerName
        : s.customerName,
    customerPhone: s.customerPhone,
    buyerType: s.buyerType,
    buyerId: s.buyerId,
    buyerBusinessName: buyerBusinessName(s.buyerId),
    totalAmount: s.totalAmount,
    discount: s.discount,
    finalAmount: s.finalAmount,
    paymentStatus: s.paymentStatus,
    paidAmount: s.paidAmount,
    dueAmount: s.dueAmount,
    orderStatus: s.orderStatus,
    itemCount,
    createdAt: s.createdAt.toISOString(),
  };
}

function countItems(saleId: string): number {
  return getDemoStore().saleItems.filter((it) => it.saleId === saleId).length;
}

export function demoListSales(query: SalesQuery = {}): SalesListResponse {
  const store = getDemoStore();
  const page = query.page || 1;
  const limit = query.limit || 20;
  const skip = (page - 1) * limit;

  let sales = store.sales.filter((s) => s.ownerId === DEMO_USER_ID);

  if (query.search) {
    const q = query.search.toLowerCase();
    sales = sales.filter(
      (s) =>
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.customerName?.toLowerCase().includes(q) ||
        s.customerPhone?.toLowerCase().includes(q),
    );
  }
  if (query.paymentStatus && query.paymentStatus !== "ALL")
    sales = sales.filter((s) => s.paymentStatus === query.paymentStatus);
  if (query.buyerType && query.buyerType !== "ALL")
    sales = sales.filter((s) => s.buyerType === query.buyerType);
  if (query.orderStatus && query.orderStatus !== "ALL")
    sales = sales.filter((s) => s.orderStatus === query.orderStatus);
  if (query.dateFrom) sales = sales.filter((s) => s.createdAt >= new Date(query.dateFrom as string));
  if (query.dateTo) sales = sales.filter((s) => s.createdAt <= new Date(query.dateTo as string));

  const now = Date.now();
  sales.sort((a, b) => {
    const aFuture = a.createdAt.getTime() > now ? 1 : 0;
    const bFuture = b.createdAt.getTime() > now ? 1 : 0;
    if (aFuture !== bFuture) return aFuture - bFuture;
    const dir = query.order === "asc" ? 1 : -1;
    if (query.sort === "finalAmount") return (a.finalAmount - b.finalAmount) * dir;
    if (query.sort === "customerName")
      return String(a.customerName ?? "").localeCompare(String(b.customerName ?? "")) * dir;
    return (b.createdAt.getTime() - a.createdAt.getTime()) * dir;
  });

  const total = sales.length;
  const pageSales = sales.slice(skip, skip + limit);

  return {
    sales: pageSales.map((s) => serializeSaleList(s, countItems(s.id))),
    total,
    totalPages: Math.ceil(total / limit),
    page,
  };
}

export function demoGetSale(id: string): SaleDetail | null {
  const store = getDemoStore();
  const sale = store.sales.find((s) => s.id === id && s.ownerId === DEMO_USER_ID);
  if (!sale) return null;
  const items = store.saleItems
    .filter((it) => it.saleId === id)
    .sort((a, b) => a.id.localeCompare(b.id));
  return {
    ...serializeSaleList(sale, items.length),
    items: items.map(serializeSaleItem),
    deliveryAddress: sale.deliveryAddress ?? null,
    deliveryDate: sale.deliveryDate ? sale.deliveryDate.toISOString() : null,
    notes: sale.notes ?? null,
  };
}

let demoSaleSeq = { n: 532 };

export function demoCreateSale(input: CreateSaleInput): SaleDetail | null {
  const store = getDemoStore();
  const id = `demo-s-${String(++demoSaleSeq.n).padStart(4, "0")}`;
  const now = new Date();

  const totalAmount = input.items.reduce((s, item) => s + item.quantity * item.unitPrice, 0);
  const discount = input.discount || 0;
  const finalAmount = totalAmount - discount;
  const paidAmount = input.paidAmount || 0;
  const dueAmount = finalAmount - paidAmount;

  const sale = {
    id,
    createdAt: now,
    updatedAt: now,
    ownerId: DEMO_USER_ID,
    invoiceNumber: generateInvoiceNumber(),
    customerName: input.buyerType === "PLATFORM_USER" ? null : input.customerName || null,
    customerPhone: input.customerPhone || null,
    buyerType: input.buyerType,
    buyerId: input.buyerType === "PLATFORM_USER" ? input.buyerId : null,
    totalAmount,
    discount,
    finalAmount,
    paymentStatus: dueAmount <= 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "UNPAID",
    paidAmount,
    dueAmount,
    orderStatus: "CONFIRMED",
    deliveryAddress: input.deliveryAddress || null,
    deliveryDate: input.deliveryDate ? new Date(input.deliveryDate) : null,
    notes: input.notes || null,
  };
  store.sales.push(sale);

  input.items.forEach((item, i) => {
    store.saleItems.push({
      id: `demo-si-${String(++demoSaleSeq.n).padStart(5, "0")}-x${i}`,
      saleId: id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
    });
    const product = store.products.find((p) => p.id === item.productId);
    if (product) {
      product.quantity = Math.max(0, product.quantity - item.quantity);
      product.updatedAt = now;
    }
  });

  return demoGetSale(id);
}

export function demoUpdateSalePayment(
  saleId: string,
  data: { paidAmount: number; paymentStatus?: string },
): boolean {
  const store = getDemoStore();
  const sale = store.sales.find((s) => s.id === saleId && s.ownerId === DEMO_USER_ID);
  if (!sale) return false;
  const dueAmount = sale.finalAmount - data.paidAmount;
  sale.paidAmount = data.paidAmount;
  sale.dueAmount = dueAmount;
  sale.paymentStatus =
    data.paymentStatus || (dueAmount <= 0 ? "PAID" : data.paidAmount > 0 ? "PARTIAL" : "UNPAID");
  sale.updatedAt = new Date();
  return true;
}

export function demoUpdateSaleOrderStatus(saleId: string, orderStatus: string): boolean {
  const store = getDemoStore();
  const sale = store.sales.find((s) => s.id === saleId && s.ownerId === DEMO_USER_ID);
  if (!sale) return false;
  sale.orderStatus = orderStatus;
  sale.updatedAt = new Date();
  return true;
}

export function demoDeleteSale(saleId: string): boolean {
  const store = getDemoStore();
  const idx = store.sales.findIndex((s) => s.id === saleId && s.ownerId === DEMO_USER_ID);
  if (idx === -1) return false;
  store.sales.splice(idx, 1);
  store.saleItems = store.saleItems.filter((it) => it.saleId !== saleId);
  return true;
}

export function demoGetSalesStats(): SaleStats {
  const store = getDemoStore();
  const sales = store.sales.filter((s) => s.ownerId === DEMO_USER_ID);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const sum = (list: any[], key: string) => list.reduce((s, x) => s + (x[key] ?? 0), 0);

  const today = sales.filter((s) => s.createdAt >= startOfToday);
  const month = sales.filter((s) => s.createdAt >= startOfMonth);

  return {
    totalSales: sales.length,
    totalRevenue: sum(sales, "finalAmount"),
    totalDue: sum(sales, "dueAmount"),
    totalPaid: sum(sales, "paidAmount"),
    avgSaleValue: sales.length > 0 ? sum(sales, "finalAmount") / sales.length : 0,
    salesToday: today.length,
    revenueToday: sum(today, "finalAmount"),
    salesThisMonth: month.length,
    revenueThisMonth: sum(month, "finalAmount"),
    paidCount: sales.filter((s) => s.paymentStatus === "PAID").length,
    unpaidCount: sales.filter((s) => s.paymentStatus === "UNPAID").length,
    partialCount: sales.filter((s) => s.paymentStatus === "PARTIAL").length,
    platformUserSales: sales.filter((s) => s.buyerType === "PLATFORM_USER").length,
    externalSales: sales.filter((s) => s.buyerType === "EXTERNAL").length,
  };
}

export function demoSearchPlatformUsers(query: string) {
  const store = getDemoStore();
  if (query.trim().length < 2) return [];
  const q = query.toLowerCase();
  return store.users
    .filter(
      (u) =>
        u.id !== DEMO_USER_ID &&
        (u.businessName?.toLowerCase().includes(q) ||
          u.name?.toLowerCase().includes(q) ||
          u.phone?.toLowerCase().includes(q)),
    )
    .slice(0, 10)
    .map((u) => ({
      id: u.id,
      name: u.name,
      businessName: u.businessName,
      phone: u.phone,
      profileImage: u.profileImage,
    }));
}

export function demoGetOwnerProducts() {
  const store = getDemoStore();
  return store.products
    .filter((p) => p.ownerId === DEMO_USER_ID && p.isActive)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((p) => ({
      id: p.id,
      name: p.name,
      sellingPrice: p.sellingPrice,
      quantity: p.quantity,
      unit: p.unit,
      imageLink: p.imageLink,
      category: p.category,
    }));
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthlyTrendFrom(rows: { year: number; month: number; revenue: number; sales: number }[], months: number) {
  const map = new Map<string, MonthlyTrend>();
  for (const row of rows) {
    map.set(`${row.year}-${row.month}`, {
      month: `${MONTH_NAMES[row.month - 1]} ${String(row.year).slice(-2)}`,
      revenue: row.revenue,
      sales: row.sales,
    });
  }
  const now = new Date();
  const result: MonthlyTrend[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setMonth(now.getMonth() - i);
    const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
    if (map.has(key)) result.push(map.get(key)!);
    else result.push({ month: `${MONTH_NAMES[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`, revenue: 0, sales: 0 });
  }
  return result;
}

export function demoGetSalesChartData(): SalesChartData {
  const store = getDemoStore();
  const sales = store.sales.filter((s) => s.ownerId === DEMO_USER_ID);
  const now = new Date();

  const twelveMonthsAgo = new Date(now);
  twelveMonthsAgo.setMonth(now.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const monthlyRows: { year: number; month: number; revenue: number; sales: number }[] = [];
  const monthlyAgg = new Map<string, { revenue: number; sales: number }>();
  sales.forEach((s) => {
    if (s.createdAt < twelveMonthsAgo) return;
    const key = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth() + 1}`;
    const entry = monthlyAgg.get(key) ?? { revenue: 0, sales: 0 };
    entry.revenue += s.finalAmount ?? 0;
    entry.sales += 1;
    monthlyAgg.set(key, entry);
  });
  monthlyAgg.forEach((v, k) => {
    const [y, m] = k.split("-").map(Number);
    monthlyRows.push({ year: y, month: m, revenue: v.revenue, sales: v.sales });
  });
  const monthlyTrend = monthlyTrendFrom(monthlyRows, 12);

  const paymentTotal = (status: string) =>
    sales.filter((s) => s.paymentStatus === status).reduce((sum, s) => sum + s.finalAmount, 0);
  const paymentDistribution = [
    { name: "Paid", value: paymentTotal("PAID"), color: "#10b981" },
    { name: "Partial", value: paymentTotal("PARTIAL"), color: "#f59e0b" },
    { name: "Unpaid", value: paymentTotal("UNPAID"), color: "#ef4444" },
  ].filter((d) => d.value > 0);

  const buyerTotal = (type: string) =>
    sales.filter((s) => s.buyerType === type).reduce((sum, s) => sum + s.finalAmount, 0);
  const buyerTypeDistribution = [
    { name: "Platform", value: buyerTotal("PLATFORM_USER"), color: "#3b82f6" },
    { name: "External", value: buyerTotal("EXTERNAL"), color: "#f59e0b" },
  ].filter((d) => d.value > 0);

  const dailyMap = new Map<string, number>();
  const thirtyDaysAgo = Date.now() - 29 * DAY;
  sales.forEach((s) => {
    if (s.createdAt.getTime() < thirtyDaysAgo) return;
    const key = s.createdAt.toISOString().split("T")[0];
    dailyMap.set(key, (dailyMap.get(key) ?? 0) + s.finalAmount);
  });
  const dailyRevenue: { date: string; revenue: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = d.toISOString().split("T")[0];
    dailyRevenue.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      revenue: dailyMap.get(key) ?? 0,
    });
  }

  return { monthlyTrend, paymentDistribution, buyerTypeDistribution, dailyRevenue };
}

export function demoGetSalesChartDataByRange(range: ChartRange): MonthlyTrend[] {
  const store = getDemoStore();
  const sales = store.sales.filter((s) => s.ownerId === DEMO_USER_ID);
  const now = new Date();
  const isDaily = range === "7d" || range === "30d";
  const days = range === "7d" ? 7 : 30;

  if (isDaily) {
    const start = Date.now() - (days - 1) * DAY;
    const dataMap = new Map<string, { revenue: number; sales: number }>();
    sales.forEach((s) => {
      if (s.createdAt.getTime() < start) return;
      const key = s.createdAt.toISOString().split("T")[0];
      const entry = dataMap.get(key) ?? { revenue: 0, sales: 0 };
      entry.revenue += s.finalAmount ?? 0;
      entry.sales += 1;
      dataMap.set(key, entry);
    });
    const result: MonthlyTrend[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const entry = dataMap.get(key);
      result.push({ month: label, revenue: entry?.revenue ?? 0, sales: entry?.sales ?? 0 });
    }
    return result;
  }

  const months = range === "3m" ? 3 : range === "6m" ? 6 : 12;
  const startMonth = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const agg = new Map<string, { revenue: number; sales: number }>();
  sales.forEach((s) => {
    if (s.createdAt < startMonth) return;
    const key = `${s.createdAt.getFullYear()}-${s.createdAt.getMonth() + 1}`;
    const entry = agg.get(key) ?? { revenue: 0, sales: 0 };
    entry.revenue += s.finalAmount ?? 0;
    entry.sales += 1;
    agg.set(key, entry);
  });
  const rows: { year: number; month: number; revenue: number; sales: number }[] = [];
  agg.forEach((v, k) => {
    const [y, m] = k.split("-").map(Number);
    rows.push({ year: y, month: m, revenue: v.revenue, sales: v.sales });
  });
  return monthlyTrendFrom(rows, months);
}

// ---------------------------------------------------------------------------
// Procurement
// ---------------------------------------------------------------------------

function procurementDetail(req: any): ProcurementRequestDetail {
  const store = getDemoStore();
  const buyer = store.users.find((u) => u.id === req.buyerId);
  const supplier = store.users.find((u) => u.id === req.supplierId);
  const sale = req.saleId ? store.sales.find((s) => s.id === req.saleId) : null;
  return {
    id: req.id,
    createdAt: req.createdAt.toISOString(),
    updatedAt: req.updatedAt.toISOString(),
    buyerId: req.buyerId,
    buyerName: buyer?.name ?? "Unknown",
    buyerBusinessName: buyer?.businessName ?? null,
    buyerImage: buyer?.profileImage ?? null,
    supplierId: req.supplierId,
    supplierName: supplier?.name ?? "Unknown",
    supplierBusinessName: supplier?.businessName ?? null,
    supplierImage: supplier?.profileImage ?? null,
    status: req.status,
    notes: req.notes ?? null,
    totalAmount: req.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    items: req.items.map((i: any): ProcurementRequestItemData => ({
      id: i.id,
      productId: i.productId,
      productName: i.productName,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
    })),
    saleId: sale?.id ?? null,
    saleInvoiceNumber: sale?.invoiceNumber ?? null,
  };
}

function procurementSummary(req: any, asBuyer: boolean): ProcurementRequestSummary {
  const store = getDemoStore();
  const counterparty = store.users.find((u) => u.id === (asBuyer ? req.supplierId : req.buyerId));
  return {
    id: req.id,
    createdAt: req.createdAt.toISOString(),
    status: req.status,
    counterpartyId: counterparty?.id ?? "",
    counterpartyName: counterparty?.name ?? "Unknown",
    counterpartyBusinessName: counterparty?.businessName ?? null,
    counterpartyImage: counterparty?.profileImage ?? null,
    itemCount: req.items.length,
    totalAmount: req.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    notes: req.notes ?? null,
    saleId: req.saleId ?? null,
  };
}

let demoProcSeq = { n: 5 };

export function demoCreateProcurementRequest(input: {
  supplierId: string;
  notes?: string;
  items: { productId: string; quantity: number }[];
}): ProcurementRequestDetail | null {
  const store = getDemoStore();
  const supplier = store.users.find((u) => u.id === input.supplierId && u.isActive);
  if (!supplier) return null;

  const items = input.items.map((item) => {
    const product = store.products.find(
      (p) => p.id === item.productId && p.ownerId === input.supplierId && p.isActive,
    );
    const unitPrice = product?.sellingPrice ?? 0;
    return {
      id: `demo-pri-${String(++demoProcSeq.n)}-x`,
      productId: item.productId,
      productName: product?.name ?? "Unknown Product",
      quantity: item.quantity,
      unitPrice,
      totalPrice: item.quantity * unitPrice,
    };
  });

  const now = new Date();
  const req = {
    id: `demo-pr-${String(++demoProcSeq.n)}`,
    createdAt: now,
    updatedAt: now,
    buyerId: DEMO_USER_ID,
    supplierId: input.supplierId,
    status: "PENDING",
    notes: input.notes || null,
    saleId: null,
    items,
  };
  store.procurement.push(req);
  return procurementDetail(req);
}

export function demoListSentRequests(limit?: number): ProcurementRequestSummary[] {
  const store = getDemoStore();
  return store.procurement
    .filter((r) => r.buyerId === DEMO_USER_ID)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit ?? 50)
    .map((r) => procurementSummary(r, true));
}

export function demoListReceivedRequests(limit?: number): ProcurementRequestSummary[] {
  const store = getDemoStore();
  return store.procurement
    .filter((r) => r.supplierId === DEMO_USER_ID)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit ?? 50)
    .map((r) => procurementSummary(r, false));
}

export function demoGetProcurementRequestDetail(id: string): ProcurementRequestDetail | null {
  const store = getDemoStore();
  const req = store.procurement.find(
    (r) => r.id === id && (r.buyerId === DEMO_USER_ID || r.supplierId === DEMO_USER_ID),
  );
  return req ? procurementDetail(req) : null;
}

export function demoAcceptProcurementRequest(id: string): ProcurementRequestDetail | null {
  const store = getDemoStore();
  const req = store.procurement.find((r) => r.id === id && r.supplierId === DEMO_USER_ID && r.status === "PENDING");
  if (!req) return null;

  req.status = "APPROVED";
  const now = new Date();
  req.updatedAt = now;

  const saleId = `demo-s-${String(store.sales.length + 1).padStart(4, "0")}-pr${Math.floor(Math.random() * 1000)}`;
  const sale = {
    id: saleId,
    createdAt: now,
    updatedAt: now,
    ownerId: DEMO_USER_ID,
    invoiceNumber: generateInvoiceNumber(),
    customerName: null,
    customerPhone: null,
    buyerType: "PLATFORM_USER",
    buyerId: req.buyerId,
    totalAmount: req.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    discount: 0,
    finalAmount: req.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    paymentStatus: "UNPAID",
    paidAmount: 0,
    dueAmount: req.items.reduce((s: number, i: any) => s + i.totalPrice, 0),
    orderStatus: "CONFIRMED",
    deliveryAddress: null,
    deliveryDate: null,
    notes: null,
  };
  store.sales.push(sale);
  req.saleId = saleId;

  req.items.forEach((item: any) => {
    store.saleItems.push({
      id: `demo-si-${Math.random().toString(36).slice(2, 10)}`,
      saleId,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    });
    const supplierProduct = store.products.find((p) => p.id === item.productId);
    if (supplierProduct) {
      supplierProduct.quantity = Math.max(0, supplierProduct.quantity - item.quantity);
    }
    const buyerProduct = store.products.find(
      (p) => p.ownerId === req.buyerId && p.name.toLowerCase() === item.productName.toLowerCase() && p.isActive,
    );
    if (buyerProduct) {
      buyerProduct.quantity += item.quantity;
    } else if (supplierProduct) {
      store.products.push({
        ...supplierProduct,
        id: `${req.buyerId}-p-${Math.random().toString(36).slice(2, 8)}`,
        ownerId: req.buyerId,
        supplierId: DEMO_USER_ID,
        quantity: item.quantity,
        createdAt: now,
        updatedAt: now,
        imageLink: supplierProduct.imageLink,
        costPrice: supplierProduct.costPrice,
        sellingPrice: item.unitPrice,
        isActive: true,
      });
    }
  });

  return procurementDetail(req);
}

export function demoRejectProcurementRequest(id: string): ProcurementRequestDetail | null {
  const store = getDemoStore();
  const req = store.procurement.find((r) => r.id === id && r.supplierId === DEMO_USER_ID && r.status === "PENDING");
  if (!req) return null;
  req.status = "REJECTED";
  req.updatedAt = new Date();
  return procurementDetail(req);
}

export function demoGetProcurementCounts(): { sentPending: number; receivedPending: number } {
  const store = getDemoStore();
  return {
    sentPending: store.procurement.filter((r) => r.buyerId === DEMO_USER_ID && r.status === "PENDING").length,
    receivedPending: store.procurement.filter((r) => r.supplierId === DEMO_USER_ID && r.status === "PENDING").length,
  };
}
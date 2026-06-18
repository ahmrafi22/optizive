"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import type { SalesListResponse, PaymentStatus, BuyerType, OrderStatus } from "./types";
import { listSales } from "@/backend/sales/sales";
import PaymentBadge from "./PaymentBadge";
import BuyerTypeBadge from "./BuyerTypeBadge";
import OrderStatusBadge from "./OrderStatusBadge";
import { LuSearch, LuArrowUpDown, LuChevronLeft, LuChevronRight, LuFilter } from "react-icons/lu";

interface Props {
  initialData: SalesListResponse | null;
}

type DateRange = "ALL" | "TODAY" | "LAST_7" | "LAST_30";

const DATE_RANGES: { key: DateRange; label: string }[] = [
  { key: "ALL", label: "All" },
  { key: "TODAY", label: "Today" },
  { key: "LAST_7", label: "Last 7 Days" },
  { key: "LAST_30", label: "Last 30 Days" },
];

const PAYMENT_FILTERS: (PaymentStatus | "ALL")[] = ["ALL", "PAID", "PARTIAL", "UNPAID"];
const BUYER_FILTERS: (BuyerType | "ALL")[] = ["ALL", "PLATFORM_USER", "EXTERNAL"];
const STATUS_FILTERS: (OrderStatus | "ALL")[] = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

export default function SalesListView({ initialData }: Props) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("ALL");
  const [paymentFilter, setPaymentFilter] = useState<PaymentStatus | "ALL">("ALL");
  const [buyerFilter, setBuyerFilter] = useState<BuyerType | "ALL">("ALL");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<"createdAt" | "finalAmount">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showFilters, setShowFilters] = useState(false);

  const fetchSales = useCallback(async () => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    if (dateRange === "TODAY") {
      dateFrom = todayStart.toISOString();
      dateTo = now.toISOString();
    } else if (dateRange === "LAST_7") {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 6);
      dateFrom = d.toISOString();
      dateTo = now.toISOString();
    } else if (dateRange === "LAST_30") {
      const d = new Date(todayStart);
      d.setDate(d.getDate() - 29);
      dateFrom = d.toISOString();
      dateTo = now.toISOString();
    }

    const result = await listSales({
      page,
      limit: 20,
      search: search || undefined,
      paymentStatus: paymentFilter === "ALL" ? undefined : paymentFilter,
      buyerType: buyerFilter === "ALL" ? undefined : buyerFilter,
      orderStatus: statusFilter === "ALL" ? undefined : statusFilter,
      dateFrom,
      dateTo,
      sort,
      order: sortOrder,
    });
    if (result) setData(result);
  }, [page, search, dateRange, paymentFilter, buyerFilter, statusFilter, sort, sortOrder]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  function toggleSort(field: "createdAt" | "finalAmount") {
    if (sort === field) {
      setSortOrder((o) => (o === "desc" ? "asc" : "desc"));
    } else {
      setSort(field);
      setSortOrder("desc");
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);
  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const absDays = Math.abs(Math.floor(diff / (1000 * 60 * 60 * 24)));
    if (diff >= 0) {
      if (absDays === 0) return "Today";
      if (absDays === 1) return "Yesterday";
      if (absDays < 7) return `${absDays}d ago`;
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const hasActiveFilters = dateRange !== "ALL" || paymentFilter !== "ALL" || buyerFilter !== "ALL" || statusFilter !== "ALL";

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-muted)" />
          <input
            type="text"
            placeholder="Search by invoice, customer, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) py-2.5 pl-10 pr-4 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
              showFilters || hasActiveFilters
                ? "border-(--clr-teal-dim) bg-(--clr-teal-dim)/10 text-(--clr-teal-dim)"
                : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg)"
            }`}
          >
            <LuFilter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-(--clr-teal-dim) text-[10px] font-bold text-white">
                {(dateRange !== "ALL" ? 1 : 0) + (paymentFilter !== "ALL" ? 1 : 0) + (buyerFilter !== "ALL" ? 1 : 0) + (statusFilter !== "ALL" ? 1 : 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Compact filter row */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-teal-500 mr-0.5">Date:</span>
        {DATE_RANGES.map((r) => (
          <button key={r.key} onClick={() => { setDateRange(r.key); setPage(1); }}
            className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
              dateRange === r.key
                ? "bg-teal-500 text-white"
                : "border border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-muted) hover:border-teal-500/30 hover:text-teal-600"
            }`}
          >{r.label}</button>
        ))}
        {showFilters && (
          <>
            <span className="w-px h-3.5 bg-(--clr-border)" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-500 mx-0.5">Payment:</span>
            {PAYMENT_FILTERS.map((f) => (
              <button key={f} onClick={() => { setPaymentFilter(f); setPage(1); }}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  paymentFilter === f
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "border border-transparent text-(--clr-fg-muted) hover:border-emerald-500/30 hover:text-emerald-600"
                }`}
              >{f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}</button>
            ))}
            <span className="w-px h-3.5 bg-(--clr-border)" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mx-0.5">Buyer:</span>
            {BUYER_FILTERS.map((f) => (
              <button key={f} onClick={() => { setBuyerFilter(f); setPage(1); }}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  buyerFilter === f
                    ? "bg-blue-500/10 text-blue-600"
                    : "border border-transparent text-(--clr-fg-muted) hover:border-blue-500/30 hover:text-blue-600"
                }`}
              >{f === "ALL" ? "All" : f === "PLATFORM_USER" ? "Platform" : "External"}</button>
            ))}
            <span className="w-px h-3.5 bg-(--clr-border)" />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mx-0.5">Status:</span>
            {STATUS_FILTERS.map((f) => (
              <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  statusFilter === f
                    ? "bg-amber-500/10 text-amber-600"
                    : "border border-transparent text-(--clr-fg-muted) hover:border-amber-500/30 hover:text-amber-600"
                }`}
              >{f === "ALL" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}</button>
            ))}
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-(--clr-border) bg-(--clr-surface)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-(--clr-border) bg-(--clr-surface2)/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Invoice</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Type</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted) cursor-pointer select-none" onClick={() => toggleSort("finalAmount")}>
                  <span className="inline-flex items-center gap-1">Amount <LuArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Payment</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted) cursor-pointer select-none" onClick={() => toggleSort("createdAt")}>
                  <span className="inline-flex items-center gap-1">Date <LuArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-(--clr-border)">
              {data?.sales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-(--clr-fg-muted)">
                    <div className="flex flex-col items-center gap-2">
                      <LuSearch className="h-8 w-8 opacity-40" />
                      <p className="font-medium">No sales found</p>
                      <p className="text-xs">Try adjusting your filters or create a new sale</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.sales.map((sale, i) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * i, duration: 0.3 }}
                    onClick={() => router.push(`/sales/${sale.id}`)}
                    className="group cursor-pointer hover:bg-(--clr-surface2)/40 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs font-semibold text-(--clr-teal-dim)">
                        {sale.invoiceNumber}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-(--clr-fg)">{sale.customerName || "Unknown"}</p>
                        {sale.customerPhone && <p className="text-xs text-(--clr-fg-muted)">{sale.customerPhone}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3"><BuyerTypeBadge type={sale.buyerType} /></td>
                    <td className="px-4 py-3 text-right font-semibold text-(--clr-fg)">{formatCurrency(sale.finalAmount)}</td>
                    <td className="px-4 py-3 text-center"><PaymentBadge status={sale.paymentStatus} /></td>
                    <td className="px-4 py-3 text-center"><OrderStatusBadge status={sale.orderStatus} /></td>
                    <td className="px-4 py-3 text-right text-xs text-(--clr-fg-muted) whitespace-nowrap">{formatDate(sale.createdAt)}</td>
                    <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}></td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-(--clr-border) px-4 py-3">
            <p className="text-xs text-(--clr-fg-muted)">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, data.total)} of {data.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-(--clr-border) p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface2) disabled:opacity-30 transition-all"
              >
                <LuChevronLeft className="h-4 w-4" />
              </button>
              {(() => {
                const MAX_VISIBLE = 5;
                let start = Math.max(1, page - Math.floor(MAX_VISIBLE / 2));
                let end = Math.min(data.totalPages, start + MAX_VISIBLE - 1);
                if (end - start + 1 < MAX_VISIBLE) {
                  start = Math.max(1, end - MAX_VISIBLE + 1);
                }
                const pages: number[] = [];
                for (let i = start; i <= end; i++) pages.push(i);
                return pages.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`min-w-[32px] rounded-lg px-2 py-1.5 text-xs font-medium transition-all ${
                      p === page ? "bg-(--clr-teal-dim) text-white" : "text-(--clr-fg-muted) hover:bg-(--clr-surface2)"
                    }`}
                  >{p}</button>
                ));
              })()}
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page >= data.totalPages}
                className="rounded-lg border border-(--clr-border) p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface2) disabled:opacity-30 transition-all"
              >
                <LuChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

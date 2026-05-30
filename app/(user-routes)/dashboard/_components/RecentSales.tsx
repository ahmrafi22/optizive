"use client";

import { motion } from "motion/react";
import { LuClock, LuUser, LuPackage } from "react-icons/lu";
import type { RecentSale } from "@/backend/dashboard/dashboard";

interface RecentSalesProps {
  sales: RecentSale[];
  delay?: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function RecentSales({ sales, delay = 0.48 }: RecentSalesProps) {
  const visibleSales = sales.slice(0, 5);

  if (sales.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.56, delay, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
      >
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Recent Sales
        </h2>
        <div className="flex h-56 items-center justify-center text-sm text-(--clr-fg-muted)">
          No sales yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay, ease: EASE_OUT }}
      className="relative space-y-3 overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Recent Sales
        </h2>
        <div className="rounded-full border border-(--clr-border) bg-(--clr-surface2)/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Latest 5
        </div>
      </div>

      <div className="relative z-10 space-y-2">
        {visibleSales.map((sale, index) => (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.45,
              delay: delay + 0.12 + index * 0.05,
              ease: EASE_OUT,
            }}
            className="flex items-center gap-3 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/30 px-2.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-(--clr-border-hover) hover:bg-(--clr-surface2)/65 hover:shadow-md"
          >
            {/* Icon */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/15 bg-emerald-400/10">
              <LuPackage className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Sale Info */}
            <div className="min-w-0 flex-1 leading-tight">
              <div className="mb-1 flex items-center gap-2">
                <p className="truncate text-sm font-semibold leading-tight text-(--clr-fg)">
                  {sale.invoiceNumber}
                </p>
                <span className="rounded-full bg-(--clr-surface2) px-2 py-0.5 text-xs leading-none text-(--clr-fg-muted)">
                  {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs leading-tight text-(--clr-fg-muted)">
                {sale.customerName && (
                  <div className="flex items-center gap-1">
                    <LuUser className="w-3 h-3" />
                    <span className="max-w-37.5 truncate">
                      {sale.customerName}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <LuClock className="w-3 h-3" />
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="shrink-0 text-right leading-tight">
              <p className="text-sm font-bold leading-tight text-(--clr-fg)">
                {formatCurrency(sale.finalAmount)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

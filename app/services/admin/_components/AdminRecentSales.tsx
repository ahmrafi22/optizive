"use client";

import { motion } from "motion/react";
import { LuPackage, LuUser } from "react-icons/lu";
import type { AdminRecentSale } from "@/backend/admin/admin";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

interface Props {
  sales: AdminRecentSale[];
}

export default function AdminRecentSales({ sales }: Props) {
  if (sales.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.56, delay: 0.16, ease: EASE_OUT }}
        className="rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
      >
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">Recent Platform Sales</h2>
        <div className="flex h-48 items-center justify-center text-sm text-(--clr-fg-muted)">No sales yet</div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay: 0.16, ease: EASE_OUT }}
      className="relative space-y-3 overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative z-10 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">Recent Platform Sales</h2>
        <div className="rounded-full border border-(--clr-border) bg-(--clr-surface2)/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-(--clr-fg-muted)">Latest 10</div>
      </div>
      <div className="relative z-10 space-y-2">
        {sales.map((sale, i) => (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 + 0.12 + i * 0.04, ease: EASE_OUT }}
            className="flex items-center gap-3 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/30 px-2.5 py-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-(--clr-border-hover) hover:bg-(--clr-surface2)/65 hover:shadow-md"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-400/15 bg-emerald-400/10">
              <LuPackage className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="mb-1 flex items-center gap-2">
                <p className="truncate text-sm font-semibold leading-tight text-(--clr-fg)">{sale.invoiceNumber}</p>
                <span className="rounded-full bg-(--clr-surface2) px-2 py-0.5 text-xs text-(--clr-fg-muted)">{sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-(--clr-fg-muted)">
                {sale.owner && (
                  <span className="flex items-center gap-1">
                    <LuUser className="h-3 w-3" />
                    <span className="max-w-36 truncate">{sale.owner.businessName ?? sale.owner.name}</span>
                  </span>
                )}
                <span>{formatDate(sale.createdAt)}</span>
              </div>
            </div>
            <div className="shrink-0 text-right leading-tight">
              <p className="text-sm font-bold leading-tight text-(--clr-fg)">{formatCurrency(sale.finalAmount)}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

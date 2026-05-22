"use client";

import { motion } from "motion/react";
import { LuClock, LuUser, LuPackage } from "react-icons/lu";
import type { RecentSale } from "@/backend/dashboard/dashboard";

interface RecentSalesProps {
  sales: RecentSale[];
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

export function RecentSales({ sales }: RecentSalesProps) {
  if (sales.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.7 }}
        className="bento-card bento-card-no-hover noise-overlay p-6"
      >
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-4">
          Recent Sales
        </h2>
        <div className="flex items-center justify-center h-64 text-sm text-(--clr-fg-muted)">
          No sales yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.7 }}
      className="bento-card bento-card-no-hover noise-overlay p-6 space-y-4"
    >
      <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
        Recent Sales
      </h2>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {sales.map((sale, index) => (
          <motion.div
            key={sale.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.8 + index * 0.05,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="flex items-center gap-3 p-3 rounded-xl border border-(--clr-border) hover:border-(--clr-border-hover) transition-all duration-200"
          >
            {/* Icon */}
            <div className="shrink-0 w-10 h-10 rounded-full bg-emerald-400/10 flex items-center justify-center">
              <LuPackage className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>

            {/* Sale Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-semibold text-(--clr-fg) truncate">
                  {sale.invoiceNumber}
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-(--clr-surface2) text-(--clr-fg-muted)">
                  {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-(--clr-fg-muted)">
                {sale.customerName && (
                  <div className="flex items-center gap-1">
                    <LuUser className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{sale.customerName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <LuClock className="w-3 h-3" />
                  <span>{formatDate(sale.createdAt)}</span>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="shrink-0 text-right">
              <p className="text-sm font-bold text-(--clr-fg)">
                {formatCurrency(sale.finalAmount)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

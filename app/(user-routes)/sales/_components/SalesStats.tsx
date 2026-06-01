"use client";

import { motion } from "framer-motion";
import type { SaleStats } from "./types";
import { LuDollarSign, LuShoppingCart, LuTrendingUp, LuWallet, LuUsers, LuReceipt, LuBanknote, LuCalendarDays } from "react-icons/lu";
import NumberFlow from "@number-flow/react";

interface Props {
  stats: SaleStats;
}

const cards = [
  { key: "totalRevenue", label: "Total Revenue", icon: LuDollarSign, color: "from-emerald-500 to-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  { key: "totalSales", label: "Total Sales", icon: LuShoppingCart, color: "from-blue-500 to-blue-600", bg: "bg-blue-50 dark:bg-blue-950/30" },
  { key: "totalDue", label: "Total Due", icon: LuWallet, color: "from-rose-500 to-rose-600", bg: "bg-rose-50 dark:bg-rose-950/30" },
  { key: "totalPaid", label: "Total Collected", icon: LuBanknote, color: "from-teal-500 to-teal-600", bg: "bg-teal-50 dark:bg-teal-950/30" },
  { key: "salesToday", label: "Today's Sales", icon: LuCalendarDays, color: "from-violet-500 to-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
  { key: "salesThisMonth", label: "This Month", icon: LuTrendingUp, color: "from-amber-500 to-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  { key: "platformUserSales", label: "Platform Sales", icon: LuUsers, color: "from-cyan-500 to-cyan-600", bg: "bg-cyan-50 dark:bg-cyan-950/30" },
  { key: "externalSales", label: "External Sales", icon: LuReceipt, color: "from-orange-500 to-orange-600", bg: "bg-orange-50 dark:bg-orange-950/30" },
];

export default function SalesStats({ stats }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const value = stats[card.key as keyof SaleStats] as number;
        const isCurrency = ["totalRevenue", "totalDue", "totalPaid", "revenueToday", "revenueThisMonth", "avgSaleValue"].includes(card.key);

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.4 }}
            className={`relative overflow-hidden rounded-xl border border-(--clr-border) p-3 ${card.bg}`}
          >
            <div className="flex items-center justify-between">
              <div className={`rounded-lg p-1.5 bg-gradient-to-br ${card.color} text-white shadow-sm`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <NumberFlow
                value={value}
                format={isCurrency ? { style: "currency", currency: "BDT", maximumFractionDigits: 0 } : { notation: "compact", maximumFractionDigits: 1 }}
                className="text-lg font-bold text-(--clr-fg)"
              />
              <p className="mt-0.5 text-[11px] text-(--clr-fg-muted) uppercase tracking-wider">{card.label}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

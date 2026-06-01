"use client";

import { motion } from "framer-motion";
import type { SaleStats } from "./types";
import { LuDollarSign, LuShoppingCart, LuTrendingUp, LuWallet, LuUsers, LuReceipt, LuBanknote, LuCalendarDays } from "react-icons/lu";
import NumberFlow from "@number-flow/react";

interface Props {
  stats: SaleStats;
}

const cards = [
  { key: "totalRevenue", label: "Total Revenue", icon: LuDollarSign, bgColor: "bg-emerald-400/10", textColor: "text-emerald-600 dark:text-emerald-400", blurColor: "from-emerald-400/20 to-emerald-600/10" },
  { key: "totalSales", label: "Total Sales", icon: LuShoppingCart, bgColor: "bg-blue-400/10", textColor: "text-blue-600 dark:text-blue-400", blurColor: "from-blue-400/20 to-blue-600/10" },
  { key: "totalDue", label: "Total Due", icon: LuWallet, bgColor: "bg-rose-400/10", textColor: "text-rose-600 dark:text-rose-400", blurColor: "from-rose-400/20 to-rose-600/10" },
  { key: "totalPaid", label: "Total Collected", icon: LuBanknote, bgColor: "bg-teal-400/10", textColor: "text-teal-600 dark:text-teal-400", blurColor: "from-teal-400/20 to-teal-600/10" },
  { key: "salesToday", label: "Today's Sales", icon: LuCalendarDays, bgColor: "bg-violet-400/10", textColor: "text-violet-600 dark:text-violet-400", blurColor: "from-violet-400/20 to-violet-600/10" },
  { key: "salesThisMonth", label: "This Month", icon: LuTrendingUp, bgColor: "bg-amber-400/10", textColor: "text-amber-600 dark:text-amber-400", blurColor: "from-amber-400/20 to-amber-600/10" },
  { key: "platformUserSales", label: "Platform Sales", icon: LuUsers, bgColor: "bg-cyan-400/10", textColor: "text-cyan-600 dark:text-cyan-400", blurColor: "from-cyan-400/20 to-cyan-600/10" },
  { key: "externalSales", label: "External Sales", icon: LuReceipt, bgColor: "bg-orange-400/10", textColor: "text-orange-600 dark:text-orange-400", blurColor: "from-orange-400/20 to-orange-600/10" },
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.05 * i,
              duration: 0.5,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="group relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-(--clr-border-hover) hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
          >
            <div
              className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${card.blurColor} blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
            />
            <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Icon className="h-28 w-28" />
            </div>
            <div className="relative z-10">
              <div className="mb-3 flex items-center justify-between">
                <div className={`rounded-xl border border-white/10 p-2 shadow-inner ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.textColor}`} />
                </div>
              </div>
              <div className="space-y-1">
                <NumberFlow
                  value={value}
                  format={isCurrency ? { style: "currency", currency: "BDT", maximumFractionDigits: 0 } : { notation: "compact", maximumFractionDigits: 1 }}
                  className="text-xl font-bold tabular-nums text-(--clr-fg)"
                />
                <p className="text-[11px] font-medium tracking-[0.08em] text-(--clr-fg-muted) uppercase">{card.label}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

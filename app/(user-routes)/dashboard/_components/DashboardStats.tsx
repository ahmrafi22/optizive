"use client";

import { motion } from "motion/react";
import {
  LuTrendingUp,
  LuTrendingDown,
  LuDollarSign,
  LuShoppingCart,
  LuPackage,
  LuTriangleAlert,
} from "react-icons/lu";
import type { DashboardStats as Stats } from "@/backend/dashboard/dashboard";

interface DashboardStatsProps {
  stats: Stats;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: LuDollarSign,
      color: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-400/10",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Sales",
      value: stats.totalSales.toString(),
      change: stats.salesChange,
      icon: LuShoppingCart,
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-400/10",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      change: null,
      icon: LuPackage,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-400/10",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts.toString(),
      change: null,
      icon: LuTriangleAlert,
      color: "from-amber-400 to-orange-500",
      bgColor: "bg-amber-400/10",
      textColor: "text-amber-600 dark:text-amber-400",
      alert: stats.lowStockProducts > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change !== null && card.change >= 0;
        const delay = index * 0.12;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ y: -4, scale: 1.01 }}
            transition={{
              duration: 0.58,
              delay,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="group relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-colors duration-300 hover:border-(--clr-border-hover) dark:shadow-[0_16px_50px_rgba(0,0,0,0.18)]"
          >
            <div className="noise-overlay absolute inset-0" />
            <div
              className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-linear-to-br ${card.color} opacity-8 blur-2xl transition-opacity duration-500 group-hover:opacity-15`}
            />
            <div className="absolute -right-5 -top-5 opacity-[0.04] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
              <Icon className="h-32 w-32" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <motion.div
                  initial={{ scale: 0, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    duration: 0.48,
                    delay: delay + 0.18,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className={`rounded-2xl border border-white/10 p-2.5 shadow-inner ${card.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </motion.div>
                {card.change !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: delay + 0.28,
                    }}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isPositive
                        ? "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-400/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <LuTrendingUp className="h-3 w-3" />
                    ) : (
                      <LuTrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(card.change).toFixed(1)}%
                  </motion.div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.44,
                  delay: delay + 0.38,
                }}
                className="space-y-1 leading-tight"
              >
                <p className="text-xs uppercase leading-tight tracking-[0.18em] text-(--clr-fg-muted)">
                  {card.title}
                </p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-(--clr-fg)">
                  {card.value}
                </p>
                {card.change !== null && (
                  <p className="text-[10px] leading-tight text-(--clr-fg-muted)">
                    vs previous 30 days
                  </p>
                )}
                {card.alert && (
                  <p className="text-[10px] font-medium leading-tight text-amber-600 dark:text-amber-400">
                    Requires attention
                  </p>
                )}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

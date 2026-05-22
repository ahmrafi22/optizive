"use client";

import { motion } from "motion/react";
import { LuTrendingUp, LuTrendingDown, LuDollarSign, LuShoppingCart, LuPackage, LuTriangleAlert } from "react-icons/lu";
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card, index) => {
        const Icon = card.icon;
        const isPositive = card.change !== null && card.change >= 0;
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              delay: index * 0.1,
              ease: [0.23, 1, 0.32, 1],
            }}
            className="bento-card bento-card-no-hover noise-overlay p-5 relative overflow-hidden"
          >
            {/* Background gradient icon */}
            <div className="absolute -right-4 -top-4 opacity-5">
              <Icon className="w-32 h-32" />
            </div>

            {/* Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.1 + 0.2,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className={`p-2.5 rounded-xl ${card.bgColor}`}
                >
                  <Icon className={`w-5 h-5 ${card.textColor}`} />
                </motion.div>
                {card.change !== null && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.1 + 0.3,
                    }}
                    className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                      isPositive
                        ? "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-rose-400/10 text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isPositive ? (
                      <LuTrendingUp className="w-3 h-3" />
                    ) : (
                      <LuTrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(card.change).toFixed(1)}%
                  </motion.div>
                )}
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  duration: 0.4,
                  delay: index * 0.1 + 0.4,
                }}
                className="space-y-1"
              >
                <p className="text-xs uppercase tracking-widest text-(--clr-fg-muted)">
                  {card.title}
                </p>
                <p className="text-2xl font-bold text-(--clr-fg)">{card.value}</p>
                {card.change !== null && (
                  <p className="text-[10px] text-(--clr-fg-muted)">
                    vs previous 30 days
                  </p>
                )}
                {card.alert && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
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

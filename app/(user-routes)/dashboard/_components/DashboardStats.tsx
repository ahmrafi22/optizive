"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
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

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const compactFormat: Format = {
  notation: "compact",
  compactDisplay: "short",
  roundingMode: "trunc",
};
const currencyFormat: Format = {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
};
const numberTiming = {
  duration: 900,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
};
const numberOpacityTiming = {
  duration: 720,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
};

function StatValue({
  value,
  format,
  delayMs,
}: {
  value: number;
  format?: Format;
  delayMs: number;
}) {
  const [ready, setReady] = useState(false);
  const [flowValue, setFlowValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!ready) {
      setFlowValue(0);
      hasAnimatedRef.current = false;
      return;
    }

    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const frame = window.requestAnimationFrame(() => {
        setFlowValue(value);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    setFlowValue(value);
  }, [ready, value]);

  return (
    <NumberFlow
      willChange
      plugins={[continuous]}
      value={flowValue}
      format={format ?? compactFormat}
      locales="en-US"
      animated={ready}
      transformTiming={numberTiming}
      spinTiming={numberTiming}
      opacityTiming={numberOpacityTiming}
    />
  );
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Revenue",
      value: stats.totalRevenue,
      format: currencyFormat,
      change: stats.revenueChange,
      icon: LuDollarSign,
      color: "from-emerald-400 to-teal-500",
      bgColor: "bg-emerald-400/10",
      textColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Total Sales",
      value: stats.totalSales,
      change: stats.salesChange,
      icon: LuShoppingCart,
      color: "from-blue-400 to-cyan-500",
      bgColor: "bg-blue-400/10",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Total Products",
      value: stats.totalProducts,
      change: null,
      icon: LuPackage,
      color: "from-purple-400 to-pink-500",
      bgColor: "bg-purple-400/10",
      textColor: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Low Stock Items",
      value: stats.lowStockProducts,
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
        const delay = index * 0.08;
        const numberDelayMs = Math.round((delay + 0.56) * 1000);

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.56,
              delay,
              ease: EASE_OUT,
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
                <div
                  className={`rounded-2xl border border-white/10 p-2.5 shadow-inner ${card.bgColor}`}
                >
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                {card.change !== null && (
                  <div
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
                  </div>
                )}
              </div>

              <div className="space-y-1 leading-tight">
                <p className="text-xs uppercase leading-tight tracking-[0.18em] text-(--clr-fg-muted)">
                  {card.title}
                </p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-(--clr-fg)">
                  <StatValue
                    value={card.value}
                    format={card.format}
                    delayMs={numberDelayMs}
                  />
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
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
import { LuUsers, LuUserCheck, LuUserX, LuTruck, LuStore, LuDollarSign, LuShoppingCart, LuPackage, LuTriangleAlert, LuActivity } from "react-icons/lu";
import type { AdminStats } from "@/backend/admin/admin";

interface AdminStatsProps {
  stats: AdminStats;
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const compactFormat: Format = { notation: "compact", compactDisplay: "short", roundingMode: "trunc" };
const currencyFormat: Format = { style: "currency", currency: "BDT", maximumFractionDigits: 0 };
const numberTiming = { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
const numberOpacityTiming = { duration: 720, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

function StatValue({ value, format, delayMs }: { value: number; format?: Format; delayMs: number }) {
  const [ready, setReady] = useState(false);
  const [flowValue, setFlowValue] = useState(0);
  const hasAnimatedRef = useRef(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);
  useEffect(() => {
    if (!ready) { setFlowValue(0); hasAnimatedRef.current = false; return; }
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const frame = window.requestAnimationFrame(() => setFlowValue(value));
      return () => window.cancelAnimationFrame(frame);
    }
    setFlowValue(value);
  }, [ready, value]);
  return (
    <NumberFlow
      willChange plugins={[continuous]}
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

export default function AdminStatsGrid({ stats }: AdminStatsProps) {
  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: LuUsers, color: "from-blue-400 to-cyan-500", bgColor: "bg-blue-400/10", textColor: "text-blue-600 dark:text-blue-400" },
    { title: "Onboarded", value: stats.totalOnboarded, icon: LuUserCheck, color: "from-emerald-400 to-teal-500", bgColor: "bg-emerald-400/10", textColor: "text-emerald-600 dark:text-emerald-400" },
    { title: "Banned", value: stats.totalBanned, icon: LuUserX, color: "from-rose-400 to-red-500", bgColor: "bg-rose-400/10", textColor: "text-rose-600 dark:text-rose-400" },
    { title: "Active (7d)", value: stats.activeUsers, icon: LuActivity, color: "from-violet-400 to-purple-500", bgColor: "bg-violet-400/10", textColor: "text-violet-600 dark:text-violet-400" },
    { title: "Suppliers", value: stats.totalSuppliers, icon: LuTruck, color: "from-amber-400 to-orange-500", bgColor: "bg-amber-400/10", textColor: "text-amber-600 dark:text-amber-400" },
    { title: "Store Owners", value: stats.totalStoreOwners, icon: LuStore, color: "from-pink-400 to-rose-500", bgColor: "bg-pink-400/10", textColor: "text-pink-600 dark:text-pink-400" },
    { title: "Revenue", value: stats.totalRevenue, icon: LuDollarSign, format: currencyFormat, color: "from-emerald-400 to-green-500", bgColor: "bg-emerald-400/10", textColor: "text-emerald-600 dark:text-emerald-400" },
    { title: "Total Sales", value: stats.totalSales, icon: LuShoppingCart, color: "from-blue-400 to-indigo-500", bgColor: "bg-blue-400/10", textColor: "text-blue-600 dark:text-blue-400" },
    { title: "Products", value: stats.totalProducts, icon: LuPackage, color: "from-purple-400 to-pink-500", bgColor: "bg-purple-400/10", textColor: "text-purple-600 dark:text-purple-400" },
    { title: "Low Stock", value: stats.lowStockProducts, icon: LuTriangleAlert, color: "from-amber-400 to-orange-500", bgColor: "bg-amber-400/10", textColor: "text-amber-600 dark:text-amber-400", alert: stats.lowStockProducts > 0 },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((card, i) => {
        const Icon = card.icon;
        const delay = i * 0.06;
        const numberDelayMs = Math.round((delay + 0.56) * 1000);
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.56, delay, ease: EASE_OUT }}
            className="group relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_12px_40px_rgba(0,0,0,0.04)] transition-colors duration-300 hover:border-(--clr-border-hover) dark:shadow-[0_16px_50px_rgba(0,0,0,0.18)]"
          >
            <div className="noise-overlay absolute inset-0" />
            <div className={`absolute -right-10 -top-10 h-28 w-28 rounded-full bg-linear-to-br ${card.color} opacity-8 blur-2xl transition-opacity duration-500 group-hover:opacity-15`} />
            <div className="relative z-10">
              <div className="mb-4 flex items-center justify-between">
                <div className={`rounded-2xl border border-white/10 p-2.5 shadow-inner ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
              </div>
              <div className="space-y-1 leading-tight">
                <p className="text-xs uppercase leading-tight tracking-[0.18em] text-(--clr-fg-muted)">{card.title}</p>
                <p className="text-3xl font-bold leading-tight tracking-tight text-(--clr-fg)">
                  <StatValue value={card.value} format={card.format} delayMs={numberDelayMs} />
                </p>
                {card.alert && <p className="text-[10px] font-medium leading-tight text-amber-600 dark:text-amber-400">Requires attention</p>}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

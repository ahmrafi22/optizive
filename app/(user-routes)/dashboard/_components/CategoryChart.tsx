"use client";

import { motion } from "motion/react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { CategorySales } from "@/backend/dashboard/dashboard";

interface CategoryChartProps {
  data: CategorySales[];
  delay?: number;
  chartAnimationDelay?: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCategory(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function CategoryChart({
  data,
  delay = 1.1,
  chartAnimationDelay = 1500,
}: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay }}
        className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
      >
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Sales by Category
        </h2>
        <div className="flex h-56 items-center justify-center text-sm text-(--clr-fg-muted)">
          No category data available
        </div>
      </motion.div>
    );
  }

  // Format data for chart
  const chartData = data.slice(0, 8).map((item) => ({
    category: formatCategory(item.category),
    sales: item.sales,
    revenue: item.revenue,
  }));

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.68, delay, ease: [0.23, 1, 0.32, 1] }}
      className="relative space-y-5 overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-6 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: delay + 0.12 }}
          className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)"
        >
          Sales by Category
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: delay + 0.2 }}
          className="sm:text-right"
        >
          <p className="text-2xl font-bold leading-tight text-(--clr-fg)">
            {formatCurrency(totalRevenue)}
          </p>
          <p className="mt-0.5 text-xs leading-tight text-(--clr-fg-muted)">
            Total Revenue (Last 30 Days)
          </p>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: 0.55,
          delay: delay + 0.42,
          ease: [0.23, 1, 0.32, 1],
        }}
        className="relative z-10 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/35 px-2 pb-1 pt-2"
      >
        <ChartContainer initialDimension={{ width: 600, height: 460 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 22, right: 18, left: -2, bottom: 6 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--clr-border)"
                vertical={false}
              />

              <XAxis
                dataKey="category"
                stroke="var(--clr-fg-muted)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                dy={8}
                interval={0}
                tickFormatter={(value) =>
                  String(value).length > 9
                    ? `${String(value).slice(0, 9)}…`
                    : String(value)
                }
                height={32}
              />

              <YAxis
                stroke="var(--clr-fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dx={-8}
              />

              <Tooltip
                content={({ active, payload, label }) => (
                  <ChartTooltipContent
                    active={active}
                    payload={payload?.map((p) => ({
                      ...p,
                      name: p.dataKey === "sales" ? "Units Sold" : "Revenue",
                      value:
                        p.dataKey === "sales"
                          ? `${p.value} units`
                          : formatCurrency(p.value as number),
                    }))}
                    label={label === undefined ? undefined : String(label)}
                    indicator="square"
                  />
                )}
              />

              <Bar
                dataKey="revenue"
                fill="#fff44f"
                radius={[12, 12, 3, 3]}
                barSize={74}
                name="Revenue"
                isAnimationActive={true}
                animationBegin={chartAnimationDelay}
                animationDuration={1900}
                animationEasing="ease-in-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>

      <div className="relative z-10 flex items-center gap-2">
        <div className="h-2 w-2 rounded-sm bg-primary" />
        <span className="text-xs text-(--clr-fg-muted)">
          Revenue by Category
        </span>
      </div>
    </motion.div>
  );
}

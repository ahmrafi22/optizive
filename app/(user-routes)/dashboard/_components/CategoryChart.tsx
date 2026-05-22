"use client";

import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { CategorySales } from "@/backend/dashboard/dashboard";

interface CategoryChartProps {
  data: CategorySales[];
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

export function CategoryChart({ data }: CategoryChartProps) {
  if (data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="bento-card bento-card-no-hover noise-overlay p-6"
      >
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-4">
          Sales by Category
        </h2>
        <div className="flex items-center justify-center h-64 text-sm text-(--clr-fg-muted)">
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
      transition={{ duration: 0.6, delay: 0.6 }}
      className="bento-card bento-card-no-hover noise-overlay p-6 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-2"
          >
            Sales by Category
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="text-2xl font-bold text-(--clr-fg)"
          >
            {formatCurrency(totalRevenue)}
          </motion.p>
          <p className="text-xs text-(--clr-fg-muted)">Total Revenue (Last 30 Days)</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <ChartContainer initialDimension={{ width: 600, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />

              <XAxis
                dataKey="category"
                stroke="var(--clr-fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
                angle={-45}
                textAnchor="end"
                height={80}
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
                    label={label}
                    indicator="square"
                  />
                )}
              />

              <Bar
                dataKey="revenue"
                fill="#fff44f"
                radius={[4, 4, 0, 0]}
                name="Revenue"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>

      <div className="flex items-center gap-2">
        <div className="h-2 w-2 rounded-sm bg-primary" />
        <span className="text-xs text-(--clr-fg-muted)">Revenue by Category</span>
      </div>
    </motion.div>
  );
}

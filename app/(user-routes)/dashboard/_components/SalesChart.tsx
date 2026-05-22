"use client";

import { motion } from "motion/react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { DailySales } from "@/backend/dashboard/dashboard";

interface SalesChartProps {
  data: DailySales[];
  title: string;
  showRevenue?: boolean;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

export function SalesChart({ data, title, showRevenue = true }: SalesChartProps) {
  // Format data for display
  const chartData = data.map((d) => {
    const date = new Date(d.date);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    
    return {
      date: label,
      sales: d.sales,
      revenue: d.revenue,
    };
  });

  const totalSales = data.reduce((sum, d) => sum + d.sales, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: 0.4,
        ease: [0.23, 1, 0.32, 1],
      }}
      className="bento-card bento-card-no-hover noise-overlay p-6 space-y-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-2"
          >
            {title}
          </motion.h2>
          <div className="flex items-baseline gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.6 }}
            >
              <p className="text-2xl font-bold text-(--clr-fg)">{totalSales}</p>
              <p className="text-xs text-(--clr-fg-muted)">Total Sales</p>
            </motion.div>
            {showRevenue && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.7 }}
              >
                <p className="text-2xl font-bold text-(--clr-fg)">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-(--clr-fg-muted)">Total Revenue</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.8 }}
      >
        <ChartContainer initialDimension={{ width: 800, height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGradientDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fff44f" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#fff44f" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="revenueGradientDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />

              <XAxis
                dataKey="date"
                stroke="var(--clr-fg-muted)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                dy={8}
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
                      name: p.dataKey === "sales" ? "Sales" : "Revenue",
                      value:
                        p.dataKey === "sales"
                          ? `${p.value} orders`
                          : formatCurrency(p.value as number),
                    }))}
                    label={label}
                    indicator="square"
                  />
                )}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#fff44f"
                strokeWidth={2}
                fill="url(#salesGradientDash)"
                name="Sales"
              />

              {showRevenue && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  fill="url(#revenueGradientDash)"
                  name="Revenue"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </motion.div>

      <div className="flex items-center gap-6 pt-2">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-xs text-(--clr-fg-muted)">Sales</span>
        </div>
        {showRevenue && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#4ecdc4]" />
            <span className="text-xs text-(--clr-fg-muted)">Revenue</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

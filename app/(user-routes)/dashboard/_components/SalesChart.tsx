"use client";

import { useEffect, useId, useRef, useState } from "react";
import { motion } from "motion/react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import type { DailySales } from "@/backend/dashboard/dashboard";

interface SalesChartProps {
  data: DailySales[];
  title: string;
  showRevenue?: boolean;
  delay?: number;
  chartAnimationDelay?: number;
  chartHeight?: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const integerFormat: Format = {
  maximumFractionDigits: 0,
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

function MetricValue({
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
      format={format ?? integerFormat}
      locales="en-US"
      animated={ready}
      transformTiming={numberTiming}
      spinTiming={numberTiming}
      opacityTiming={numberOpacityTiming}
    />
  );
}

export function SalesChart({
  data,
  title,
  showRevenue = true,
  delay = 0.24,
  chartAnimationDelay = 650,
  chartHeight = 280,
}: SalesChartProps) {
  const numberDelayMs = Math.round((delay + 0.24) * 1000);
  const chartId = useId().replace(/[^a-zA-Z0-9]/g, "");
  const salesGradientId = `salesGradientDash-${chartId}`;
  const revenueGradientId = `revenueGradientDash-${chartId}`;

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
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay, ease: EASE_OUT }}
      className="relative space-y-4 overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)] sm:p-6"
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <h2 className="max-w-60 text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          {title}
        </h2>

        <div className="flex flex-wrap items-start gap-4 sm:justify-end sm:text-right">
          <div className="min-w-24">
            <p className="text-2xl font-bold leading-tight text-(--clr-fg)">
              <MetricValue value={totalSales} delayMs={numberDelayMs} />
            </p>
            <p className="mt-0.5 text-xs leading-tight text-(--clr-fg-muted)">
              Total Sales
            </p>
          </div>

          {showRevenue && (
            <div className="min-w-32">
              <p className="text-2xl font-bold leading-tight text-(--clr-fg)">
                <MetricValue
                  value={totalRevenue}
                  format={currencyFormat}
                  delayMs={numberDelayMs}
                />
              </p>
              <p className="mt-0.5 text-xs leading-tight text-(--clr-fg-muted)">
                Total Revenue
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/35 px-2 pb-1 pt-2">
        <ChartContainer initialDimension={{ width: 800, height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient
                  id={salesGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#fff44f" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#fff44f" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient
                  id={revenueGradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.32} />
                  <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--clr-border)"
                vertical={false}
              />

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
                    label={label === undefined ? undefined : String(label)}
                    indicator="square"
                  />
                )}
              />

              <Area
                type="monotone"
                dataKey="sales"
                stroke="#fff44f"
                strokeWidth={2.5}
                fill={`url(#${salesGradientId})`}
                name="Sales"
                isAnimationActive={true}
                animationBegin={chartAnimationDelay}
                animationDuration={1500}
                animationEasing="ease-out"
              />

              {showRevenue && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4ecdc4"
                  strokeWidth={2.5}
                  fill={`url(#${revenueGradientId})`}
                  name="Revenue"
                  isAnimationActive={true}
                  animationBegin={chartAnimationDelay + 260}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      <div className="relative z-10 flex items-center gap-6">
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

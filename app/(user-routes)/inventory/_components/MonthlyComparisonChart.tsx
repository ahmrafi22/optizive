"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { getProductMonthlyComparison, type MonthlyComparisonData } from "@/backend/inventory/inventory";

interface MonthlyComparisonChartProps {
  productId: string;
  className?: string;
}

export function MonthlyComparisonChart({ productId, className }: MonthlyComparisonChartProps) {
  const [comparisonData, setComparisonData] = useState<MonthlyComparisonData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getProductMonthlyComparison(productId, 6); // 6 months
        setComparisonData(data);
      } catch (error) {
        console.error("Failed to fetch comparison data:", error);
        setComparisonData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  const hasData = comparisonData.some(d => d.current > 0 || d.previous > 0);

  if (loading) {
    return (
      <div className={`bento-card noise-overlay p-5 space-y-4 ${className || ""}`}>
        <div className="h-4 w-48 bg-(--clr-surface2) animate-pulse rounded" />
        <div className="h-64 bg-(--clr-surface2) animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className={`bento-card noise-overlay p-5 space-y-4 ${className || ""}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
          Monthly Comparison (6 Months)
        </h2>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-(--clr-fg-muted)">
          No sales data available for comparison
        </div>
      ) : (
        <>
          <ChartContainer initialDimension={{ width: 600, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="var(--clr-border)"
                  vertical={false}
                />
                
                <XAxis
                  dataKey="month"
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
                        name: p.dataKey === "current" ? "This Year" : "Last Year",
                        value: `${p.value} units`,
                      }))}
                      label={label}
                      indicator="square"
                    />
                  )}
                />
                
                <Bar
                  dataKey="previous"
                  fill="var(--clr-fg-muted)"
                  opacity={0.4}
                  radius={[4, 4, 0, 0]}
                  name="Last Year"
                />
                
                <Bar
                  dataKey="current"
                  fill="#fff44f"
                  radius={[4, 4, 0, 0]}
                  name="This Year"
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-sm bg-primary" />
              <span className="text-xs text-(--clr-fg-muted)">This Year</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-sm opacity-40" style={{ background: "var(--clr-fg-muted)" }} />
              <span className="text-xs text-(--clr-fg-muted)">Last Year</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

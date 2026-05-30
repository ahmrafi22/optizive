"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { formatCurrency } from "./types";
import { getProductSalesHistory, type ProductSalesData } from "@/backend/inventory/inventory";

interface SalesHistoryChartProps {
  productId: string;
  productName: string;
  className?: string;
}

export function SalesHistoryChart({ productId, productName, className }: SalesHistoryChartProps) {
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getProductSalesHistory(productId, 30); // 30 days
        setSalesData(data);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
        setSalesData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [productId]);

  // Format data for display - group by week for better visualization
  const chartData = useMemo(() => {
    if (salesData.length === 0) return [];

    // Group by week (every 7 days)
    const weeks: Array<{ date: string; sales: number; revenue: number }> = [];
    
    for (let i = 0; i < salesData.length; i += 7) {
      const weekData = salesData.slice(i, i + 7);
      const totalSales = weekData.reduce((sum, d) => sum + d.sales, 0);
      const totalRevenue = weekData.reduce((sum, d) => sum + d.revenue, 0);
      
      // Use the last day of the week as the label
      const lastDay = weekData[weekData.length - 1];
      const date = new Date(lastDay.date);
      const label = `${date.getMonth() + 1}/${date.getDate()}`;
      
      weeks.push({
        date: label,
        sales: totalSales,
        revenue: totalRevenue,
      });
    }

    return weeks;
  }, [salesData]);

  const hasData = salesData.some(d => d.sales > 0);

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
          Sales History (30 Days)
        </h2>
      </div>

      {!hasData ? (
        <div className="h-64 flex items-center justify-center text-sm text-(--clr-fg-muted)">
          No sales data available for this product
        </div>
      ) : (
        <>
          <ChartContainer initialDimension={{ width: 600, height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fff44f" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#fff44f" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0} />
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
                  tickFormatter={(value) => `${value}`}
                />
                
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltipContent
                      active={active}
                      payload={payload?.map((p) => ({
                        ...p,
                        name: p.dataKey === "sales" ? "Units Sold" : "Revenue",
                        value: p.dataKey === "sales" ? p.value : formatCurrency(p.value as number),
                      }))}
                       label={String(label ?? "")}
                      indicator="square"
                    />
                  )}
                />
                
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#fff44f"
                  strokeWidth={2}
                  fill="url(#salesGradient)"
                  name="Units Sold"
                />
                
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                  name="Revenue"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-xs text-(--clr-fg-muted)">Units Sold</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#4ecdc4]" />
              <span className="text-xs text-(--clr-fg-muted)">Revenue</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

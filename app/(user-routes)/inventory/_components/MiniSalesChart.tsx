"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { getProductSalesHistory, type ProductSalesData } from "@/backend/inventory/inventory";

interface MiniSalesChartProps {
  productId: string;
  className?: string;
}

export function MiniSalesChart({ productId, className }: MiniSalesChartProps) {
  const [salesData, setSalesData] = useState<ProductSalesData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const data = await getProductSalesHistory(productId, 30); // 1 month = 30 days
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

  // Calculate trend (positive or negative)
  const trend = useMemo(() => {
    if (salesData.length < 2) return 0;
    
    const midPoint = Math.floor(salesData.length / 2);
    const firstHalf = salesData.slice(0, midPoint);
    const secondHalf = salesData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, d) => sum + d.sales, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, d) => sum + d.sales, 0) / secondHalf.length;
    
    if (firstHalfAvg === 0) return secondHalfAvg > 0 ? 100 : 0;
    
    return ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
  }, [salesData]);

  const isPositive = trend >= 0;
  const hasData = salesData.some(d => d.sales > 0);

  // Transform data for chart
  const chartData = useMemo(() => 
    salesData.map(d => ({ value: d.sales })),
    [salesData]
  );

  if (loading) {
    return (
      <div className={`relative ${className || ""}`}>
        <div className="h-[60px] bg-(--clr-surface2) animate-pulse rounded" />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className={`relative ${className || ""}`}>
        <div className="h-[60px] flex items-center justify-center text-[10px] text-(--clr-fg-muted)">
          No sales data
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className || ""}`}>
      <div className="absolute top-0 right-0 z-10">
        <div
          className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${
            isPositive
              ? "bg-emerald-400/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-400/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {isPositive ? "↗" : "↘"} {Math.abs(trend).toFixed(0)}%
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={60}>
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id={`miniGradient-${productId}`} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={isPositive ? "#34d399" : "#f87171"}
                stopOpacity={0.3}
              />
              <stop
                offset="95%"
                stopColor={isPositive ? "#34d399" : "#f87171"}
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={isPositive ? "#34d399" : "#f87171"}
            strokeWidth={1.5}
            fill={`url(#miniGradient-${productId})`}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

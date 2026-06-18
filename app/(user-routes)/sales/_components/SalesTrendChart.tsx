"use client";

import { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NumberFlow from "@number-flow/react";
import type { MonthlyTrend, ChartRange } from "@/backend/sales/sales";
import { getSalesChartDataByRange } from "@/backend/sales/sales";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);

const RANGES: { key: ChartRange; label: string }[] = [
  { key: "7d", label: "7D" },
  { key: "30d", label: "30D" },
  { key: "3m", label: "3M" },
  { key: "6m", label: "6M" },
  { key: "1y", label: "1Y" },
];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-(--clr-fg) mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-6 text-xs">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-semibold text-(--clr-fg)">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function SalesTrendChart({ data: initialData }: { data: MonthlyTrend[] }) {
  const [range, setRange] = useState<ChartRange>("30d");
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getSalesChartDataByRange(range).then((result) => {
      if (result) setData(result);
      setLoading(false);
    });
  }, [range]);

  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
  const totalSales = data.reduce((s, d) => s + d.sales, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Revenue Trend</h3>
          <div className="mt-1 flex items-baseline gap-3">
            <NumberFlow value={totalRevenue} format={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }}
              className="text-xl font-bold text-(--clr-fg)" />
            <span className="text-xs text-(--clr-fg-muted)">{totalSales} sales</span>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-(--clr-border) bg-(--clr-surface2)/50 p-0.5">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                range === r.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 dark:text-gray-500 dark:hover:text-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-(--clr-surface)/60 rounded-lg">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-(--clr-border) border-t-(--clr-fg)" />
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: "var(--clr-fg-muted)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "var(--clr-fg-muted)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} width={36} />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--clr-border)", strokeDasharray: "3 3" }} />
            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revenueGrad)" name="Revenue" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

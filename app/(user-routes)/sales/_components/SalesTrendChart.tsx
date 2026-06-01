"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import NumberFlow from "@number-flow/react";
import type { MonthlyTrend } from "@/backend/sales/sales";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);

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

export default function SalesTrendChart({ data }: { data: MonthlyTrend[] }) {
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
        <div className="flex items-center gap-3 text-xs text-(--clr-fg-muted)">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#3b82f6]" /> Revenue</span>
        </div>
      </div>
      <div className="flex-1 min-h-0">
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

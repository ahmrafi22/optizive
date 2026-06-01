"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import NumberFlow from "@number-flow/react";
import type { DistributionItem } from "@/backend/sales/sales";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);

export default function SalesDistributionChart({
  paymentData,
  buyerData,
}: {
  paymentData: DistributionItem[];
  buyerData: DistributionItem[];
}) {
  const totalPayment = paymentData.reduce((s, d) => s + d.value, 0);
  const totalBuyer = buyerData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex h-full flex-col rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Distribution</h3>
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Payment donut */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={paymentData} cx="50%" cy="50%" innerRadius={32} outerRadius={54} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {paymentData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-(--clr-fg-muted) leading-tight">Total</span>
              <NumberFlow value={totalPayment} format={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }}
                className="text-[11px] font-bold text-(--clr-fg)" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {paymentData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-(--clr-fg-muted)">{d.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Buyer type donut */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <div className="relative" style={{ width: 120, height: 120 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={buyerData} cx="50%" cy="50%" innerRadius={32} outerRadius={54} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {buyerData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-(--clr-fg-muted) leading-tight">Total</span>
              <NumberFlow value={totalBuyer} format={{ style: "currency", currency: "BDT", maximumFractionDigits: 0 }}
                className="text-[11px] font-bold text-(--clr-fg)" />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {buyerData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-(--clr-fg-muted)">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

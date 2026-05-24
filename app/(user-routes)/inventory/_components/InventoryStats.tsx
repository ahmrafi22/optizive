"use client";

import { useEffect, useRef, useState } from "react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";

import { type InventoryStats as InventoryStatsShape } from "./types";

const compactFormat: Format = {
  notation: "compact",
  compactDisplay: "short",
  roundingMode: "trunc",
};

const currencyFormat: Format = {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
};

const slowTiming = {
  duration: 950,
  easing: "cubic-bezier(0.23, 1, 0.32, 1)",
};

function StatCard({
  label,
  value,
  hint,
  format,
}: {
  label: string;
  value: number;
  hint: string;
  format?: Format;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const hasSeededRef = useRef(false);
  const renderValue =
    !hasSeededRef.current && value !== 0 && displayValue === 0 ? value * 0.92 : displayValue;

  useEffect(() => {
    if (!hasSeededRef.current) {
      if (value === 0) {
        setDisplayValue(0);
        return;
      }

      hasSeededRef.current = true;
      const seedValue = value * 0.92;
      setDisplayValue(seedValue);

      const frame = window.requestAnimationFrame(() => {
        setDisplayValue(value);
      });

      return () => window.cancelAnimationFrame(frame);
    }

    setDisplayValue(value);
  }, [value]);

  return (
    <div className="bento-card noise-overlay p-4 md:p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-(--clr-fg)">
        <NumberFlow
          willChange
          plugins={[continuous]}
          value={renderValue}
          format={format ?? compactFormat}
          locales="en-US"
          transformTiming={slowTiming}
          spinTiming={slowTiming}
          opacityTiming={{ duration: 750, easing: "cubic-bezier(0.23, 1, 0.32, 1)" }}
        />
      </div>
      <div className="mt-1 text-xs text-(--clr-fg-muted)">{hint}</div>
    </div>
  );
}

export function InventoryStats({
  stats,
}: {
  stats: InventoryStatsShape;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total products"
        value={stats.totalProducts}
        hint="All inventory items"
      />
      <StatCard
        label="Low stock"
        value={stats.lowStock}
        hint="Needs replenishment soon"
      />
      <StatCard
        label="Out of stock"
        value={stats.outOfStock}
        hint="Unavailable right now"
      />
      <StatCard
        label="Inventory value"
        value={stats.totalValue}
        format={currencyFormat}
        hint="Total worth of stock"
      />
    </section>
  );
}

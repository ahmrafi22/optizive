"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { LuTrendingUp } from "react-icons/lu";
import type { TopProduct } from "@/backend/dashboard/dashboard";
import { CATEGORY_PALETTES } from "@/app/(user-routes)/inventory/_components/types";

interface TopProductsProps {
  products: TopProduct[];
  delay?: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "BDT",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatCategory(value: string | null) {
  if (!value) return "Uncategorized";
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export function TopProducts({ products, delay = 0.32 }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.56, delay, ease: EASE_OUT }}
        className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
      >
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Top Selling Products
        </h2>
        <div className="flex h-56 items-center justify-center text-sm text-(--clr-fg-muted)">
          No sales data available yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay, ease: EASE_OUT }}
      className="relative space-y-4 overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-5 shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
    >
      <div className="noise-overlay absolute inset-0" />
      <div className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
          Top Selling Products
        </h2>
        <div className="flex items-center gap-1 text-xs leading-none text-(--clr-fg-muted)">
          <LuTrendingUp className="w-3 h-3" />
          Last 30 days
        </div>
      </div>

      <div className="relative z-10 space-y-2.5">
        {products.map((product, index) => {
          const palette =
            CATEGORY_PALETTES[product.category ?? "OTHER"] ??
            CATEGORY_PALETTES.OTHER;

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.45,
                delay: delay + 0.12 + index * 0.05,
                ease: EASE_OUT,
              }}
            >
              <Link
                href={`/inventory/${product.id}`}
                className="group flex items-center gap-3 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/30 p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-(--clr-border-hover) hover:bg-(--clr-surface2)/65 hover:shadow-md"
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface)">
                  <span className="text-sm font-bold text-(--clr-fg-muted)">
                    #{index + 1}
                  </span>
                </div>

                {/* Product Image */}
                <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-(--clr-border) shadow-sm">
                  {product.imageLink ? (
                    <img
                      src={product.imageLink}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div
                      className="h-full w-full"
                      style={{
                        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                      }}
                    />
                  )}
                </div>

                {/* Product Info */}
                <div className="min-w-0 flex-1 leading-tight">
                  <h3 className="truncate text-sm font-semibold leading-tight text-(--clr-fg) transition-colors group-hover:text-primary">
                    {product.name}
                  </h3>
                  <p className="mt-0.5 text-xs leading-tight text-(--clr-fg-muted)">
                    {formatCategory(product.category)}
                  </p>
                </div>

                {/* Sales Stats */}
                <div className="shrink-0 text-right leading-tight">
                  <p className="text-sm font-bold leading-tight text-(--clr-fg)">
                    {product.totalSales} units
                  </p>
                  <p className="mt-0.5 text-xs leading-tight text-(--clr-fg-muted)">
                    {formatCurrency(product.totalRevenue)}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

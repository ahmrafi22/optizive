"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { LuTrendingUp } from "react-icons/lu";
import type { TopProduct } from "@/backend/dashboard/dashboard";
import { CATEGORY_PALETTES } from "@/app/(user-routes)/inventory/_components/types";

interface TopProductsProps {
  products: TopProduct[];
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

export function TopProducts({ products }: TopProductsProps) {
  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="bento-card bento-card-no-hover noise-overlay p-6"
      >
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-4">
          Top Selling Products
        </h2>
        <div className="flex items-center justify-center h-64 text-sm text-(--clr-fg-muted)">
          No sales data available yet
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="bento-card bento-card-no-hover noise-overlay p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
          Top Selling Products
        </h2>
        <div className="flex items-center gap-1 text-xs text-(--clr-fg-muted)">
          <LuTrendingUp className="w-3 h-3" />
          Last 30 days
        </div>
      </div>

      <div className="space-y-3">
        {products.map((product, index) => {
          const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
          
          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.6 + index * 0.1,
                ease: [0.23, 1, 0.32, 1],
              }}
            >
              <Link
                href={`/inventory/${product.id}`}
                className="flex items-center gap-4 p-3 rounded-xl border border-(--clr-border) hover:border-(--clr-border-hover) transition-all duration-200 hover:shadow-md group"
              >
                {/* Rank */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-(--clr-surface2) flex items-center justify-center">
                  <span className="text-sm font-bold text-(--clr-fg-muted)">#{index + 1}</span>
                </div>

                {/* Product Image */}
                <div className="shrink-0 w-12 h-12 rounded-lg overflow-hidden border border-(--clr-border)">
                  {product.imageLink ? (
                    <img
                      src={product.imageLink}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{
                        background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                      }}
                    />
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-(--clr-fg) truncate group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-(--clr-fg-muted)">
                    {formatCategory(product.category)}
                  </p>
                </div>

                {/* Sales Stats */}
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-(--clr-fg)">
                    {product.totalSales} units
                  </p>
                  <p className="text-xs text-(--clr-fg-muted)">
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

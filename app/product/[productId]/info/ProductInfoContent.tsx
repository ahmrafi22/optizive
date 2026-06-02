"use client";

import { LuPackage } from "react-icons/lu";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { PublicProduct, PublicSalesData } from "@/backend/inventory/public";
import {
  CATEGORY_PALETTES,
  EXPIRY_BADGES,
  EXPIRY_LABELS,
  formatCategory,
  formatCurrency,
  formatDate,
  formatExpiryDate,
} from "@/app/(user-routes)/inventory/_components/types";
import { StockBadge } from "@/app/(user-routes)/inventory/_components/StockBadge";

interface ProductInfoContentProps {
  product: PublicProduct;
  salesData: PublicSalesData[];
}

export function ProductInfoContent({ product, salesData }: ProductInfoContentProps) {
  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
  const stockRatio =
    product.minStock && product.minStock > 0
      ? Math.min(product.quantity / product.minStock, 3)
      : null;
  const marginPercent =
    product.costPrice > 0
      ? (((product.sellingPrice - product.costPrice) / product.costPrice) * 100).toFixed(1)
      : null;

  const totalSales = salesData.reduce((sum, d) => sum + d.sales, 0);
  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);

  const chartData = salesData.map((d) => {
    const date = new Date(d.date);
    return {
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      sales: d.sales,
      revenue: d.revenue,
    };
  });

  const hasSalesData = salesData.some((d) => d.sales > 0);

  return (
    <div className="space-y-6">
      {/* Product Card */}
      <div className="bento-card bento-card-no-hover noise-overlay overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-80 lg:w-96 aspect-square md:aspect-auto md:min-h-80 relative">
            <img
              src={product.imageLink || ""}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{ display: product.imageLink ? "block" : "none" }}
            />
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                display: product.imageLink ? "none" : "block",
              }}
            />
          </div>

          <div className="flex-1 p-6 md:p-8 space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1 text-xs text-(--clr-fg-muted)">
                  {formatCategory(product.category)}
                </span>
                <StockBadge status={product.stockStatus} />
              </div>
              <h1 className="text-2xl md:text-3xl font-naston text-(--clr-fg)">
                {product.name}
              </h1>
            </div>

            <p className="text-sm text-(--clr-fg-muted) leading-relaxed">
              {product.description || "No description added yet."}
            </p>

            {product.sku || product.barcode ? (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-(--clr-fg-muted)">
                {product.sku && (
                  <div>
                    <span className="uppercase tracking-widest">SKU</span>
                    <p className="mt-0.5 text-sm font-medium text-(--clr-fg)">{product.sku}</p>
                  </div>
                )}
                {product.barcode && (
                  <div>
                    <span className="uppercase tracking-widest">Barcode</span>
                    <p className="mt-0.5 text-sm font-medium text-(--clr-fg)">{product.barcode}</p>
                  </div>
                )}
              </div>
            ) : null}

            <div className="flex items-center gap-2 text-xs text-(--clr-fg-muted)">
              <span>Created {formatDate(product.createdAt)}</span>
              <span className="opacity-30">&middot;</span>
              <span>Updated {formatDate(product.updatedAt)}</span>
            </div>

            {product.expiryDate && (
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${EXPIRY_BADGES[product.expiryStatus]}`}
                >
                  {EXPIRY_LABELS[product.expiryStatus]}
                </span>
                <span className="text-xs text-(--clr-fg-muted)">
                  {product.daysUntilExpiry !== null
                    ? product.daysUntilExpiry > 0
                      ? `${product.daysUntilExpiry} days remaining`
                      : `${Math.abs(product.daysUntilExpiry)} days overdue`
                    : ""}
                </span>
              </div>
            )}

            {/* Owner */}
            <div className="flex items-center gap-3 pt-2 border-t border-(--clr-border)">
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-(--clr-border) bg-(--clr-surface2)">
                {product.owner.profileImage ? (
                  <img
                    src={product.owner.profileImage}
                    alt={product.owner.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xs font-bold text-(--clr-fg-muted)">
                    {product.owner.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-(--clr-fg) leading-tight">
                  {product.owner.businessName || product.owner.name}
                </p>
                <p className="text-[11px] text-(--clr-fg-muted)">Product Owner</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pricing */}
        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
            Pricing
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Selling Price</span>
              <span className="text-lg font-semibold text-(--clr-fg)">
                {formatCurrency(product.sellingPrice)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Cost Price</span>
              <span className="text-lg font-semibold text-(--clr-fg)">
                {formatCurrency(product.costPrice)}
              </span>
            </div>
            <div className="border-t border-(--clr-border) pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--clr-fg-muted)">Margin</span>
                <span className="text-lg font-semibold text-emerald-400">
                  {formatCurrency(product.margin)}
                </span>
              </div>
              {marginPercent && (
                <div className="text-right text-xs text-(--clr-fg-muted) mt-0.5">
                  {marginPercent}% margin
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stock */}
        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
            Stock
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Quantity</span>
              <span className="text-lg font-semibold text-(--clr-fg)">
                {product.quantity}{" "}
                <span className="text-sm text-(--clr-fg-muted)">{product.unit}</span>
              </span>
            </div>
            {product.minStock !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--clr-fg-muted)">Min Stock</span>
                <span className="text-lg font-semibold text-(--clr-fg)">
                  {product.minStock}{" "}
                  <span className="text-sm text-(--clr-fg-muted)">{product.unit}</span>
                </span>
              </div>
            )}
            {stockRatio !== null && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs text-(--clr-fg-muted) mb-1.5">
                  <span>Stock level</span>
                  <span>{(stockRatio * 100).toFixed(0)}% of min</span>
                </div>
                <div className="h-1.5 rounded-full bg-(--clr-surface2) overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(stockRatio * 100, 100)}%`,
                      background:
                        stockRatio < 0.5
                          ? "var(--clr-danger, #f87171)"
                          : stockRatio < 1
                            ? "var(--clr-warning, #fbbf24)"
                            : "var(--clr-success, #34d399)",
                    }}
                  />
                </div>
              </div>
            )}
            <div className="border-t border-(--clr-border) pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--clr-fg-muted)">Inventory Value</span>
                <span className="text-lg font-semibold text-(--clr-fg)">
                  {formatCurrency(product.value)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Expiry */}
        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
            Expiry
          </h2>
          {product.expiryDate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    background:
                      product.daysUntilExpiry !== null && product.daysUntilExpiry <= 7
                        ? "#f8717120"
                        : "#34d39920",
                    color:
                      product.daysUntilExpiry !== null && product.daysUntilExpiry <= 7
                        ? "#f87171"
                        : "#34d399",
                  }}
                >
                  <LuPackage />
                </div>
                <div>
                  <div className="text-lg font-semibold text-(--clr-fg)">
                    {formatExpiryDate(product.expiryDate)}
                  </div>
                  <div className="text-xs text-(--clr-fg-muted)">
                    {product.batchNumber ?? "No batch"}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-(--clr-fg-muted)">Days remaining</span>
                  <span
                    className="font-bold"
                    style={{
                      color:
                        product.daysUntilExpiry !== null
                          ? product.daysUntilExpiry <= 0
                            ? "#f87171"
                            : product.daysUntilExpiry <= 7
                              ? "#fb923c"
                              : product.daysUntilExpiry <= 30
                                ? "#fbbf24"
                                : "#34d399"
                          : "var(--clr-fg-muted)",
                    }}
                  >
                    {product.daysUntilExpiry !== null
                      ? product.daysUntilExpiry > 0
                        ? `${product.daysUntilExpiry} days`
                        : `${Math.abs(product.daysUntilExpiry)} days overdue`
                      : "N/A"}
                  </span>
                </div>
                {product.daysUntilExpiry !== null && (
                  <div className="h-2 rounded-full bg-(--clr-surface2) overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(2, Math.min(100, ((product.daysUntilExpiry > 0 ? product.daysUntilExpiry : 0) / 90) * 100))}%`,
                        background:
                          product.daysUntilExpiry <= 0
                            ? "#f87171"
                            : product.daysUntilExpiry <= 7
                              ? "#fb923c"
                              : product.daysUntilExpiry <= 30
                                ? "#fbbf24"
                                : "#34d399",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-(--clr-fg-muted)">Status</span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${EXPIRY_BADGES[product.expiryStatus]}`}
                >
                  {EXPIRY_LABELS[product.expiryStatus]}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg text-(--clr-fg-dim) bg-(--clr-surface2)">
                <LuPackage />
              </div>
              <p className="mt-3 text-sm font-medium text-(--clr-fg-muted)">No expiry date</p>
              <p className="mt-0.5 text-xs text-(--clr-fg-dim)">This product does not expire</p>
            </div>
          )}
        </div>
      </div>

      {/* 7-Day Sales */}
      <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
            Last 7 Days Sales
          </h2>
        </div>

        {!hasSalesData ? (
          <div className="h-48 flex items-center justify-center text-sm text-(--clr-fg-muted)">
            No sales data available for this product
          </div>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="publicSalesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#fff44f" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#fff44f" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="publicRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4ecdc4" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#4ecdc4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--clr-border)" vertical={false} />
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
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) px-3 py-2 shadow-lg text-xs">
                          <p className="text-(--clr-fg-muted) mb-1">{label}</p>
                          {payload.map((p, i) => (
                            <p key={i} className="font-semibold text-(--clr-fg)">
                              {p.dataKey === "sales"
                                ? `${p.value} units`
                                : formatCurrency(p.value as number)}
                            </p>
                          ))}
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#fff44f"
                    strokeWidth={2}
                    fill="url(#publicSalesGradient)"
                    name="Units Sold"
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#4ecdc4"
                    strokeWidth={2}
                    fill="url(#publicRevenueGradient)"
                    name="Revenue"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-(--clr-border)">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-(--clr-fg-muted)">
                  Total Sold
                </p>
                <p className="mt-1 text-lg font-semibold text-(--clr-fg)">{totalSales}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-widest text-(--clr-fg-muted)">
                  Revenue
                </p>
                <p className="mt-1 text-lg font-semibold text-(--clr-fg)">
                  {formatCurrency(totalRevenue)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-xs text-(--clr-fg-muted)">Units</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-[#4ecdc4]" />
                  <span className="text-xs text-(--clr-fg-muted)">Revenue</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

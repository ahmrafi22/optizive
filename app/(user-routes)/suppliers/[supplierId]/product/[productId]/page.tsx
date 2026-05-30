"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LuPackage,
  LuStar,
  LuMapPin,
  LuCircleCheck,
  LuCircleX,
  LuTriangleAlert,
  LuClock,
  LuBarcode,
  LuHash,
  LuTrendingUp,
  LuShoppingCart,
  LuTruck,
} from "react-icons/lu";
import { getSupplierProductDetail, type PublicProductDetail } from "@/backend/supplier-recommender/supplier-recommender";
import { CATEGORY_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateStr));
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export default function SupplierProductPage() {
  const { supplierId, productId } = useParams<{ supplierId: string; productId: string }>();
  const [product, setProduct] = useState<PublicProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const result = await getSupplierProductDetail(productId);
        if (!result) {
          setError("Product not found or no longer available.");
          return;
        }
        if (result.supplierId !== supplierId) {
          setError("This product does not belong to this supplier.");
          return;
        }
        setProduct(result);
      } catch (err) {
        setError((err as Error).message ?? "Failed to load product.");
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId, supplierId]);

  function getStockStatus(qty: number): { label: string; color: string; icon: typeof LuCircleCheck } {
    if (qty <= 0) return { label: "Out of Stock", color: "text-rose-500", icon: LuCircleX };
    if (qty <= 25) return { label: "Low Stock", color: "text-amber-500", icon: LuTriangleAlert };
    return { label: "In Stock", color: "text-emerald-500", icon: LuCircleCheck };
  }

  function getStockHealth(qty: number): { label: string; color: string; pct: number } {
    if (qty <= 0) return { label: "Empty", color: "#ef4444", pct: 0 };
    if (qty <= 25) return { label: "Limited", color: "#f59e0b", pct: 25 };
    if (qty <= 100) return { label: "Moderate", color: "#10b981", pct: 55 };
    if (qty <= 500) return { label: "Plentiful", color: "#10b981", pct: 80 };
    return { label: "Bulk Ready", color: "#06b6d4", pct: 100 };
  }

  function getExpiryStatus(dateStr: string | null): { label: string; color: string } {
    if (!dateStr) return { label: "No Expiry", color: "text-neutral-500" };
    const days = Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days <= 0) return { label: `Expired ${Math.abs(days)}d ago`, color: "text-rose-500" };
    if (days <= 7) return { label: `${days}d left`, color: "text-orange-500" };
    if (days <= 30) return { label: `${days}d left`, color: "text-amber-500" };
    return { label: formatDate(dateStr), color: "text-emerald-500" };
  }

  function getStockCoverageDays(qty: number, sold30: number): { label: string; desc: string; days: number | null } {
    if (sold30 <= 0 || qty <= 0) return { label: "—", desc: "No recent sales to estimate coverage", days: null };
    const dailyRate = sold30 / 30;
    const days = Math.round(qty / dailyRate);
    if (days >= 60) return { label: "Surplus", desc: `Stock will last ${days} days at current sales rate`, days };
    if (days >= 30) return { label: "Healthy", desc: `Stock will last ${days} days at current sales rate`, days };
    if (days >= 14) return { label: "Moderate", desc: `${days} days of stock — reorder planned within 2 weeks`, days };
    if (days >= 7) return { label: "Low", desc: `${days} days of stock — reorder advised soon`, days };
    return { label: "Critical", desc: `Only ${days} days of stock remaining — order urgently`, days };
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-[45%] aspect-[4/3] rounded-3xl bg-neutral-800/50 animate-pulse" />
          <div className="flex-1 space-y-5">
            <div className="h-5 w-32 bg-neutral-800/50 rounded-full animate-pulse" />
            <div className="h-10 w-3/4 bg-neutral-800/50 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-800/50 rounded animate-pulse" />
            <div className="h-4 w-2/3 bg-neutral-800/50 rounded animate-pulse" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-neutral-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
            <div className="h-28 bg-neutral-800/50 rounded-2xl animate-pulse" />
            <div className="h-20 bg-neutral-800/50 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
            <LuPackage className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-200">{error ?? "Product not found"}</h3>
          <Link
            href={`/suppliers/${supplierId}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all"
          >
            &larr; Back to Supplier
          </Link>
        </div>
      </div>
    );
  }

  const stockStatus = getStockStatus(product.quantity);
  const StatusIcon = stockStatus.icon;
  const health = getStockHealth(product.quantity);
  const expiry = getExpiryStatus(product.expiryDate);
  const coverage = getStockCoverageDays(product.quantity, product.salesLast30Days);
  const hasSalesData = product.salesLast30Days > 0;

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      {/* ── Hero ── */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Image */}
        <div className="w-full lg:w-[45%]">
          <div className="aspect-[4/3] rounded-3xl border border-neutral-800 overflow-hidden bg-neutral-900 relative">
            {product.imageLink ? (
              <img
                src={product.imageLink}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <LuPackage className="h-24 w-24 text-neutral-700" />
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-center gap-5">
          <div className="flex flex-wrap items-center gap-2.5">
            {product.category && (
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1 text-xs text-neutral-400">
                {CATEGORY_LABELS.get(product.category) ?? product.category}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium ${stockStatus.color === "text-rose-500" ? "border-rose-500/30 bg-rose-500/10" : stockStatus.color === "text-amber-500" ? "border-amber-500/30 bg-amber-500/10" : "border-emerald-500/30 bg-emerald-500/10"} ${stockStatus.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {stockStatus.label}
            </span>
            {!product.isActive && (
              <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3.5 py-1 text-xs font-medium text-rose-500">
                Inactive
              </span>
            )}
          </div>

          <div>
            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-naston text-white leading-tight">{product.name}</h1>
            {product.description && (
              <p className="mt-3 text-sm text-neutral-400 leading-relaxed max-w-lg">{product.description}</p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-4xl lg:text-5xl font-bold text-yellow-400 tracking-tight">{CURRENCY_FORMATTER.format(product.sellingPrice)}</span>
            {product.unit && <span className="text-sm text-neutral-500">/ {product.unit}</span>}
          </div>
        </div>
      </div>

      {/* ── Quick Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
        {/* Stock */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Stock</span>
            <LuShoppingCart className="h-4 w-4 text-neutral-500" />
          </div>
          <p className="text-2xl font-bold text-white">{product.quantity} <span className="text-sm font-normal text-neutral-500">{product.unit}</span></p>
          <div className="mt-3 h-1.5 rounded-full bg-neutral-800 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${health.pct}%`, backgroundColor: health.color }} />
          </div>
          <p className="mt-1.5 text-xs text-neutral-500">{health.label}</p>
        </div>

        {/* Expiry */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Expiry</span>
            <LuClock className="h-4 w-4 text-neutral-500" />
          </div>
          {product.expiryDate ? (
            <>
              <p className="text-2xl font-bold text-white">{formatDate(product.expiryDate)}</p>
              <span className={`mt-2 inline-flex items-center rounded-full px-3 py-0.5 text-xs font-medium ${expiry.color.includes("rose") ? "bg-rose-500/10 text-rose-500" : expiry.color.includes("orange") ? "bg-orange-500/10 text-orange-500" : expiry.color.includes("amber") ? "bg-amber-500/10 text-amber-500" : expiry.color.includes("emerald") ? "bg-emerald-500/10 text-emerald-500" : "bg-neutral-800 text-neutral-400"}`}>
                {expiry.label}
              </span>
              {product.batchNumber && (
                <p className="mt-2 text-xs text-neutral-500">Batch: <span className="font-medium text-neutral-300">{product.batchNumber}</span></p>
              )}
            </>
          ) : (
            <p className="text-sm text-neutral-500">No expiry date</p>
          )}
        </div>

        {/* Identifiers */}
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Identifiers</span>
            <LuBarcode className="h-4 w-4 text-neutral-500" />
          </div>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5">
              <LuHash className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
              <span className="text-sm text-neutral-400">SKU</span>
              <span className="ml-auto text-sm font-mono text-white">{product.sku || "—"}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <LuBarcode className="h-3.5 w-3.5 text-neutral-600 shrink-0" />
              <span className="text-sm text-neutral-400">Barcode</span>
              <span className="ml-auto text-sm font-mono text-white">{product.barcode || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Buying Trends ── */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 mt-6 overflow-hidden">
        <div className="flex items-center gap-2 px-6 pt-5 pb-3 border-b border-neutral-800">
          <LuTrendingUp className="h-4 w-4 text-emerald-500" />
          <h2 className="text-xs uppercase tracking-widest text-neutral-500 font-medium">Buying Trends</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {/* Depth */}
          <div className="p-6 space-y-3 sm:border-r border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Inventory Depth</span>
              <span className="text-xl font-bold text-white">{health.label}</span>
            </div>
            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${health.pct}%`, backgroundColor: health.color }} />
            </div>
            <p className="text-xs text-neutral-500 leading-relaxed">
              {health.pct >= 80
                ? "Supplier holds significant stock — bulk orders readily fulfillable"
                : health.pct >= 50
                  ? "Moderate stock levels — suitable for standard orders"
                  : health.pct > 0
                    ? "Limited quantity available — order soon to secure supply"
                    : "No stock currently available"}
            </p>
          </div>

          {/* Stock Coverage */}
          <div className="p-6 space-y-3 sm:border-r border-neutral-800">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Stock Coverage</span>
              <span className={`text-xl font-bold ${coverage.days !== null ? "text-white" : "text-neutral-500"}`}>
                {coverage.label}
              </span>
            </div>
            <div className="rounded-xl bg-neutral-800/50 px-4 py-3 flex items-center gap-3">
              <LuShoppingCart className="h-5 w-5 text-neutral-500 shrink-0" />
              <p className="text-xs text-neutral-400">{coverage.desc}</p>
            </div>
            {coverage.days !== null && (
              <div className="h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min((coverage.days / 90) * 100, 100)}%`,
                    backgroundColor:
                      coverage.days >= 30 ? "#10b981" : coverage.days >= 14 ? "#f59e0b" : coverage.days >= 7 ? "#f97316" : "#ef4444",
                  }}
                />
              </div>
            )}
          </div>

          {/* Sales Last 30 Days */}
          <div className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-500">Sold Last 30 Days</span>
              <span className={`text-xl font-bold ${hasSalesData ? "text-white" : "text-neutral-500"}`}>
                {hasSalesData ? `${product.salesLast30Days} ${product.unit}` : "—"}
              </span>
            </div>
            <div className="rounded-xl bg-neutral-800/50 px-4 py-3 flex items-center gap-3">
              <LuPackage className="h-5 w-5 text-neutral-500 shrink-0" />
              <p className="text-xs text-neutral-400">
                {hasSalesData
                  ? `${product.salesLast30Days} ${product.unit} sold in the last 30 days`
                  : "No sales data found for the last 30 days"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Supplier ── */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 mt-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800/50">
              <LuTruck className="h-6 w-6 text-neutral-500" />
            </div>
            <div>
              <Link
                href={`/suppliers/${product.supplierId}`}
                className="text-sm font-semibold text-white hover:text-emerald-400 transition-colors"
              >
                {product.supplierBusinessName || product.supplierName}
              </Link>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-neutral-500 mt-0.5">
                <span className="flex items-center gap-1">
                  <LuStar className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {product.supplierAvgRating.toFixed(1)}
                </span>
                {(product.supplierDistrict || product.supplierArea) && (
                  <span className="flex items-center gap-1">
                    <LuMapPin className="h-3 w-3" />
                    {product.supplierArea ? `${product.supplierArea}, ` : ""}{product.supplierDistrict}
                  </span>
                )}
              </div>
            </div>
          </div>
          <Link
            href={`/suppliers/${product.supplierId}`}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-5 py-2.5 text-xs font-medium text-neutral-400 hover:text-white hover:border-neutral-700 transition-all self-start sm:self-auto"
          >
            View Supplier &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}

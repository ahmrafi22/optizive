"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuArrowLeft, LuPackage, LuPencil } from "react-icons/lu";

import { getProductById } from "@/backend/inventory/inventory";

import { ProductEditDialog } from "../_components/ProductEditDialog";
import { StockBadge } from "../_components/StockBadge";
import { SalesHistoryChart } from "../_components/SalesHistoryChart";
import { MonthlyComparisonChart } from "../_components/MonthlyComparisonChart";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
  formatDate,
  type InventoryProduct,
} from "../_components/types";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const handleSaved = useCallback((updated: InventoryProduct) => {
    setProduct(updated);
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true);
      setError(null);
      try {
        const result = await getProductById(productId);
        if (!result) {
          setError("Product not found.");
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
  }, [productId]);

  if (loading) {
    return (
      <div className="relative mx-auto w-full max-w-4xl space-y-6">
        <div className="bento-card noise-overlay p-8 animate-pulse space-y-4">
          <div className="h-6 w-24 bg-(--clr-surface2) rounded" />
          <div className="h-8 w-64 bg-(--clr-surface2) rounded" />
          <div className="h-4 w-full bg-(--clr-surface2) rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-32 bg-(--clr-surface2) rounded-xl" />
            <div className="h-32 bg-(--clr-surface2) rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="relative mx-auto w-full max-w-4xl">
        <div className="bento-card noise-overlay p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
            <LuPackage className="h-5 w-5 text-(--clr-fg-muted)" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-(--clr-fg)">{error ?? "Product not found"}</h3>
          <button
            type="button"
            onClick={() => router.push("/inventory")}
            className="active:scale-[0.97] transition-transform duration-150 mt-4 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-6 py-2.5 text-sm font-semibold text-(--clr-fg) hover:border-(--clr-border-hover)"
          >
            <LuArrowLeft className="h-4 w-4" />
            Back to Inventory
          </button>
        </div>
      </div>
    );
  }

  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
  const stockRatio = product.minStock && product.minStock > 0
    ? Math.min(product.quantity / product.minStock, 3)
    : null;
  const marginPercent = product.costPrice > 0
    ? ((product.sellingPrice - product.costPrice) / product.costPrice * 100).toFixed(1)
    : null;

  return (
    <div className="relative mx-auto w-full max-w-4xl space-y-6">
      <div className="bento-card noise-overlay overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-80 lg:w-96 aspect-square md:aspect-auto md:min-h-100 relative">
            <img
              src={product.imageLink || ""}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              onLoad={(e) => {
                (e.target as HTMLImageElement).style.display = "block";
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
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1 text-xs text-(--clr-fg-muted)">
                    {formatCategory(product.category)}
                  </span>
                  <StockBadge status={product.stockStatus} />
                </div>
                <h1 className="text-2xl md:text-3xl font-naston text-(--clr-fg)">{product.name}</h1>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover)"
              >
                <LuPencil className="h-3.5 w-3.5" />
                Edit
              </button>
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
              {!product.isActive && (
                <>
                  <span className="opacity-30">&middot;</span>
                  <span className="text-rose-400 font-semibold">Inactive</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">Pricing</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Selling Price</span>
              <span className="text-lg font-semibold text-(--clr-fg)">{formatCurrency(product.sellingPrice)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Cost Price</span>
              <span className="text-lg font-semibold text-(--clr-fg)">{formatCurrency(product.costPrice)}</span>
            </div>
            <div className="border-t border-(--clr-border) pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--clr-fg-muted)">Margin</span>
                <span className="text-lg font-semibold text-emerald-400">{formatCurrency(product.margin)}</span>
              </div>
              {marginPercent && (
                <div className="text-right text-xs text-(--clr-fg-muted) mt-0.5">
                  {marginPercent}% margin
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">Stock</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-(--clr-fg-muted)">Quantity</span>
              <span className="text-lg font-semibold text-(--clr-fg)">
                {product.quantity} <span className="text-sm text-(--clr-fg-muted)">{product.unit}</span>
              </span>
            </div>
            {product.minStock !== null && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-(--clr-fg-muted)">Min Stock</span>
                <span className="text-lg font-semibold text-(--clr-fg)">
                  {product.minStock} <span className="text-sm text-(--clr-fg-muted)">{product.unit}</span>
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
                <span className="text-lg font-semibold text-(--clr-fg)">{formatCurrency(product.value)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {(product.barcode || product.sku) && (
        <div className="bento-card noise-overlay p-5">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-4">Identifiers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.sku && (
              <div>
                <span className="text-xs uppercase tracking-widest text-(--clr-fg-muted)">SKU</span>
                <p className="mt-1 text-sm font-mono text-(--clr-fg)">{product.sku}</p>
              </div>
            )}
            {product.barcode && (
              <div>
                <span className="text-xs uppercase tracking-widest text-(--clr-fg-muted)">Barcode</span>
                <p className="mt-1 text-sm font-mono text-(--clr-fg)">{product.barcode}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales History Chart */}
      <SalesHistoryChart productId={product.id} productName={product.name} />

      {/* Monthly Comparison Chart */}
      <MonthlyComparisonChart productId={product.id} />

      <ProductEditDialog
        product={product}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSaved={handleSaved}
      />
    </div>
  );
}

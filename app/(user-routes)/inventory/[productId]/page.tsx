"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuArrowLeft, LuArrowUpRight, LuDownload, LuPackage, LuPencil, LuQrCode, LuX } from "react-icons/lu";
import { QRCodeSVG } from "qrcode.react";

import { getProductById } from "@/backend/inventory/inventory";
import { getRestockSuggestions } from "@/backend/supplier-recommender/supplier-recommender";
import type { RestockSuggestion } from "@/backend/supplier-recommender/types";

import { ProductEditDialog } from "../_components/ProductEditDialog";
import { StockBadge } from "../_components/StockBadge";
import { SalesHistoryChart } from "../_components/SalesHistoryChart";
import { MonthlyComparisonChart } from "../_components/MonthlyComparisonChart";
import {
  CATEGORY_PALETTES,
  EXPIRY_BADGES,
  EXPIRY_LABELS,
  formatCategory,
  formatCurrency,
  formatDate,
  formatExpiryDate,
  type ExpiryStatus,
  type InventoryProduct,
} from "../_components/types";

function getExpiryBadgeClass(status: ExpiryStatus) {
  return EXPIRY_BADGES[status] ?? EXPIRY_BADGES.NO_EXPIRY;
}

function getExpiryLabel(status: ExpiryStatus) {
  return EXPIRY_LABELS[status] ?? EXPIRY_LABELS.NO_EXPIRY;
}

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();

  const [product, setProduct] = useState<InventoryProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [restockSuggestions, setRestockSuggestions] = useState<RestockSuggestion[]>([]);
  const [restockLoading, setRestockLoading] = useState(false);

  const qrInfoRef = useRef<HTMLDivElement>(null);
  const qrUpdateRef = useRef<HTMLDivElement>(null);

  async function downloadQrPng(ref: React.RefObject<HTMLDivElement | null>, filename: string) {
    const el = ref.current;
    if (!el) return;
    const svg = el.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.clientWidth * 4;
      canvas.height = svg.clientHeight * 4;
      const ctx = canvas.getContext("2d");
      if (!ctx) { URL.revokeObjectURL(url); return; }
      ctx.scale(4, 4);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        a.click();
        URL.revokeObjectURL(a.href);
      }, "image/png");
    };
    img.src = url;
  }

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

        if (result.stockStatus === "LOW_STOCK" || result.stockStatus === "OUT_OF_STOCK") {
          setRestockLoading(true);
          try {
            const suggestions = await getRestockSuggestions([productId]);
            setRestockSuggestions(suggestions);
          } catch { /* ignore */ } finally {
            setRestockLoading(false);
          }
        }
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
      <div className="bento-card bento-card-no-hover noise-overlay overflow-hidden">
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

          <div className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1 text-xs text-(--clr-fg-muted)">
                    {formatCategory(product.category)}
                  </span>
                  <StockBadge status={product.stockStatus} />
                </div>
                <h1 className="text-2xl md:text-3xl font-naston text-(--clr-fg)">{product.name}</h1>
              </div>

            <p className="text-sm text-(--clr-fg-muted) leading-relaxed">
              {product.description || "No description added yet."}
            </p>

            {product.sku || product.barcode ? (
              <div className="flex flex-wrap items-center gap-3">
                {product.sku && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3.5 py-1.5 text-xs">
                    <span className="uppercase text-(--clr-fg-dim) tracking-widest">SKU</span>
                    <span className="font-mono font-medium text-(--clr-fg) tracking-tight">{product.sku}</span>
                  </span>
                )}
                {product.barcode && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3.5 py-1.5 text-xs">
                    <span className="uppercase text-(--clr-fg-dim) tracking-widest">Barcode</span>
                    <span className="font-mono font-medium text-(--clr-fg) tracking-tight">{product.barcode}</span>
                  </span>
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

            {product.expiryDate && (
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getExpiryBadgeClass(product.expiryStatus)}`}>
                  {getExpiryLabel(product.expiryStatus)}
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
          </div>
          <div className="mt-auto flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => setIsQrOpen(true)}
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-yellow)/40 bg-(--clr-yellow)/10 px-4 py-2 text-xs font-semibold text-(--clr-yellow) hover:bg-(--clr-yellow)/20 hover:border-(--clr-yellow)/60"
            >
              <LuQrCode className="h-3.5 w-3.5" />
              QR Code
            </button>
            <button
              type="button"
              onClick={() => setIsEditOpen(true)}
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-teal)/40 bg-(--clr-teal)/10 px-4 py-2 text-xs font-semibold text-(--clr-teal) hover:bg-(--clr-teal)/20 hover:border-(--clr-teal)/60"
            >
              <LuPencil className="h-3.5 w-3.5" />
              Edit
            </button>
          </div>
        </div>
      </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

        <div className="bento-card noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">Expiry</h2>
          {product.expiryDate ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-lg"
                  style={{
                    background: product.daysUntilExpiry !== null && product.daysUntilExpiry <= 7
                      ? "#f8717120" : "#34d39920",
                    color: product.daysUntilExpiry !== null && product.daysUntilExpiry <= 7
                      ? "#f87171" : "#34d399",
                  }}
                >
                  <LuPackage />
                </div>
                <div>
                  <div className="text-lg font-semibold text-(--clr-fg)">
                    {formatExpiryDate(product.expiryDate)}
                  </div>
                  <div className="text-xs text-(--clr-fg-muted)">{product.batchNumber ?? "No batch"}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-(--clr-fg-muted)">Days remaining</span>
                  <span
                    className="font-bold"
                    style={{
                      color: product.daysUntilExpiry !== null
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
                        background: product.daysUntilExpiry <= 0
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
                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${getExpiryBadgeClass(product.expiryStatus)}`}>
                  {getExpiryLabel(product.expiryStatus)}
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

      {/* Restock Suggestions */}
      {(product.stockStatus === "LOW_STOCK" || product.stockStatus === "OUT_OF_STOCK") && (
        <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) flex items-center gap-2">
            <LuArrowLeft className="h-3.5 w-3.5 rotate-90 text-amber-400" />
            Restock Options
          </h2>
          {restockLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-(--clr-surface2) rounded-xl" />
              ))}
            </div>
          ) : restockSuggestions.length > 0 && restockSuggestions[0].suppliers.length > 0 ? (
            <div className="space-y-2">
              {restockSuggestions[0].suppliers.map((s) => (
                <a
                  key={s.id}
                  href={`/suppliers/${s.id}`}
                  className="flex items-center gap-3 rounded-xl bg-(--clr-surface2) px-4 py-3 transition-colors hover:bg-(--clr-border) cursor-pointer!"
                >
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-(--clr-surface) border border-(--clr-border)">
                    {s.profileImage ? (
                      <img
                        src={s.profileImage}
                        alt=""
                        className="h-full w-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-sm font-bold text-(--clr-fg-muted)">
                        {(s.businessName ?? s.name).charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-(--clr-fg)">{s.businessName || s.name}</p>
                    <p className="text-xs text-(--clr-fg-muted)">Match {s.matchScore}% &middot; ★ {s.avgRating.toFixed(1)}</p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-(--clr-teal-dim)">View &rarr;</span>
                </a>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-sm text-(--clr-fg-muted)">No suitable restocker found for this product.</p>
              <a
                href="/community"
                className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-5 py-2 text-xs font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors"
              >
                Post in our community
                <LuArrowUpRight className="h-3 w-3" />
              </a>
            </div>
          )}
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

      {/* QR Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-50 flex justify-end ${
          isQrOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-200 ${
            isQrOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsQrOpen(false)}
        />
        <div
          className={`relative w-full max-w-sm bg-(--clr-surface) border-l border-(--clr-border) shadow-2xl flex flex-col will-change-transform transition-transform duration-200 ease-out ${
            isQrOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-(--clr-border)">
            <h2 className="text-sm font-semibold text-(--clr-fg)">QR Codes</h2>
            <button
              type="button"
              onClick={() => setIsQrOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors"
            >
              <LuX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {/* QR 1 - Product Info */}
            <div ref={qrInfoRef} className="flex flex-col items-center gap-4 p-5 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.id}/info`}
                size={180}
                bgColor="transparent"
                fgColor="var(--clr-fg)"
                level="M"
                includeMargin={false}
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-(--clr-fg)">Product Info</p>
                <p className="text-[11px] text-(--clr-fg-muted) leading-relaxed">
                  Full product details, 7-day sales history, inventory stats, pricing & expiry info
                </p>
              </div>
              <div className="flex w-full gap-2">
                <a
                  href={`/product/${product.id}/info`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-xl border border-(--clr-border) bg-(--clr-surface) px-4 py-2.5 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => downloadQrPng(qrInfoRef, `product-info-${product.id}.png`)}
                  className="flex items-center justify-center rounded-xl border border-(--clr-yellow)/40 bg-(--clr-yellow)/10 px-3 py-2.5 text-xs font-semibold text-(--clr-yellow) hover:bg-(--clr-yellow)/20 hover:border-(--clr-yellow)/60 transition-colors"
                >
                  <LuDownload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* QR 2 - Quick Update */}
            <div ref={qrUpdateRef} className="flex flex-col items-center gap-4 p-5 rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
              <QRCodeSVG
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/product/${product.id}/update`}
                size={180}
                bgColor="transparent"
                fgColor="var(--clr-fg)"
                level="M"
                includeMargin={false}
              />
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-(--clr-fg)">Quick Update</p>
                <p className="text-[11px] text-(--clr-fg-muted) leading-relaxed">
                  Update quantity, expiry date & batch number without login
                </p>
              </div>
              <div className="flex w-full gap-2">
                <a
                  href={`/product/${product.id}/update`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-xl border border-(--clr-border) bg-(--clr-surface) px-4 py-2.5 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  type="button"
                  onClick={() => downloadQrPng(qrUpdateRef, `quick-update-${product.id}.png`)}
                  className="flex items-center justify-center rounded-xl border border-(--clr-teal)/40 bg-(--clr-teal)/10 px-3 py-2.5 text-xs font-semibold text-(--clr-teal) hover:bg-(--clr-teal)/20 hover:border-(--clr-teal)/60 transition-colors"
                >
                  <LuDownload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-(--clr-border)">
            <p className="text-[11px] text-(--clr-fg-dim) text-center">
              These links require no authentication
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

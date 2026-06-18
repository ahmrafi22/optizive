"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LuX, LuPackage, LuCircleCheck, LuImageOff } from "react-icons/lu";
import { createProcurementRequest } from "@/backend/procurement/procurement";
import type { SupplierProduct } from "@/backend/supplier-recommender/types";

const CURRENCY = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

interface SelectedItem {
  productId: string;
  name: string;
  imageLink: string | null;
  quantity: number;
  unitPrice: number;
  available: number;
}

export function RequestProcurementDialog({
  open,
  onClose,
  supplierId,
  supplierName,
  products,
}: {
  open: boolean;
  onClose: () => void;
  supplierId: string;
  supplierName: string;
  products: SupplierProduct[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Map<string, SelectedItem>>(new Map());
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (open) {
      setSelected(new Map());
      setNotes("");
      setError(null);
      setSuccess(false);
    }
  }, [open]);

  function toggleProduct(product: SupplierProduct) {
    const next = new Map(selected);
    if (next.has(product.id)) {
      next.delete(product.id);
    } else {
      next.set(product.id, {
        productId: product.id,
        name: product.name,
        imageLink: product.imageLink,
        quantity: 1,
        unitPrice: product.sellingPrice,
        available: product.quantity,
      });
    }
    setSelected(next);
  }

  function updateQuantity(productId: string, qty: number) {
    const next = new Map(selected);
    const item = next.get(productId);
    if (item) {
      next.set(productId, { ...item, quantity: Math.max(1, Math.min(qty, item.available)) });
    }
    setSelected(next);
  }

  const selectedArray = Array.from(selected.values());
  const totalAmount = selectedArray.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const inStockProducts = products.filter((p) => p.quantity > 0);

  async function handleSubmit() {
    if (selectedArray.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createProcurementRequest({
        supplierId,
        notes: notes || undefined,
        items: selectedArray.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      });
      if (!result) {
        setError("Failed to create request. Please try again.");
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        onClose();
        router.push("/procurement");
      }, 1500);
    } catch (err) {
      setError((err as Error).message ?? "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col w-[80vw] h-[80vh] rounded-3xl border border-(--clr-border) bg-(--clr-surface) shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-(--clr-border)">
          <div>
            <h2 className="text-lg font-bold text-(--clr-fg)">Request Procurement</h2>
            <p className="text-sm text-(--clr-fg-muted) mt-0.5">from {supplierName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-(--clr-border) text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-all"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
              <LuCircleCheck className="h-7 w-7" />
            </div>
            <p className="text-lg font-semibold text-(--clr-fg)">Request Sent!</p>
            <p className="text-sm text-(--clr-fg-muted) mt-1">Redirecting to procurement page...</p>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Product Grid */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-(--clr-border)">
              <div className="shrink-0 px-6 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-(--clr-fg)">
                  Products ({inStockProducts.length} available)
                </h3>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-4">
                {error && (
                  <div className="mb-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                    {error}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {inStockProducts.map((product) => {
                    const isSelected = selected.has(product.id);

                    return (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 rounded-2xl border overflow-hidden transition-all cursor-pointer ${
                          isSelected
                            ? "border-(--clr-teal-dim) ring-1 ring-(--clr-teal-dim)/40 bg-(--clr-teal-dim)/5"
                            : "border-(--clr-border) hover:border-(--clr-border-hover)"
                        }`}
                        onClick={() => toggleProduct(product)}
                      >
                        {/* Small Image */}
                        <div className="w-16 h-16 shrink-0 bg-(--clr-surface2) relative overflow-hidden">
                          {product.imageLink ? (
                            <img
                              src={product.imageLink}
                              alt={product.name}
                              className="h-full w-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center">
                              <LuPackage className="h-5 w-5 text-(--clr-fg-dim)" />
                            </div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 py-2.5 pr-3 flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-(--clr-fg) truncate">{product.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs font-semibold text-(--clr-fg)">{CURRENCY.format(product.sellingPrice)}</span>
                              <span className={`text-[10px] ${product.quantity > 25 ? "text-emerald-400" : "text-amber-400"}`}>
                                {product.quantity} {product.unit}
                              </span>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-(--clr-teal-dim)">
                              <LuCheck className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Selected Items + Notes + Actions */}
            <div className="w-80 shrink-0 flex flex-col overflow-hidden">
              <div className="shrink-0 px-5 pt-4 pb-2">
                <h3 className="text-sm font-semibold text-(--clr-fg)">
                  Selected ({selectedArray.length})
                </h3>
              </div>

              <div className="flex-1 overflow-y-auto px-5">
                {selectedArray.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface2)">
                      <LuPackage className="h-5 w-5 text-(--clr-fg-dim)" />
                    </div>
                    <p className="mt-2 text-xs text-(--clr-fg-muted)">Click products to add</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedArray.map((item) => (
                      <div key={item.productId} className="rounded-xl border border-(--clr-border) p-3">
                        <div className="flex items-start gap-2.5 mb-2">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-(--clr-border) bg-(--clr-surface2) overflow-hidden">
                            {item.imageLink ? (
                              <img src={item.imageLink} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <LuPackage className="h-4 w-4 text-(--clr-fg-dim)" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-(--clr-fg) truncate leading-snug">{item.name}</p>
                            <p className="text-[10px] text-(--clr-fg-muted)">{CURRENCY.format(item.unitPrice)} each</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId, item.quantity - 1); }}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-(--clr-border) text-(--clr-fg-muted) hover:text-(--clr-fg) text-xs disabled:opacity-30"
                              disabled={item.quantity <= 1}
                            >
                              –
                            </button>
                            <span className="w-6 text-center text-xs font-semibold text-(--clr-fg)">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); updateQuantity(item.productId, item.quantity + 1); }}
                              className="flex h-6 w-6 items-center justify-center rounded-full border border-(--clr-border) text-(--clr-fg-muted) hover:text-(--clr-fg) text-xs disabled:opacity-30"
                              disabled={item.quantity >= item.available}
                            >
                              +
                            </button>
                          </div>
                          <span className="text-xs font-semibold text-(--clr-fg)">{CURRENCY.format(item.quantity * item.unitPrice)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 px-5 pt-3 pb-4 space-y-3 border-t border-(--clr-border)">
                {selectedArray.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-(--clr-fg)">Total</span>
                    <span className="text-base font-bold text-(--clr-fg)">{CURRENCY.format(totalAmount)}</span>
                  </div>
                )}

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (optional)"
                  rows={2}
                  className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-teal-dim) resize-none transition-colors"
                />

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 rounded-full border border-(--clr-border) py-2.5 text-xs font-medium text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={selectedArray.length === 0 || submitting}
                    className="flex-1 rounded-full bg-(--clr-teal-dim) py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? "Sending..." : `Send Request (${CURRENCY.format(totalAmount)})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LuCheck(props: { className?: string }) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

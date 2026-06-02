"use client";

import { useState } from "react";
import { LuLoader, LuCheck, LuPencil, LuX, LuCircleX as LuXCircle } from "react-icons/lu";
import type { PublicProduct } from "@/backend/inventory/public";
import {
  CATEGORY_PALETTES,
  EXPIRY_BADGES,
  EXPIRY_LABELS,
  formatCategory,
  formatCurrency,
  formatDate,
} from "@/app/(user-routes)/inventory/_components/types";
import { StockBadge } from "@/app/(user-routes)/inventory/_components/StockBadge";

interface ProductUpdateContentProps {
  product: PublicProduct;
}

export function ProductUpdateContent({ product }: ProductUpdateContentProps) {
  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;

  const [quantity, setQuantity] = useState(product.quantity);
  const [expiryDate, setExpiryDate] = useState(
    product.expiryDate ? product.expiryDate.split("T")[0] : ""
  );
  const [batchNumber, setBatchNumber] = useState(product.batchNumber ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedProduct, setUpdatedProduct] = useState(product);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(product.name);
  const [editDescription, setEditDescription] = useState(product.description ?? "");
  const [editCategory, setEditCategory] = useState(product.category ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const hasChanges =
    quantity !== product.quantity ||
    expiryDate !== (product.expiryDate ? product.expiryDate.split("T")[0] : "") ||
    batchNumber !== (product.batchNumber ?? "");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/product/${product.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: Number(quantity),
          expiryDate: expiryDate || null,
          batchNumber: batchNumber || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update product");
      }

      const data = await res.json();
      setUpdatedProduct(data);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleEditSave() {
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/product/${product.id}/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          category: editCategory || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to update");
      }
      const data = await res.json();
      setUpdatedProduct(data);
      setIsEditOpen(false);
    } catch (err) {
      setEditError((err as Error).message);
    } finally {
      setEditSaving(false);
    }
  }

  const stockRatio =
    updatedProduct.minStock && updatedProduct.minStock > 0
      ? Math.min(updatedProduct.quantity / updatedProduct.minStock, 3)
      : null;
  const marginPercent =
    updatedProduct.costPrice > 0
      ? (((updatedProduct.sellingPrice - updatedProduct.costPrice) / updatedProduct.costPrice) * 100).toFixed(1)
      : null;

  return (
    <div className="space-y-6">
      {/* Product Card — same design as info page */}
      <div className="bento-card bento-card-no-hover noise-overlay overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-80 lg:w-96 aspect-square md:aspect-auto md:min-h-80 relative">
            <img
              src={updatedProduct.imageLink || ""}
              alt={updatedProduct.name}
              className="absolute inset-0 w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
              style={{ display: updatedProduct.imageLink ? "block" : "none" }}
            />
            <div
              className="absolute inset-0 w-full h-full"
              style={{
                background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
                display: updatedProduct.imageLink ? "none" : "block",
              }}
            />
          </div>

          <div className="flex-1 p-6 md:p-8 flex flex-col">
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1 text-xs text-(--clr-fg-muted)">
                    {formatCategory(updatedProduct.category)}
                  </span>
                  <StockBadge status={updatedProduct.stockStatus} />
                </div>
                <h1 className="text-2xl md:text-3xl font-naston text-(--clr-fg)">
                  {updatedProduct.name}
                </h1>
              </div>

              <p className="text-sm text-(--clr-fg-muted) leading-relaxed">
                {updatedProduct.description || "No description added yet."}
              </p>

              {updatedProduct.sku || updatedProduct.barcode ? (
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-(--clr-fg-muted)">
                  {updatedProduct.sku && (
                    <div>
                      <span className="uppercase tracking-widest">SKU</span>
                      <p className="mt-0.5 text-sm font-medium text-(--clr-fg)">{updatedProduct.sku}</p>
                    </div>
                  )}
                  {updatedProduct.barcode && (
                    <div>
                      <span className="uppercase tracking-widest">Barcode</span>
                      <p className="mt-0.5 text-sm font-medium text-(--clr-fg)">{updatedProduct.barcode}</p>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="flex items-center gap-2 text-xs text-(--clr-fg-muted)">
                <span>Created {formatDate(updatedProduct.createdAt)}</span>
                <span className="opacity-30">&middot;</span>
                <span>Updated {formatDate(updatedProduct.updatedAt)}</span>
              </div>

              {updatedProduct.expiryDate && (
            <div className="flex items-center gap-2 justify-center">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${EXPIRY_BADGES[updatedProduct.expiryStatus]}`}
                  >
                    {EXPIRY_LABELS[updatedProduct.expiryStatus]}
                  </span>
                  <span className="text-xs text-(--clr-fg-muted)">
                    {updatedProduct.daysUntilExpiry !== null
                      ? updatedProduct.daysUntilExpiry > 0
                        ? `${updatedProduct.daysUntilExpiry} days remaining`
                        : `${Math.abs(updatedProduct.daysUntilExpiry)} days overdue`
                      : ""}
                  </span>
                </div>
              )}

              {/* Owner */}
              <div className="flex items-center gap-3 pt-2 border-t border-(--clr-border)">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-(--clr-border) bg-(--clr-surface2)">
                  {updatedProduct.owner.profileImage ? (
                    <img
                      src={updatedProduct.owner.profileImage}
                      alt={updatedProduct.owner.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs font-bold text-(--clr-fg-muted)">
                      {updatedProduct.owner.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-(--clr-fg) leading-tight">
                    {updatedProduct.owner.businessName || updatedProduct.owner.name}
                  </p>
                  <p className="text-[11px] text-(--clr-fg-muted)">Product Owner</p>
                </div>
              </div>
            </div>

            <div className="mt-auto flex items-center justify-end gap-2 pt-4">
              <button
                type="button"
                onClick={() => setIsEditOpen(true)}
                className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover)"
              >
                <LuPencil className="h-3.5 w-3.5" />
                Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bento-card bento-card-no-hover noise-overlay p-6">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) mb-5 text-center">
          Quick Update
        </h2>

        <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-4">
          {/* Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-(--clr-fg-muted) block text-center">Quantity</label>
            <div className="flex items-center gap-2 justify-center">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, Number(e.target.value)))}
                className="w-16 h-8 rounded-lg border border-(--clr-border) bg-(--clr-surface2) text-sm text-(--clr-fg) text-center font-semibold focus:outline-none focus:border-(--clr-yellow) transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.max(0, quantity - 1))}
                className="h-8 w-8 rounded-full border border-(--clr-border) bg-(--clr-surface2) flex items-center justify-center text-(--clr-fg-muted) font-bold text-base hover:bg-(--clr-border) hover:text-(--clr-fg) transition-colors"
              >
                -
              </button>
              <button
                type="button"
                onClick={() => setQuantity(quantity + 1)}
                className="h-8 w-8 rounded-full border border-(--clr-border) bg-(--clr-surface2) flex items-center justify-center text-(--clr-fg-muted) font-bold text-base hover:bg-(--clr-border) hover:text-(--clr-fg) transition-colors"
              >
                +
              </button>
              <span className="text-xs text-(--clr-fg-dim)">{updatedProduct.unit}</span>
            </div>
          </div>

          {/* Expiry Date + Batch */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-(--clr-fg-muted) block text-center">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full h-8 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-2.5 text-sm text-(--clr-fg) focus:outline-none focus:border-(--clr-yellow) transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-(--clr-fg-muted) block text-center">Batch No.</label>
              <input
                type="text"
                value={batchNumber}
                onChange={(e) => setBatchNumber(e.target.value)}
                placeholder="—"
                className="w-full h-8 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-yellow) transition-colors"
              />
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">
              <LuXCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-400">
              <LuCheck className="h-3.5 w-3.5 shrink-0" />
              Updated successfully!
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !hasChanges}
            className="w-full h-9 rounded-lg font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: hasChanges ? "#fff44f" : "var(--clr-surface2)",
              color: hasChanges ? "#0f1419" : "var(--clr-fg-muted)",
              border: `1px solid ${hasChanges ? "rgba(255,244,79,0.6)" : "var(--clr-border)"}`,
            }}
          >
            {loading ? (
              <>
                <LuLoader className="h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Product"
            )}
          </button>
        </form>
      </div>

      {/* Edit Dialog */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={() => setIsEditOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-(--clr-border) bg-(--clr-surface) shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-(--clr-fg)">Edit Product</h3>
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors"
              >
                <LuX className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-(--clr-fg-muted)">Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-3 text-sm text-(--clr-fg) focus:outline-none focus:border-(--clr-yellow) transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-(--clr-fg-muted)">Description</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) resize-none focus:outline-none focus:border-(--clr-yellow) transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-(--clr-fg-muted)">Category</label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full h-9 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-3 text-sm text-(--clr-fg) focus:outline-none focus:border-(--clr-yellow) transition-colors"
                >
                  <option value="">Uncategorized</option>
                  <option value="GROCERIES">Groceries</option>
                  <option value="FMCG">FMCG</option>
                  <option value="FRESH_PRODUCE">Fresh Produce</option>
                  <option value="AGRO_PRODUCTS">Agro Products</option>
                  <option value="FISHERY_SEAFOOD">Fishery & Seafood</option>
                  <option value="MEAT_POULTRY">Meat & Poultry</option>
                  <option value="DAIRY">Dairy</option>
                  <option value="ELECTRONICS">Electronics</option>
                  <option value="MOBILE_ACCESSORIES">Mobile Accessories</option>
                  <option value="CLOTHING">Clothing</option>
                  <option value="TEXTILES_APPAREL">Textiles & Apparel</option>
                  <option value="FOOTWEAR">Footwear</option>
                  <option value="BEAUTY_PERSONAL_CARE">Beauty & Personal Care</option>
                  <option value="HOME_APPLIANCE">Home Appliance</option>
                  <option value="FURNITURE">Furniture</option>
                  <option value="HARDWARE">Hardware</option>
                  <option value="CONSTRUCTION_MATERIALS">Construction Materials</option>
                  <option value="AUTO_PARTS">Auto Parts</option>
                  <option value="PHARMACY">Pharmacy</option>
                  <option value="STATIONERY">Stationery</option>
                  <option value="OFFICE_SUPPLIES">Office Supplies</option>
                  <option value="PACKAGING">Packaging</option>
                  <option value="CHEMICALS">Chemicals</option>
                  <option value="PLASTICS">Plastics</option>
                  <option value="RESTAURANT_SUPPLY">Restaurant Supply</option>
                  <option value="HOSPITALITY_SUPPLY">Hospitality Supply</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            {editError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-xs text-rose-400">
                <LuXCircle className="h-3.5 w-3.5 shrink-0" />
                {editError}
              </div>
            )}

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                className="h-9 px-4 rounded-lg border border-(--clr-border) bg-(--clr-surface2) text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEditSave}
                disabled={editSaving || !editName.trim()}
                className="h-9 px-4 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-40"
                style={{
                  background: "#fff44f",
                  color: "#0f1419",
                  border: "1px solid rgba(255,244,79,0.6)",
                }}
              >
                {editSaving ? (
                  <>
                    <LuLoader className="h-3.5 w-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  LuX,
  LuSave,
  LuUpload,
  LuTrash2,
  LuCircleAlert,
  LuCamera,
} from "react-icons/lu";

import { updateProduct } from "@/backend/inventory/inventory";

import {
  CATEGORY_PALETTES,
  CATEGORIES,
  STOCK_UNITS,
  formatCategory,
  type InventoryProduct,
} from "./types";

interface ProductEditDialogProps {
  product: InventoryProduct;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: InventoryProduct) => void;
}

interface FormState {
  name: string;
  description: string;
  category: string;
  sellingPrice: string;
  costPrice: string;
  quantity: string;
  unit: string;
  minStock: string;
  sku: string;
  barcode: string;
  isActive: boolean;
}

function toFormState(product: InventoryProduct): FormState {
  return {
    name: product.name,
    description: product.description ?? "",
    category: product.category ?? "",
    sellingPrice: String(product.sellingPrice),
    costPrice: String(product.costPrice),
    quantity: String(product.quantity),
    unit: product.unit,
    minStock: product.minStock !== null ? String(product.minStock) : "",
    sku: product.sku ?? "",
    barcode: product.barcode ?? "",
    isActive: product.isActive,
  };
}

const CATEGORY_OPTIONS = CATEGORIES.map((value) => ({
  value,
  label: formatCategory(value),
}));

const UNIT_OPTIONS = STOCK_UNITS.map((value) => ({
  value,
  label: value,
}));

export function ProductEditDialog({ product, isOpen, onClose, onSaved }: ProductEditDialogProps) {
  const [draft, setDraft] = useState<FormState>(() => toFormState(product));
  const [imagePreview, setImagePreview] = useState<string | null>(product.imageLink);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setDraft(toFormState(product));
      setImagePreview(product.imageLink);
      setImageFile(null);
      setRemoveImage(false);
      setErrorMessage(null);
      setImageError(null);
    }
  }, [isOpen, product]);

  useEffect(() => {
    if (!isOpen) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isSaving, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const updateField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setDraft((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be under 5MB");
      return;
    }

    setImageFile(file);
    setRemoveImage(false);
    setImageError(null);

    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.onerror = () => setImageError("Failed to read image file");
    reader.readAsDataURL(file);
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImagePreview(null);
    setImageFile(null);
    setRemoveImage(true);
    setImageError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleSave = useCallback(async () => {
    setErrorMessage(null);

    if (!draft.name.trim()) {
      setErrorMessage("Product name is required.");
      return;
    }

    const sellingPrice = Number(draft.sellingPrice);
    if (Number.isNaN(sellingPrice) || sellingPrice < 0) {
      setErrorMessage("Invalid selling price.");
      return;
    }

    const costPrice = Number(draft.costPrice);
    if (Number.isNaN(costPrice) || costPrice < 0) {
      setErrorMessage("Invalid cost price.");
      return;
    }

    const quantity = Number(draft.quantity);
    if (Number.isNaN(quantity) || quantity < 0) {
      setErrorMessage("Invalid quantity.");
      return;
    }

    setIsSaving(true);

    try {
      let imageBase64: string | null | undefined;

      if (removeImage) {
        imageBase64 = null;
      } else if (imageFile) {
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageFile);
        });
      }

      const result = await updateProduct(product.id, {
        name: draft.name.trim() || undefined,
        description: draft.description.trim() || null,
        category: (draft.category || null) as any,
        sellingPrice: sellingPrice || undefined,
        costPrice: costPrice || undefined,
        quantity: quantity || undefined,
        unit: draft.unit as any,
        minStock: draft.minStock.trim() ? Number(draft.minStock) : null,
        sku: draft.sku.trim() || null,
        barcode: draft.barcode.trim() || null,
        isActive: draft.isActive,
        imageBase64,
      });

      if (!result) {
        setErrorMessage("Failed to update product. Please try again.");
        return;
      }

      onSaved(result);
      onClose();
    } catch (err) {
      setErrorMessage((err as Error).message ?? "Failed to update product.");
    } finally {
      setIsSaving(false);
    }
  }, [draft, imageFile, removeImage, product.id, onSaved, onClose]);

  if (!isOpen) return null;

  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
  const inputBase =
    "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all";
  const selectBase =
    "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all appearance-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 transition-opacity duration-300 ease-out"
        style={{ opacity: 1 }}
        onClick={isSaving ? undefined : onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-product-title"
        className="relative mx-4 max-h-[92vh] w-full max-w-2xl overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface2) shadow-2xl transition-all duration-300 ease-out will-change-transform flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-(--clr-border) px-6 py-4 shrink-0">
          <h2 id="edit-product-title" className="text-base font-bold text-(--clr-fg) uppercase tracking-wider">
            Edit Product
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn-press rounded-full p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg) transition-colors disabled:opacity-50"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <LuCircleAlert className="h-4 w-4 text-red-400 shrink-0" />
              <p className="text-xs text-red-300">{errorMessage}</p>
            </div>
          )}

          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Product Image
            </p>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-(--clr-surface2) flex items-center justify-center overflow-hidden ring-4 ring-(--clr-surface2) shadow-lg border border-(--clr-border)">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Preview"
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
                <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-full bg-(--clr-surface2) border border-(--clr-border) flex items-center justify-center cursor-pointer hover:border-(--clr-border-hover) transition-colors shadow-sm">
                  <LuCamera className="w-3.5 h-3.5 text-(--clr-fg)" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isUploadingImage}
                  />
                </label>
              </div>
              <div className="flex flex-col gap-2">
                <label className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-fg) hover:border-(--clr-border-hover) cursor-pointer disabled:opacity-60">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                    disabled={isUploadingImage}
                  />
                  <LuUpload className="h-3.5 w-3.5" />
                  {isUploadingImage ? "Uploading..." : "Upload New"}
                </label>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    disabled={isUploadingImage}
                    className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-red-400 hover:border-red-400/50 hover:text-red-300 disabled:opacity-60 transition-colors"
                  >
                    <LuTrash2 className="h-3.5 w-3.5" />
                    Remove
                  </button>
                )}
              </div>
            </div>
            {imageError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2">
                <LuCircleAlert className="h-3.5 w-3.5 text-red-400 shrink-0" />
                <p className="text-xs text-red-300">{imageError}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Basic Information
            </p>

            <label className="block">
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Product Name *</span>
              <input
                type="text"
                value={draft.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={`${inputBase} mt-2`}
                placeholder="Enter product name"
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Description</span>
              <textarea
                value={draft.description}
                onChange={(e) => updateField("description", e.target.value)}
                className={`${inputBase} mt-2 min-h-[80px] resize-y`}
                placeholder="Product description"
                rows={3}
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Category</span>
                <select
                  value={draft.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  className={`${selectBase} mt-2`}
                >
                  <option value="">No category</option>
                  {CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Unit</span>
                <select
                  value={draft.unit}
                  onChange={(e) => updateField("unit", e.target.value)}
                  className={`${selectBase} mt-2`}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">SKU</span>
                <input
                  type="text"
                  value={draft.sku}
                  onChange={(e) => updateField("sku", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="Stock keeping unit"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Barcode</span>
                <input
                  type="text"
                  value={draft.barcode}
                  onChange={(e) => updateField("barcode", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="Barcode / UPC"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Pricing & Stock
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Selling Price *</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.sellingPrice}
                  onChange={(e) => updateField("sellingPrice", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="0.00"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Cost Price *</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.costPrice}
                  onChange={(e) => updateField("costPrice", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="0.00"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Quantity *</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.quantity}
                  onChange={(e) => updateField("quantity", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="0"
                />
              </label>

              <label className="block">
                <span className="text-xs font-semibold text-(--clr-fg-dim)">Min Stock</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft.minStock}
                  onChange={(e) => updateField("minStock", e.target.value)}
                  className={`${inputBase} mt-2`}
                  placeholder="Low stock alert threshold"
                />
              </label>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="h-4 w-4 rounded border-(--clr-border) bg-(--clr-surface2) text-(--clr-yellow) focus:ring-(--clr-yellow)/40"
              />
              <span className="text-xs font-semibold text-(--clr-fg-dim)">
                Product is active
              </span>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-(--clr-border) px-6 py-4 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-fg-muted) hover:border-(--clr-border-hover) disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSaving ? (
              <>
                <div className="animate-spin h-3.5 w-3.5 border-2 border-(--clr-charcoal) border-t-transparent rounded-full" />
                Saving...
              </>
            ) : (
              <>
                <LuSave className="h-3.5 w-3.5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

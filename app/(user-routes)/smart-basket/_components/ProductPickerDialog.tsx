"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuSearch, LuX, LuChevronDown, LuPlus } from "react-icons/lu";

import { searchProducts } from "@/backend/smart-basket/smart-basket";
import {
  CATEGORY_PALETTES,
  CATEGORIES,
  formatCategory,
  formatCurrency,
} from "@/app/(user-routes)/inventory/_components/types";
import type { Category } from "@/prisma/generated/prisma/client";
import type { SmartBasketProductSummary } from "@/backend/smart-basket/smart-basket";

interface ProductPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: SmartBasketProductSummary) => void;
  excludedIds: string[];
}

const inputBase =
  "w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition";

const btnActive = "active:scale-[0.97] transition-transform duration-150";

export function ProductPickerDialog({
  isOpen,
  onClose,
  onSelect,
  excludedIds,
}: ProductPickerDialogProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "ALL">("ALL");
  const [items, setItems] = useState<SmartBasketProductSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const hasMore = items.length < totalCount;

  const fetchItems = useCallback(
    async (reset: boolean) => {
      if (reset) {
        setIsLoading(true);
        setItems([]);
        offsetRef.current = 0;
      } else {
        setIsFetchingMore(true);
      }

      setError(null);

      try {
        const response = await searchProducts(search, category, 12, reset ? 0 : offsetRef.current);
        if (!response) {
          throw new Error("Unauthorized - please sign in again.");
        }

        if (reset) {
          setItems(response.items);
          setTotalCount(response.totalCount);
          offsetRef.current = response.items.length;
        } else {
          setItems((prev) => [...prev, ...response.items]);
          offsetRef.current += response.items.length;
        }
      } catch (err) {
        setError((err as Error).message ?? "Failed to load products");
      } finally {
        setIsLoading(false);
        setIsFetchingMore(false);
      }
    },
    [search, category],
  );

  useEffect(() => {
    if (!isOpen) return;

    const timer = window.setTimeout(() => {
      fetchItems(true);
    }, 280);

    return () => window.clearTimeout(timer);
  }, [isOpen, search, category, fetchItems]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

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

  const categoryOptions = useMemo(
    () => [
      { value: "ALL", label: "All" },
      ...CATEGORIES.map((value) => ({ value, label: formatCategory(value) })),
    ],
    [],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        className="relative mx-4 max-h-[92vh] w-full max-w-3xl rounded-3xl border border-(--clr-border) bg-(--clr-surface2) shadow-2xl flex flex-col"
      >
        <div className="flex items-center justify-between border-b border-(--clr-border) px-6 py-4 shrink-0">
          <h2 className="text-sm font-bold text-(--clr-fg) uppercase tracking-wider">
            Pick a product
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`${btnActive} rounded-full p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg)`}
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="sticky top-0 z-10 bg-(--clr-surface2) border-b border-(--clr-border) p-6 space-y-4">
            <div className="grid gap-3 md:grid-cols-[2fr_1fr]">
              <label className="relative">
                <span className="sr-only">Search products</span>
                <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--clr-fg-muted)" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search by name, sku, or barcode"
                  className={`${inputBase} pl-10`}
                />
              </label>
              <label className="relative">
                <span className="sr-only">Filter category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value as Category | "ALL")}
                  className={`${inputBase} appearance-none pr-9`}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <LuChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--clr-fg-muted)" />
              </label>
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            )}

            {isLoading && (
              <div className="text-xs text-(--clr-fg-muted)">Loading products...</div>
            )}
            {!isLoading && isFetchingMore && (
              <div className="text-xs text-(--clr-fg-muted)">Loading more products...</div>
            )}
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bento-card noise-overlay h-32 animate-pulse bg-(--clr-surface)" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="bento-card noise-overlay p-6 text-center text-sm text-(--clr-fg-muted)">
                No products found. Try a different search.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {items.map((item) => {
                  const isExcluded = excludedIds.includes(item.id);
                  return (
                    <div key={item.id} className="bento-card noise-overlay p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-2xl border border-(--clr-border) shrink-0">
                          {item.imageLink ? (
                            <img src={item.imageLink} alt={item.name} className="h-full w-full object-cover" />
                          ) : (
                            <div
                              className="h-full w-full"
                              style={{
                                background: `linear-gradient(135deg, ${
                                  CATEGORY_PALETTES[item.category ?? "OTHER"]?.from ?? CATEGORY_PALETTES.OTHER.from
                                }, ${
                                  CATEGORY_PALETTES[item.category ?? "OTHER"]?.to ?? CATEGORY_PALETTES.OTHER.to
                                })`,
                              }}
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-(--clr-fg) truncate">{item.name}</div>
                          <div className="text-xs text-(--clr-fg-muted)">
                            {formatCategory(item.category)} - <span className="font-mono">{formatCurrency(item.sellingPrice)}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelect(item)}
                        disabled={isExcluded}
                        className={`${btnActive} inline-flex items-center gap-1.5 rounded-full border border-(--clr-border) bg-(--clr-surface) px-2.5 py-1 text-[11px] font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors disabled:opacity-40 shrink-0`}
                      >
                        <LuPlus className="h-3 w-3" />
                        {isExcluded ? "Added" : "Add"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {hasMore && !isLoading && (
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={() => fetchItems(false)}
                  disabled={isFetchingMore}
                  className={`${btnActive} inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors disabled:opacity-50`}
                >
                  {isFetchingMore ? "Loading..." : "Load more"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

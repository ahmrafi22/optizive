"use client";

import { LuPackage, LuChevronDown } from "react-icons/lu";

import { ProductCard } from "./ProductCard";
import { ProductRow } from "./ProductRow";
import { type InventoryProduct, type ViewMode } from "./types";

export interface ProductListProps {
  products: InventoryProduct[];
  view: ViewMode;
  isLoading: boolean;
  isFetching: boolean;
  isFetchingMore: boolean;
  isEmpty: boolean;
  hasMore: boolean;
  totalCount: number;
  overallCount: number;
  onLoadMore: () => void;
}

export function ProductList({
  products,
  view,
  isLoading,
  isFetching,
  isFetchingMore,
  isEmpty,
  hasMore,
  totalCount,
  overallCount,
  onLoadMore,
}: ProductListProps) {
  const gridClass =
    view === "grid"
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      : view === "large"
        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        : "grid-cols-1";

  return (
    <section className="space-y-4">
      
      {isLoading ? (
        <div className={`grid ${gridClass} gap-4`}>
          {Array.from({ length: view === "list" ? 4 : 6 }).map((_, index) => (
            <div key={index} className="bento-card noise-overlay h-52 animate-pulse bg-(--clr-surface2)" />
          ))}
        </div>
      ) : isEmpty ? (
        <div className="bento-card noise-overlay p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
            <LuPackage className="h-5 w-5 text-(--clr-fg-muted)" aria-hidden="true" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-(--clr-fg)">No products yet</h3>
          <p className="mt-2 text-sm text-(--clr-fg-muted)">
            Add products or adjust filters to start tracking inventory.
          </p>
        </div>
      ) : (
        <>
          <div className={`grid ${gridClass} gap-4`}>
            {view === "list"
              ? products.map((product) => <ProductRow key={product.id} product={product} />)
              : products.map((product) => <ProductCard key={product.id} product={product} view={view} />)}
          </div>
          
          {hasMore && !isLoading && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={onLoadMore}
                disabled={isFetchingMore}
                className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-6 py-2.5 text-sm font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isFetchingMore ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-(--clr-border) border-t-(--clr-fg) rounded-full" />
                    Loading...
                  </>
                ) : (
                  <>
                    Load More
                    <LuChevronDown className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          )}
          
          {!hasMore && products.length > 0 && (
            <div className="text-center py-4 text-xs text-(--clr-fg-muted)">
              End of results
            </div>
          )}
        </>
      )}
    </section>
  );
}

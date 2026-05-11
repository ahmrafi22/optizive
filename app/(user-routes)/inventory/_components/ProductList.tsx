import { LuPackage } from "react-icons/lu";

import { ProductCard } from "./ProductCard";
import { ProductRow } from "./ProductRow";
import { type InventoryProduct, type ViewMode } from "./types";

export interface ProductListProps {
  products: InventoryProduct[];
  view: ViewMode;
  isLoading: boolean;
  isFetching: boolean;
  isEmpty: boolean;
  totalCount: number;
  overallCount: number;
}

export function ProductList({
  products,
  view,
  isLoading,
  isFetching,
  isEmpty,
  totalCount,
  overallCount,
}: ProductListProps) {
  const gridClass =
    view === "grid"
      ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
      : view === "large"
        ? "grid-cols-1 lg:grid-cols-2"
        : "grid-cols-1";

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between text-xs text-(--clr-fg-muted)">
        <span>
          {isFetching ? "Updating results..." : `Showing ${totalCount} product${totalCount === 1 ? "" : "s"}`}
        </span>
        <span>{overallCount > 0 ? `${overallCount} total SKUs` : "No inventory yet"}</span>
      </div>

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
        <div className={`grid ${gridClass} gap-4`}>
          {view === "list"
            ? products.map((product) => <ProductRow key={product.id} product={product} />)
            : products.map((product) => <ProductCard key={product.id} product={product} view={view} />)}
        </div>
      )}
    </section>
  );
}

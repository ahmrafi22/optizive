"use client";

import { useState } from "react";
import { LuRefreshCw } from "react-icons/lu";

import { InventoryFilters } from "./_components/InventoryFilters";
import { InventoryStats } from "./_components/InventoryStats";
import { ProductList } from "./_components/ProductList";
import { useInventory } from "./_components/useInventory";
import { SORT_OPTIONS, type SortOption, type StatusFilter, type ViewMode } from "./_components/types";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [sort, setSort] = useState<SortOption>(SORT_OPTIONS[0]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [activeOnly, setActiveOnly] = useState(true);
  const [view, setView] = useState<ViewMode>("grid");
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    products,
    categories,
    totalCount,
    overallCount,
    isLoading,
    isFetching,
    error,
    stats,
  } = useInventory(search, category, status, sort, minPrice, maxPrice, activeOnly, refreshKey);

  const isEmpty = !isLoading && products.length === 0 && !error;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl space-y-8">
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="mt-3 text-3xl md:text-4xl font-semibold text-(--clr-fg)">Inventory</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="btn-press inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg)"
            >
              <LuRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
          </div>
        </header>

        <InventoryStats stats={stats} totalCount={totalCount} overallCount={overallCount} />

        <InventoryFilters
          search={search}
          onSearchChange={setSearch}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          sort={sort}
          onSortChange={setSort}
          status={status}
          onStatusChange={setStatus}
          minPrice={minPrice}
          onMinPriceChange={setMinPrice}
          maxPrice={maxPrice}
          onMaxPriceChange={setMaxPrice}
          activeOnly={activeOnly}
          onActiveOnlyChange={setActiveOnly}
          view={view}
          onViewChange={setView}
          onClear={() => {
            setSearch("");
            setCategory("ALL");
            setStatus("ALL");
            setSort(SORT_OPTIONS[0]);
            setMinPrice("");
            setMaxPrice("");
            setActiveOnly(true);
          }}
          error={error}
        />

        <ProductList
          products={products}
          view={view}
          isLoading={isLoading}
          isFetching={isFetching}
          isEmpty={isEmpty}
          totalCount={totalCount}
          overallCount={overallCount}
        />
      </div>
    </div>
  );
}

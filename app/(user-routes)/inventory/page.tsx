"use client";

import { useState } from "react";

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
  const [activeOnly, setActiveOnly] = useState(false);
  const [view, setView] = useState<ViewMode>("grid");
  const [refreshKey, setRefreshKey] = useState(0);

  const {
    products,
    categories,
    totalCount,
    overallCount,
    isLoading,
    isFetching,
    isFetchingMore,
    hasMore,
    error,
    stats,
    loadMore,
  } = useInventory(search, category, status, sort, minPrice, maxPrice, activeOnly, refreshKey);

  const isEmpty = !isLoading && products.length === 0 && !error;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl space-y-8">
        <header>
          <h1 className="mt-3 text-3xl md:text-4xl font-naston text-(--clr-fg)">Inventory</h1>
        </header>

        <InventoryStats stats={stats} />

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
            setActiveOnly(false);
          }}
          onRefresh={() => setRefreshKey((prev) => prev + 1)}
          isFetching={isFetching}
          error={error}
        />

        <ProductList
          products={products}
          view={view}
          isLoading={isLoading}
          isFetching={isFetching}
          isFetchingMore={isFetchingMore}
          isEmpty={isEmpty}
          hasMore={hasMore}
          totalCount={totalCount}
          overallCount={overallCount}
          onLoadMore={loadMore}
        />
      </div>
    </div>
  );
}

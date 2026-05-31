"use client";

import { useCallback, useState } from "react";
import { motion } from "motion/react";
import { LuPlus } from "react-icons/lu";

import { InventoryFilters } from "./_components/InventoryFilters";
import { InventoryStats } from "./_components/InventoryStats";
import { ProductList } from "./_components/ProductList";
import { AddProductDialog } from "./_components/AddProductDialog";
import { useInventory } from "./_components/useInventory";
import { SORT_OPTIONS, type SortOption, type StatusFilter, type ViewMode, type InventoryProduct } from "./_components/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

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
  const [isAddOpen, setIsAddOpen] = useState(false);

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

  const handleProductCreated = useCallback((product: InventoryProduct) => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 pointer-events-none" />

      <div className="relative mx-auto w-full max-w-6xl space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <div className="flex items-center justify-between">
            <h1 className="mt-3 text-3xl md:text-4xl font-naston text-(--clr-fg)">Inventory</h1>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="active:scale-[0.97] transition-transform duration-150 mt-3 inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:opacity-90 transition-all"
            >
              <LuPlus className="h-3.5 w-3.5" />
              Add Product
            </button>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
        >
          <InventoryStats stats={stats} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: EASE_OUT }}
        >
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.18, ease: EASE_OUT }}
        >
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
        </motion.div>

        <AddProductDialog
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onCreated={handleProductCreated}
        />
      </div>
    </div>
  );
}

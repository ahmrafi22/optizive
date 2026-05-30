"use client";

import { useCallback, useEffect, useState } from "react";
import { LuStore } from "react-icons/lu";
import {
  searchSuppliers,
} from "@/backend/supplier-recommender/supplier-recommender";
import type {
  SupplierSearchFilters,
  SupplierSearchResponse,
} from "@/backend/supplier-recommender/types";
import { SupplierCard } from "./_components/SupplierCard";
import { SupplierFilters } from "./_components/SupplierFilters";

export default function SuppliersPage() {
  const [data, setData] = useState<SupplierSearchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<SupplierSearchFilters>({ limit: 20 });

  const fetchData = useCallback(async (f: SupplierSearchFilters) => {
    setLoading(true);
    try {
      const result = await searchSuppliers(f);
      setData(result);
    } catch (err) {
      console.error("Failed to load suppliers", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [fetchData, filters]);

  function handleFiltersChange(newFilters: SupplierSearchFilters) {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }

  function handleSearch(value: string) {
    setSearch(value);
    setFilters((prev) => ({ ...prev, search: value || undefined, offset: 0 }));
  }

  function handleLoadMore() {
    if (!data || data.items.length >= data.totalCount) return;
    const newOffset = (filters.offset ?? 0) + (filters.limit ?? 20);
    setFilters((prev) => ({ ...prev, offset: newOffset }));
  }

  return (
    <main className="relative w-full space-y-6 pb-12">
      <div className="px-1">
        <h1 className="text-2xl font-naston text-(--clr-fg)">Suppliers</h1>
      </div>

      <SupplierFilters
        categories={data?.filters.categories ?? []}
        districts={data?.filters.districts ?? []}
        onFiltersChange={handleFiltersChange}
        onSearch={handleSearch}
        initialSearch={search}
      />

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bento-card noise-overlay p-5 animate-pulse space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-(--clr-surface2)" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 bg-(--clr-surface2) rounded" />
                  <div className="h-3 w-1/2 bg-(--clr-surface2) rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-(--clr-surface2) rounded" />
              <div className="h-3 w-2/3 bg-(--clr-surface2) rounded" />
              <div className="h-2 w-full bg-(--clr-surface2) rounded" />
            </div>
          ))}
        </div>
      ) : data && data.items.length === 0 ? (
        <div className="bento-card noise-overlay flex flex-col items-center justify-center p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
            <LuStore className="h-6 w-6 text-(--clr-fg-muted)" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-(--clr-fg)">
            No suppliers found
          </h3>
          <p className="mt-1.5 text-sm text-(--clr-fg-muted) mb-4">
            Try adjusting your filters or search query
          </p>
        </div>
      ) : data ? (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-(--clr-fg-muted)">
              Showing {data.items.length} of {data.totalCount} suppliers
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.items.map((supplier) => (
              <SupplierCard key={supplier.id} supplier={supplier} />
            ))}
          </div>
          {data.items.length < data.totalCount && (
            <div className="flex justify-center pt-4">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loading}
                className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-8 py-3 text-sm font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-all disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}

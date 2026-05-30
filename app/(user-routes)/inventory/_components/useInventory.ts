"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { getInventoryStats, listInventoryProducts } from "@/backend/inventory/inventory";
import { Category } from "@/prisma/generated/prisma/client";

import type {
  InventoryCategoryOption,
  InventoryProduct,
  InventoryStats,
  SortOption,
  StatusFilter,
} from "./types";
import { CATEGORIES, formatCategory } from "./types";

const DEFAULT_STATS: InventoryStats = {
  totalValue: 0,
  totalProducts: 0,
  lowStock: 0,
  outOfStock: 0,
  inactive: 0,
  expiringSoon: 0,
  expired: 0,
};

export function useInventory(
  search: string,
  category: string,
  status: StatusFilter,
  sort: SortOption,
  minPrice: string,
  maxPrice: string,
  activeOnly: boolean,
  refreshKey: number,
) {
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [categories, setCategories] = useState<InventoryCategoryOption[]>(
    CATEGORIES.map((c) => ({ value: c, label: formatCategory(c) })),
  );
  const [totalCount, setTotalCount] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [stats, setStats] = useState<InventoryStats>(DEFAULT_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const initialLoadRef = useRef(true);
  const prevRefreshKeyRef = useRef(refreshKey);
  const currentQueryRef = useRef({
    search,
    category,
    status,
    sort,
    minPrice,
    maxPrice,
    activeOnly,
  });

  const fetchProducts = useCallback(async (reset: boolean = false) => {
    const currentOffset = reset ? 0 : offsetRef.current;

    if (reset) {
      setIsLoading(true);
      setProducts([]);
      offsetRef.current = 0;
    } else {
      setIsFetchingMore(true);
    }

    setIsFetching(true);
    setError(null);

    try {
      const result = await listInventoryProducts({
        ...(search.trim() && { search: search.trim() }),
        ...(category !== "ALL" && { category: category as Category }),
        ...(status !== "ALL" && { status }),
        sort: sort.value,
        order: sort.order,
        ...(minPrice.trim() && { minPrice: Number(minPrice.trim()) }),
        ...(maxPrice.trim() && { maxPrice: Number(maxPrice.trim()) }),
        activeOnly,
        limit: 20,
        offset: currentOffset,
      });

      if (result === null) {
        throw new Error("Unauthorized \u2014 please sign in again.");
      }

      if (reset) {
        setProducts(result.items ?? []);
        setCategories(result.categories ?? []);
        setTotalCount(result.totalCount ?? 0);
        setOverallCount(result.overallCount ?? 0);
        offsetRef.current = 20;
      } else {
        setProducts(prev => [...prev, ...(result.items ?? [])]);
        offsetRef.current += 20;
      }

      setHasMore((result.items?.length ?? 0) >= 20);
    } catch (err) {
      setError((err as Error).message ?? "Failed to load inventory.");
    } finally {
      setIsLoading(false);
      setIsFetching(false);
      setIsFetchingMore(false);
    }
  }, [search, category, status, sort, minPrice, maxPrice, activeOnly]);

  const fetchStats = useCallback(async () => {
    try {
      const result = await getInventoryStats();
      if (result === null) {
        throw new Error("Unauthorized - please sign in again.");
      }
      setStats(result ?? DEFAULT_STATS);
    } catch (err) {
      console.error("Failed to load inventory stats", err);
      setStats(DEFAULT_STATS);
    }
  }, []);

  useEffect(() => {
    const isRefresh = prevRefreshKeyRef.current !== refreshKey;
    prevRefreshKeyRef.current = refreshKey;

    const hasQueryChanged =
      initialLoadRef.current ||
      currentQueryRef.current.search !== search ||
      currentQueryRef.current.category !== category ||
      currentQueryRef.current.status !== status ||
      currentQueryRef.current.sort.value !== sort.value ||
      currentQueryRef.current.sort.order !== sort.order ||
      currentQueryRef.current.minPrice !== minPrice ||
      currentQueryRef.current.maxPrice !== maxPrice ||
      currentQueryRef.current.activeOnly !== activeOnly;

    if (hasQueryChanged) {
      currentQueryRef.current = {
        search,
        category,
        status,
        sort,
        minPrice,
        maxPrice,
        activeOnly,
      };
    }

    initialLoadRef.current = false;

    const shouldReset = hasQueryChanged || isRefresh;

    const handler = window.setTimeout(() => {
      fetchProducts(shouldReset);
    }, 280);

    return () => {
      window.clearTimeout(handler);
    };
  }, [search, category, status, sort, minPrice, maxPrice, activeOnly, refreshKey, fetchProducts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats, refreshKey]);

  const loadMoreRef = useRef<(() => void) | null>(null);

  const loadMore = useCallback(() => {
    if (!isFetching && !isFetchingMore && hasMore && !isLoading) {
      fetchProducts(false);
    }
  }, [isFetching, isFetchingMore, hasMore, isLoading, fetchProducts]);

  loadMoreRef.current = loadMore;

  const stableLoadMore = useCallback(() => {
    loadMoreRef.current?.();
  }, []);

  return {
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
    loadMore: stableLoadMore,
  };
}

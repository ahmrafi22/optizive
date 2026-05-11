"use client";

import { useEffect, useMemo, useState } from "react";

import { listInventoryProducts } from "@/backend/inventory/inventory";
import { Category } from "@/prisma/generated/prisma/client";

import type {
  InventoryCategoryOption,
  InventoryProduct,
  SortOption,
  StatusFilter,
} from "./types";

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
  const [categories, setCategories] = useState<InventoryCategoryOption[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [overallCount, setOverallCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handler = window.setTimeout(async () => {
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
        });

        if (result === null) {
          throw new Error("Unauthorized \u2014 please sign in again.");
        }

        setProducts(result.items ?? []);
        setCategories(result.categories ?? []);
        setTotalCount(result.totalCount ?? 0);
        setOverallCount(result.overallCount ?? 0);
      } catch (err) {
        setError((err as Error).message ?? "Failed to load inventory.");
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    }, 280);

    return () => {
      window.clearTimeout(handler);
    };
  }, [search, category, status, sort, minPrice, maxPrice, activeOnly, refreshKey]);

  const stats = useMemo(() => {
    const totalValue = products.reduce((sum, product) => sum + product.value, 0);
    const lowStock = products.filter((product) => product.stockStatus === "LOW_STOCK").length;
    const outOfStock = products.filter((product) => product.stockStatus === "OUT_OF_STOCK").length;
    const inactive = products.filter((product) => product.stockStatus === "INACTIVE").length;

    return { totalValue, lowStock, outOfStock, inactive };
  }, [products]);

  return {
    products,
    categories,
    totalCount,
    overallCount,
    isLoading,
    isFetching,
    error,
    stats,
  };
}

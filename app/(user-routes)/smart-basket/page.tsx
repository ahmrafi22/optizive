"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuPlus, LuSearch, LuArrowUpRight } from "react-icons/lu";

import {
  listRecentProducts,
  listSmartBaskets,
  searchProducts,
} from "@/backend/smart-basket/smart-basket";
import type { SmartBasketListItem, SmartBasketProductSummary } from "@/backend/smart-basket/smart-basket";
import { formatCategory, formatCurrency } from "@/app/(user-routes)/inventory/_components/types";
import { SmartBasketCard } from "./_components/SmartBasketCard";

export default function SmartBasketPage() {
  const [baskets, setBaskets] = useState<SmartBasketListItem[]>([]);
  const [recent, setRecent] = useState<SmartBasketProductSummary[]>([]);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<SmartBasketProductSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const [basketData, recentData] = await Promise.all([
          listSmartBaskets(),
          listRecentProducts(10),
        ]);

        if (!active) return;

        setBaskets(basketData ?? []);
        setRecent(recentData ?? []);
        setSearchResults(recentData ?? []);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message ?? "Failed to load smart baskets");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults(recent);
      return;
    }

    let active = true;
    setIsSearching(true);

    const timer = window.setTimeout(async () => {
      try {
        const response = await searchProducts(search, "ALL", 10, 0);
        if (!active) return;
        setSearchResults(response?.items ?? []);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message ?? "Search failed");
      } finally {
        if (active) setIsSearching(false);
      }
    }, 280);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [search, recent]);

  const hasBaskets = baskets.length > 0;

  const btnActive = "active:scale-[0.97] transition-transform duration-150";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-naston text-(--clr-fg)">Smart Basket</h1>
          <p className="mt-2 text-sm text-(--clr-fg-muted)">
            Build great value bundles in minutes and share them publicly.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/smart-basket/public"
            className={`${btnActive} inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1.5 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors`}
          >
            View other baskets
            <LuArrowUpRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/smart-basket/create"
            className={`${btnActive} inline-flex items-center gap-2 rounded-full bg-(--clr-yellow) px-4 py-2 text-sm font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim)`}
          >
            <LuPlus className="h-4 w-4" />
            Create basket
          </Link>
        </div>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          <h2 className="text-sm font-semibold text-(--clr-fg)">Your baskets</h2>
          {isLoading ? (
            <div className="grid gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bento-card noise-overlay h-32 animate-pulse bg-(--clr-surface2)" />
              ))}
            </div>
          ) : hasBaskets ? (
            <div className="grid gap-4">
              {baskets.map((basket) => (
                <SmartBasketCard key={basket.id} basket={basket} />
              ))}
            </div>
          ) : (
            <div className="bento-card bento-card-no-hover noise-overlay p-6 text-center">
              <p className="text-sm text-(--clr-fg-muted)">No smart baskets created yet.</p>
              <Link
                href="/smart-basket/create"
                className={`${btnActive} mt-4 inline-flex items-center gap-2 rounded-full bg-(--clr-yellow) px-4 py-2 text-xs font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim)`}
              >
                <LuPlus className="h-3.5 w-3.5" />
                Create your first basket
              </Link>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-4">
            <h3 className="text-sm font-semibold text-(--clr-fg)">Find a product to start</h3>
            <label className="relative">
              <span className="sr-only">Search products</span>
              <LuSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-(--clr-fg-muted)" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product name"
                className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 pl-10 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition"
              />
            </label>

            {isSearching && (
              <p className="text-xs text-(--clr-fg-muted)">Searching...</p>
            )}

            <div className="space-y-3 mt-5">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
                <span>{search.trim() ? "Search results" : "Recent products"}</span>
                <span className="font-mono">{searchResults.length}</span>
              </div>

              <div className="space-y-3">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2.5"
                  >
                    <div>
                      <div className="text-sm font-semibold text-(--clr-fg)">{product.name}</div>
                      <div className="text-xs text-(--clr-fg-muted)">
                        {formatCategory(product.category)} - {formatCurrency(product.sellingPrice)}
                      </div>
                    </div>
                    <Link
                      href={`/smart-basket/create?productId=${encodeURIComponent(product.id)}`}
                      className={`${btnActive} inline-flex items-center gap-1 rounded-full border border-(--clr-border) bg-(--clr-surface) px-2.5 py-1 text-[11px] font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors`}
                    >
                      Select
                      <LuArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                ))}

                {searchResults.length === 0 && !isSearching && (
                  <div className="text-xs text-(--clr-fg-muted)">No products found yet.</div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

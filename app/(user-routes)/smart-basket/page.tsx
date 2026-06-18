"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LuPlus, LuSearch, LuArrowUpRight } from "react-icons/lu";

import {
  listRecentProducts,
  listSmartBaskets,
  searchProducts,
} from "@/backend/smart-basket/smart-basket";
import type { SmartBasketListItem, SmartBasketProductSummary } from "@/backend/smart-basket/smart-basket";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
} from "@/app/(user-routes)/inventory/_components/types";
import { SmartBasketCard } from "./_components/SmartBasketCard";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.56, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function BasketSkeleton() {
  return (
    <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2 flex-1">
          <div className="h-5 w-3/5 rounded-full bg-(--clr-surface) animate-pulse" />
          <div className="h-3 w-full rounded-full bg-(--clr-surface) animate-pulse" />
        </div>
        <div className="h-5 w-16 rounded-full bg-(--clr-surface) animate-pulse shrink-0" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-7 w-24 rounded-full bg-(--clr-surface) animate-pulse" />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="h-3 w-16 rounded-full bg-(--clr-surface) animate-pulse" />
        <div className="h-5 w-28 rounded-full bg-(--clr-surface) animate-pulse" />
      </div>
    </div>
  );
}

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
    <div className="relative pb-10">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <div className="xl:sticky xl:top-24 xl:w-90 shrink-0 space-y-6 z-10">
          <FadeUp delay={0}>
            <header>
              <h1 className="font-naston text-3xl md:text-5xl text-(--clr-fg)">
                Smart Basket
              </h1>
              <div className="flex flex-wrap gap-3 mt-5">
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
          </FadeUp>

          {error && (
            <FadeUp delay={0.02}>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
                {error}
              </div>
            </FadeUp>
          )}

          <FadeUp delay={0.04}>
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

                <div className="space-y-2">
                  {searchResults.map((product) => {
                    const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
                    return (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-2 hover:border-(--clr-border-hover) transition-colors"
                      >
                        <div className="h-9 w-9 rounded-lg border border-(--clr-border) overflow-hidden shrink-0">
                          {product.imageLink ? (
                            <img src={product.imageLink} alt={product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-(--clr-fg) truncate leading-tight">{product.name}</div>
                          <div className="text-[11px] text-(--clr-fg-muted) mt-0.5">
                            {formatCategory(product.category)} · <span className="font-mono">{formatCurrency(product.sellingPrice)}</span>
                          </div>
                        </div>
                        <Link
                          href={`/smart-basket/create?productId=${encodeURIComponent(product.id)}`}
                          className={`${btnActive} inline-flex items-center gap-1 rounded-full border border-(--clr-border) bg-(--clr-surface) px-2 py-1 text-[11px] font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors shrink-0`}
                        >
                          Select
                          <LuArrowUpRight className="h-3 w-3" />
                        </Link>
                      </div>
                    );
                  })}

                  {searchResults.length === 0 && !isSearching && (
                    <div className="text-xs text-(--clr-fg-muted)">No products found yet.</div>
                  )}
                </div>
              </div>
            </div>
          </FadeUp>
        </div>

        {/* RIGHT CONTENT */}
        <section className={`flex-1 min-w-0 w-full ${!isLoading && !hasBaskets ? "flex items-center justify-center min-h-[calc(100vh-12rem)]" : "space-y-6"}`}>
          <FadeUp delay={0}>
            {isLoading ? (
              <div className="space-y-4">
                {baskets.length > 0 && (
                  <h2 className="text-sm font-semibold text-(--clr-fg)">Your baskets ({baskets.length})</h2>
                )}
                <div className="grid gap-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <BasketSkeleton key={index} />
                  ))}
                </div>
              </div>
            ) : hasBaskets ? (
              <div className="space-y-4">
                <h2 className="text-sm font-semibold text-(--clr-fg)">Your baskets ({baskets.length})</h2>
                <div className="grid gap-4">
                  {baskets.map((basket) => (
                    <SmartBasketCard key={basket.id} basket={basket} linkTo={`/smart-basket/${basket.id}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="bento-card bento-card-no-hover noise-overlay p-8 text-center mx-auto w-full">
                <p className="text-base font-semibold text-(--clr-fg)">No smart baskets yet</p>
                <p className="text-sm text-(--clr-fg-muted) mt-1">
                  Create your first value bundle to get started.
                </p>
                <Link
                  href="/smart-basket/create"
                  className={`${btnActive} mt-5 inline-flex items-center gap-2 rounded-full bg-(--clr-yellow) px-5 py-2.5 text-sm font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim) hover:-translate-y-1 ease-in-out duration-300`}
                >
                  <LuPlus className="h-4 w-4" />
                  Create your first basket
                </Link>
              </div>
            )}
          </FadeUp>
        </section>
      </div>
    </div>
  );
}

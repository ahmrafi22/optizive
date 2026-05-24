"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LuArrowLeft } from "react-icons/lu";

import { listPublicSmartBaskets } from "@/backend/smart-basket/smart-basket";
import type { PublicSmartBasketListItem } from "@/backend/smart-basket/smart-basket";
import { SmartBasketCard } from "../_components/SmartBasketCard";

export default function SmartBasketPublicPage() {
  const [baskets, setBaskets] = useState<PublicSmartBasketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listPublicSmartBaskets();
        if (!active) return;
        setBaskets(response ?? []);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message ?? "Failed to load public baskets");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const btnActive = "active:scale-[0.97] transition-transform duration-150";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-naston text-(--clr-fg)">Public baskets</h1>
        </div>
        <Link
          href="/smart-basket"
          className={`${btnActive} inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1.5 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors`}
        >
          <LuArrowLeft className="h-3.5 w-3.5" />
          Back to smart basket
        </Link>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="bento-card noise-overlay h-32 animate-pulse bg-(--clr-surface2)" />
          ))}
        </div>
      ) : baskets.length === 0 ? (
        <div className="bento-card bento-card-no-hover noise-overlay p-6 text-center text-sm text-(--clr-fg-muted)">
          No public baskets yet.
        </div>
      ) : (
        <div className="grid gap-4">
          {baskets.map((basket) => (
            <SmartBasketCard key={basket.id} basket={basket} showOwner />
          ))}
        </div>
      )}
    </div>
  );
}

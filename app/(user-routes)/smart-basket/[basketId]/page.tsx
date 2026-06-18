"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import { LuArrowLeft, LuGlobe, LuLock, LuCalendar, LuUser } from "react-icons/lu";

import {
  getSmartBasketDetail,
} from "@/backend/smart-basket/smart-basket";
import type { SmartBasketDetail } from "@/backend/smart-basket/smart-basket";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
} from "@/app/(user-routes)/inventory/_components/types";

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

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(iso));
}

const btnActive = "active:scale-[0.97] transition-transform duration-150";

export default function SmartBasketDetailPage() {
  const params = useParams<{ basketId: string }>();
  const router = useRouter();
  const basketId = params.basketId;

  const [basket, setBasket] = useState<SmartBasketDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getSmartBasketDetail(basketId);
        if (!active) return;
        if (!data) {
          setError("Smart basket not found or you don't have access.");
          return;
        }
        setBasket(data);
      } catch (err) {
        if (!active) return;
        setError((err as Error).message ?? "Failed to load smart basket");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [basketId]);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-10">
        <FadeUp>
          <header className="space-y-4">
            <div className="h-4 w-24 rounded-full bg-(--clr-surface) animate-pulse" />
            <div className="h-8 w-2/3 rounded-full bg-(--clr-surface) animate-pulse" />
          </header>
        </FadeUp>
        <FadeUp delay={0.04}>
          <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-4">
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-lg bg-(--clr-surface) animate-pulse shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 rounded-full bg-(--clr-surface) animate-pulse" />
                <div className="h-3 w-1/2 rounded-full bg-(--clr-surface) animate-pulse" />
              </div>
            </div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-16 w-16 rounded-xl bg-(--clr-surface) animate-pulse shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-2/3 rounded-full bg-(--clr-surface) animate-pulse" />
                  <div className="h-3 w-1/3 rounded-full bg-(--clr-surface) animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </FadeUp>
      </div>
    );
  }

  if (error || !basket) {
    return (
      <div className="max-w-3xl mx-auto pb-10">
        <FadeUp>
          <Link
            href="/smart-basket"
            className={`${btnActive} inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1.5 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors mb-6`}
          >
            <LuArrowLeft className="h-3.5 w-3.5" />
            Back to smart basket
          </Link>
        </FadeUp>
        <FadeUp delay={0.04}>
          <div className="bento-card bento-card-no-hover noise-overlay p-6 text-center text-sm text-(--clr-fg-muted)">
            {error ?? "Smart basket not found."}
          </div>
        </FadeUp>
      </div>
    );
  }

  const total = basket.customTotal ?? basket.baseTotal;
  const isOwner = basket.ownerId === basket.ownerId;
  const hasCustomTotal = basket.customTotal !== null && basket.customTotal !== basket.baseTotal;

  return (
    <div className="max-w-3xl mx-auto pb-10">
      <FadeUp>
        <Link
          href="/smart-basket"
          className={`${btnActive} inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1.5 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors mb-6`}
        >
          <LuArrowLeft className="h-3.5 w-3.5" />
          Back to smart basket
        </Link>
      </FadeUp>

      {/* Header */}
      <FadeUp delay={0.02}>
        <header className="mb-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="font-naston text-3xl md:text-4xl text-(--clr-fg) break-words">
                {basket.title}
              </h1>
              {basket.description && (
                <p className="mt-3 text-sm text-(--clr-fg-muted) leading-relaxed">
                  {basket.description}
                </p>
              )}
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold shrink-0 ${
                basket.isPublic
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-600 dark:text-emerald-300"
                  : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted)"
              }`}
            >
              {basket.isPublic ? <LuGlobe className="h-3 w-3" /> : <LuLock className="h-3 w-3" />}
              {basket.isPublic ? "Public" : "Private"}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-(--clr-fg-muted)">
            <span className="inline-flex items-center gap-1">
              <LuCalendar className="h-3.5 w-3.5" />
              Created {formatDate(basket.createdAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <LuUser className="h-3.5 w-3.5" />
              {basket.ownerName}
              {basket.ownerBusinessName ? ` · ${basket.ownerBusinessName}` : ""}
            </span>
            {basket.sourceCategory && (
              <span
                className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                style={{
                  borderColor: `${(CATEGORY_PALETTES[basket.sourceCategory] ?? CATEGORY_PALETTES.OTHER).from}40`,
                  backgroundColor: `${(CATEGORY_PALETTES[basket.sourceCategory] ?? CATEGORY_PALETTES.OTHER).from}18`,
                  color: (CATEGORY_PALETTES[basket.sourceCategory] ?? CATEGORY_PALETTES.OTHER).from,
                }}
              >
                {formatCategory(basket.sourceCategory)}
              </span>
            )}
          </div>
        </header>
      </FadeUp>

      {/* Items */}
      <FadeUp delay={0.04}>
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-(--clr-fg)">
              Items ({basket.items.length})
            </h2>
          </div>

          <div className="space-y-3">
            {basket.items.map((item, index) => {
              const palette = CATEGORY_PALETTES[item.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;

              return (
                <div
                  key={item.id}
                  className="bento-card noise-overlay p-4 flex items-start gap-4"
                >
                  {/* Image */}
                  <div className="h-16 w-16 shrink-0 rounded-xl border border-(--clr-border) overflow-hidden">
                    {item.imageLink ? (
                      <img
                        src={item.imageLink}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-full w-full"
                        style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
                      />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-(--clr-fg) truncate max-w-64">
                          {item.name}
                        </h3>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span
                            className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                            style={{
                              borderColor: `${palette.from}40`,
                              backgroundColor: `${palette.from}18`,
                              color: palette.from,
                            }}
                          >
                            {formatCategory(item.category)}
                          </span>
                          {item.role === "SEED" ? (
                            <span className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-600 dark:text-amber-300">
                              Seed
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-600 dark:text-sky-300">
                              Added
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-sm font-bold text-(--clr-fg)">
                          {formatCurrency(item.sellingPrice)}
                        </div>
                        <div className="text-[10px] text-(--clr-fg-dim) mt-0.5">
                          Qty: {item.quantity} · {item.unit}
                        </div>
                      </div>
                    </div>

                    {item.reason && (
                      <p className="mt-2 text-xs text-(--clr-fg-muted) leading-relaxed border-t border-(--clr-border) pt-2">
                        {item.reason}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </FadeUp>

      {/* Total */}
      <FadeUp delay={0.06}>
        <div className="bento-card noise-overlay p-5 mt-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-(--clr-fg-muted)">Base total</span>
              <span className="font-mono text-(--clr-fg)">{formatCurrency(basket.baseTotal)}</span>
            </div>
            {hasCustomTotal && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-(--clr-fg-muted)">Custom total</span>
                <span className="font-mono text-(--clr-fg)">{formatCurrency(basket.customTotal!)}</span>
              </div>
            )}
            <div className="border-t border-(--clr-border) pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-(--clr-fg)">Total</span>
              <span className="font-mono text-lg font-bold text-(--clr-fg)">{formatCurrency(total)}</span>
            </div>
          </div>
        </div>
      </FadeUp>
    </div>
  );
}

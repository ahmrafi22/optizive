"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
import {
  LuTriangleAlert,
  LuTimer,
  LuPackage,
  LuArrowRight,
  LuArrowUpRight,
  LuTag,
  LuGift,
  LuStore,
  LuCircleAlert,
  LuTrendingUp,
  LuFlame,
  LuClock,
} from "react-icons/lu";

import {
  getExpiryDashboardStats,
  getExpiringProducts,
  predictAtRiskProducts,
  getClearanceSuggestions,
} from "@/backend/expiry-tracker/expiry-tracker";
import type {
  ExpiryDashboardStats,
  ExpiryProduct,
  ClearanceSuggestion,
} from "@/backend/expiry-tracker/expiry-tracker";

import {
  CATEGORY_PALETTES,
  EXPIRY_BADGES,
  EXPIRY_LABELS,
  formatCategory,
  formatCurrency,
} from "@/app/(user-routes)/inventory/_components/types";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const numberTiming = { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
const numberOpacityTiming = { duration: 720, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

function StatValue({ value, delayMs }: { value: number; delayMs: number }) {
  const [ready, setReady] = useState(false);
  const [flowValue, setFlowValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!ready) {
      setFlowValue(0);
      hasAnimatedRef.current = false;
      return;
    }
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const frame = window.requestAnimationFrame(() => setFlowValue(value));
      return () => window.cancelAnimationFrame(frame);
    }
    setFlowValue(value);
  }, [ready, value]);

  return (
    <NumberFlow
      willChange
      plugins={[continuous]}
      value={flowValue}
      locales="en-US"
      animated={ready}
      transformTiming={numberTiming}
      spinTiming={numberTiming}
      opacityTiming={numberOpacityTiming}
    />
  );
}

function getSalesHealth(product: ExpiryProduct): { color: string; bg: string; label: string; icon: string } {
  if (product.daysUntilExpiry === null) {
    return { color: "#60a5fa", bg: "rgba(96,165,250,0.08)", label: "No expiry date", icon: "#60a5fa" };
  }
  if (product.isAtRisk) {
    if (product.daysUntilExpiry <= 3) {
      return { color: "#dc2626", bg: "rgba(220,38,38,0.1)", label: "Critical — may not sell", icon: "#dc2626" };
    }
    return { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "At risk — may not sell", icon: "#f97316" };
  }
  if (product.daysUntilExpiry <= 0) {
    return { color: "#991b1b", bg: "rgba(153,27,27,0.1)", label: "Expired — overdue", icon: "#991b1b" };
  }
  if (product.daysUntilSoldOut !== null && product.dailySellRate > 0) {
    const ratio = product.daysUntilSoldOut / product.daysUntilExpiry;
    if (ratio <= 0.5) {
      return { color: "#34d399", bg: "rgba(52,211,153,0.1)", label: "Healthy — selling fast", icon: "#34d399" };
    }
    if (ratio <= 0.8) {
      return { color: "#eab308", bg: "rgba(234,179,8,0.1)", label: "Moderate — keep watching", icon: "#eab308" };
    }
    return { color: "#f97316", bg: "rgba(249,115,22,0.1)", label: "Slow — may need discount", icon: "#f97316" };
  }
  return { color: "#34d399", bg: "rgba(52,211,153,0.08)", label: "Healthy — selling well", icon: "#34d399" };
}

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

function StatCard({ label, value, hint, icon, accent, delayMs = 0 }: {
  label: string;
  value: number | string;
  hint: string;
  icon: React.ReactNode;
  accent: string;
  delayMs?: number;
}) {
  return (
    <div className="bento-card noise-overlay p-5 flex items-center gap-4">
      <div
        className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg"
        style={{ background: `${accent}20`, color: accent }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-(--clr-fg) tabular-nums">{typeof value === "number" ? <StatValue value={value} delayMs={delayMs} /> : value}</div>
        <div className="mt-0.5 text-xs text-(--clr-fg-muted)">{hint}</div>
      </div>
    </div>
  );
}

type UrgencyLevel = "EXPIRED" | "CRITICAL" | "SOON" | "WARNING" | "OK" | "FRESH";
const URGENCY_COLORS: Record<UrgencyLevel, { base: string; bg: string; dim: string }> = {
  EXPIRED:  { base: "#991b1b", bg: "rgba(153,27,27,0.12)", dim: "rgba(220,38,38,0.75)" },
  CRITICAL: { base: "#dc2626", bg: "rgba(220,38,38,0.10)", dim: "rgba(220,38,38,0.70)" },
  SOON:     { base: "#ef4444", bg: "rgba(239,68,68,0.08)", dim: "rgba(239,68,68,0.65)" },
  WARNING:  { base: "#f97316", bg: "rgba(249,115,22,0.08)", dim: "rgba(249,115,22,0.65)" },
  OK:       { base: "#eab308", bg: "rgba(234,179,8,0.08)", dim: "rgba(234,179,8,0.65)" },
  FRESH:    { base: "#60a5fa", bg: "rgba(96,165,250,0.08)", dim: "rgba(96,165,250,0.65)" },
};

function getUrgencyLevel(product: ExpiryProduct): UrgencyLevel {
  if (product.expiryStatus === "EXPIRED") return "EXPIRED";
  if (product.daysUntilExpiry === null) return "FRESH";
  if (product.daysUntilExpiry <= 3) return "CRITICAL";
  if (product.daysUntilExpiry <= 7) return "SOON";
  if (product.daysUntilExpiry <= 14) return "WARNING";
  if (product.daysUntilExpiry <= 30) return "OK";
  return "FRESH";
}

function ExpiryProductCard({ product }: { product: ExpiryProduct }) {
  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
  const urgency = getUrgencyLevel(product);
  const uc = URGENCY_COLORS[urgency];
  const salesHealth = getSalesHealth(product);
  const barWidth = product.daysUntilExpiry !== null
    ? Math.max(2, Math.min(100, ((product.daysUntilExpiry > 0 ? product.daysUntilExpiry : 0) / 90) * 100))
    : 100;

  return (
    <Link
      href={`/inventory/${product.id}`}
      className="group block overflow-hidden rounded-2xl border-[3px] bg-(--clr-surface) transition-all duration-300 hover:scale-[1.015] hover:shadow-xl cursor-pointer"
      style={{ borderColor: `${uc.base}60` }}
    >
      <div className="p-5 pb-0 space-y-4">
        {/* Row 1: Image + Name + Countdown */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-14 h-14 rounded-xl overflow-hidden relative border border-(--clr-border) shadow-xs">
              {product.imageLink ? (
                <img src={product.imageLink} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-(--clr-fg) leading-snug">{product.name}</h3>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-(--clr-fg-muted)">
                <span>{formatCategory(product.category)}</span>
                {product.batchNumber && (
                  <>
                    <span className="text-(--clr-fg-dim)">·</span>
                    <span>Batch {product.batchNumber}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Hero countdown */}
          <div className="shrink-0 flex flex-col items-end">
            <div className="flex items-baseline gap-0.5" style={{ color: uc.base }}>
              <span className="text-[32px] font-bold leading-none tabular-nums">
                {product.daysUntilExpiry !== null
                  ? product.daysUntilExpiry > 0
                    ? product.daysUntilExpiry
                    : 0
                  : "—"}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider">days</span>
            </div>
            <span className="text-[10px] uppercase tracking-wider" style={{ color: uc.dim }}>
              {product.expiryStatus === "EXPIRED"
                ? "Overdue"
                : product.daysUntilExpiry === null
                  ? "No expiry"
                  : product.daysUntilExpiry > 0
                    ? "remaining"
                    : "Overdue"}
            </span>
          </div>
        </div>

        {/* Row 2: Urgency progress bar */}
        <div className="space-y-1.5">
          <div className="h-2.5 rounded-full bg-(--clr-surface2) overflow-hidden relative">
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${barWidth}%` }}
              transition={{ duration: 0.8, ease: EASE_OUT }}
              style={{ background: uc.base }}
            />
          </div>
          <div className="flex justify-between text-[10px]">
            <span className="text-(--clr-fg-dim)">Now</span>
            {product.expiryDate && (
              <span className="font-medium tabular-nums" style={{ color: uc.dim }}>
                Expires {new Date(product.expiryDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </span>
            )}
          </div>
        </div>

        {/* Row 3: Info grid */}
        <div className="grid grid-cols-3 gap-px rounded-xl overflow-hidden border border-(--clr-border) bg-(--clr-border)">
          {[
            { label: "Stock", value: `${product.quantity}`, sub: product.unit },
            { label: "Price", value: formatCurrency(product.sellingPrice), sub: `Margin ${formatCurrency(product.margin)}` },
            { label: "Value", value: formatCurrency(product.value), sub: "at current stock" },
          ].map((item) => (
            <div key={item.label} className="bg-(--clr-surface) px-3 py-2.5">
              <div className="text-[9px] uppercase tracking-widest text-(--clr-fg-dim)">{item.label}</div>
              <div className="mt-0.5 text-sm font-semibold text-(--clr-fg) tabular-nums">{item.value}</div>
              <div className="text-[10px] text-(--clr-fg-muted)">{item.sub}</div>
            </div>
          ))}
        </div>

        {/* Row 4: Sales insight */}
        <div
          className="rounded-xl px-3.5 py-3 space-y-2"
          style={{ background: salesHealth.bg }}
        >
          <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: salesHealth.color }}>
            <LuFlame className="h-3.5 w-3.5 shrink-0" />
            <span>{salesHealth.label}</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-(--clr-fg-muted)">
            <span>Sells <span className="font-semibold tabular-nums" style={{ color: salesHealth.color }}>{product.dailySellRate.toFixed(1)}/day</span></span>
            {product.daysUntilSoldOut !== null && (
              <span className="tabular-nums">Stock lasts <span className="font-semibold" style={{ color: salesHealth.color }}>~{product.daysUntilSoldOut}d</span></span>
            )}
          </div>
          {product.isAtRisk && product.suggestedDiscount && (
            <div className="flex items-center gap-2 pt-1 border-t border-(--clr-border)">
              <span className="rounded-md px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: uc.base }}>
                -{product.suggestedDiscount}%
              </span>
              <span className="text-[11px] text-(--clr-fg-muted)">
                suggested discount to clear stock
              </span>
            </div>
          )}
        </div>

        {/* Row 5: Status + Action */}
        <div className="flex items-center justify-between -mx-5 px-5 py-3 border-t border-(--clr-border)">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${EXPIRY_BADGES[product.expiryStatus]}`}>
            {EXPIRY_LABELS[product.expiryStatus]}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-(--clr-fg-muted) group-hover:text-(--clr-fg) transition-colors duration-200">
            View Details
            <LuArrowUpRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function ClearanceCard({ suggestion }: { suggestion: ClearanceSuggestion }) {
  const urgencyColors: Record<string, string> = {
    HIGH:   "border-rose-500/30 bg-rose-500/10 text-rose-400",
    MEDIUM: "border-orange-400/30 bg-orange-400/10 text-orange-400",
    LOW:    "border-amber-400/30 bg-amber-400/10 text-amber-400",
  };

  return (
    <div className="bento-card noise-overlay p-5 space-y-3 group hover:scale-[1.01] transition-transform duration-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {suggestion.type === "DISCOUNT" ? (
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
              <LuTag className="h-4 w-4 text-emerald-400" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <LuGift className="h-4 w-4 text-violet-400" />
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-(--clr-fg)">{suggestion.productName}</p>
            <p className="text-xs text-(--clr-fg-muted)">
              {suggestion.type === "DISCOUNT" ? "Discount Offer" : "Bundle Offer"}
            </p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${urgencyColors[suggestion.urgency]}`}>
          {suggestion.urgency}
        </span>
      </div>

      {suggestion.type === "DISCOUNT" && suggestion.discountPercent !== null && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg font-bold text-(--clr-fg-muted) line-through">{formatCurrency(suggestion.sellingPrice)}</span>
          <span className="text-lg font-bold text-emerald-400">{formatCurrency(suggestion.suggestedPrice ?? 0)}</span>
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-400">
            -{suggestion.discountPercent}%
          </span>
        </div>
      )}

      {suggestion.type === "BUNDLE" && (
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <span className="text-(--clr-fg) font-semibold">{suggestion.productName}</span>
          <LuArrowRight className="h-3.5 w-3.5 text-(--clr-fg-muted) shrink-0" />
          <span className="text-(--clr-fg)">{suggestion.bundleWithName}</span>
          <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[11px] font-bold text-violet-400">BUNDLE</span>
        </div>
      )}

      <p className="text-xs text-(--clr-fg-muted) leading-relaxed">{suggestion.reason}</p>

      {suggestion.savingsAmount !== null && suggestion.savingsAmount > 0 && (
        <div className="text-xs text-emerald-400 font-semibold">
          Save {formatCurrency(suggestion.savingsAmount)}
        </div>
      )}
    </div>
  );
}

export default function ExpiryTrackerPage() {
  const [stats, setStats] = useState<ExpiryDashboardStats | null>(null);
  const [expiringProducts, setExpiringProducts] = useState<ExpiryProduct[]>([]);
  const [atRiskProducts, setAtRiskProducts] = useState<ExpiryProduct[]>([]);
  const [clearanceSuggestions, setClearanceSuggestions] = useState<ClearanceSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, expiringData, atRiskData, clearanceData] = await Promise.all([
        getExpiryDashboardStats(),
        getExpiringProducts(),
        predictAtRiskProducts(),
        getClearanceSuggestions(),
      ]);
      if (statsData) setStats(statsData);
      setExpiringProducts(expiringData);
      setAtRiskProducts(atRiskData);
      setClearanceSuggestions(clearanceData);
    } catch (err) {
      console.error("Failed to load expiry data", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-8">
        <div className="h-10 w-48 bg-(--clr-surface2) rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bento-card h-28 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bento-card h-64 animate-pulse" />
          <div className="bento-card h-64 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10">
      <FadeUp>
        <header className="flex items-center justify-between">
          <div>
            <h1 className="mt-3 text-3xl md:text-4xl font-naston text-(--clr-fg)">Expiry Tracker</h1>
          </div>
          <button
            type="button"
            onClick={fetchAll}
            className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover)"
          >
            <LuTrendingUp className="h-3.5 w-3.5" />
            Refresh
          </button>
        </header>
      </FadeUp>

      {/* Stats */}
      <FadeUp delay={0.04}>
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Expired Items"
            value={stats?.expired ?? 0}
            hint={`${formatCurrency(stats?.totalValueAtRisk ?? 0)} at risk`}
            icon={<LuTimer />}
            accent="#f87171"
            delayMs={600}
          />
          <StatCard
            label="Expiring Soon"
            value={stats?.expiringSoon ?? 0}
            hint="Within 7 days"
            icon={<LuTriangleAlert />}
            accent="#fb923c"
            delayMs={680}
          />
          <StatCard
            label="At Risk Items"
            value={stats?.atRisk ?? 0}
            hint={`Est. loss ${formatCurrency(stats?.potentialLoss ?? 0)}`}
            icon={<LuCircleAlert />}
            accent="#fbbf24"
            delayMs={760}
          />
          <StatCard
            label="Total Expirable"
            value={stats?.totalExpirable ?? 0}
            hint={`${stats?.fresh ?? 0} fresh · ${stats?.expiring ?? 0} expiring`}
            icon={<LuPackage />}
            accent="#34d399"
            delayMs={840}
          />
        </section>
      </FadeUp>

      {/* Expiring Products List */}
      <FadeUp delay={0.08}>
        <section className="space-y-4">
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) flex items-center gap-2">
            <LuClock className="h-3.5 w-3.5 text-(--clr-teal-dim)" />
            Products Expiring Within 30 Days
          </h2>
          {expiringProducts.length === 0 ? (
            <div className="bento-card noise-overlay p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
                <LuPackage className="h-5 w-5 text-(--clr-fg-muted)" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-(--clr-fg)">All clear!</h3>
              <p className="mt-2 text-sm text-(--clr-fg-muted)">
                No products are expiring within the next 30 days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {expiringProducts.map((product) => (
                <ExpiryProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </FadeUp>

      {/* AI At-Risk Predictions */}
      <FadeUp delay={0.12}>
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LuTrendingUp className="h-4 w-4 text-(--clr-teal-dim)" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
              AI Prediction — Items at Risk of Not Selling in Time
            </h2>
          </div>
          {atRiskProducts.length === 0 ? (
            <div className="bento-card noise-overlay p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2)">
                <LuStore className="h-5 w-5 text-(--clr-fg-muted)" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-(--clr-fg)">Low risk</h3>
              <p className="mt-2 text-sm text-(--clr-fg-muted)">
                Based on sales velocity, most items should sell before expiry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {atRiskProducts.slice(0, 9).map((product) => (
                <ExpiryProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>
      </FadeUp>

      {/* Clearance Suggestions */}
      <FadeUp delay={0.16}>
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LuTag className="h-4 w-4 text-(--clr-teal-dim)" />
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
              Clearance Suggestions — Discounts &amp; Bundles
            </h2>
          </div>
          {clearanceSuggestions.length === 0 ? (
            <div className="bento-card noise-overlay p-8 text-center">
              <p className="text-sm text-(--clr-fg-muted)">No clearance suggestions available.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {clearanceSuggestions.map((suggestion, index) => (
                <ClearanceCard key={`${suggestion.productId}-${index}`} suggestion={suggestion} />
              ))}
            </div>
          )}
        </section>
      </FadeUp>
    </div>
  );
}

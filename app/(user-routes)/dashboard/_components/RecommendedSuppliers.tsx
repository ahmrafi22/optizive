"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import NumberFlow, { continuous, type Format } from "@number-flow/react";
import { LuStore, LuStar, LuArrowRight, LuBadgeCheck, LuTruck, LuPercent } from "react-icons/lu";

import type { SupplierSummary } from "@/backend/supplier-recommender/types";
import { SUPPLIER_TAG_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const numberTiming = { duration: 900, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
const numberOpacityTiming = { duration: 720, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

function ScoreDisplay({ score, delayMs }: { score: number; delayMs: number }) {
  const [ready, setReady] = useState(false);
  const [flowValue, setFlowValue] = useState(0);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs]);

  useEffect(() => {
    if (!ready) { setFlowValue(0); hasAnimatedRef.current = false; return; }
    if (!hasAnimatedRef.current) {
      hasAnimatedRef.current = true;
      const frame = window.requestAnimationFrame(() => setFlowValue(score));
      return () => window.cancelAnimationFrame(frame);
    }
    setFlowValue(score);
  }, [ready, score]);

  return (
    <NumberFlow
      willChange
      plugins={[continuous]}
      value={flowValue}
      format={{ style: "decimal", maximumFractionDigits: 0 }}
      locales="en-US"
      animated={ready}
      suffix="%"
      transformTiming={numberTiming}
      spinTiming={numberTiming}
      opacityTiming={numberOpacityTiming}
    />
  );
}

interface RecommendedSuppliersProps {
  suppliers: SupplierSummary[];
}

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  return "text-rose-400";
}

function getScoreBg(score: number): string {
  if (score >= 80) return "bg-emerald-400/10";
  if (score >= 60) return "bg-amber-400/10";
  return "bg-rose-400/10";
}

export function RecommendedSuppliers({ suppliers }: RecommendedSuppliersProps) {
  if (!suppliers || suppliers.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay: 0.64, ease: EASE_OUT }}
      className="bento-card bento-card-no-hover noise-overlay overflow-hidden"
    >
      <div className="p-5 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-(--clr-teal-dim)/10">
            <LuStore className="h-5 w-5 text-(--clr-teal-dim)" />
          </div>
          <div>
            <p className="text-sm font-semibold text-(--clr-fg)">Recommended Suppliers</p>
          </div>
        </div>
        <Link
          href="/suppliers"
          className="inline-flex items-center gap-1 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3.5 py-1.5 text-[11px] font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-all"
        >
          View All
          <LuArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="divide-y divide-(--clr-border)">
        {suppliers.map((s, i) => (
          <Link
            key={s.id}
            href={`/suppliers/${s.id}`}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-(--clr-surface2)/50 cursor-pointer! group"
          >
            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-(--clr-surface2) border border-(--clr-border)">
              {s.profileImage ? (
                <img
                  src={s.profileImage}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-bold text-(--clr-fg-muted)">
                  {(s.businessName ?? s.name).charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-(--clr-fg) group-hover:text-(--clr-teal-dim) transition-colors truncate">
                  {s.businessName || s.name}
                </p>
                {s.isVerified && <LuBadgeCheck className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
              </div>
              <div className="flex items-center gap-3 text-xs text-(--clr-fg-muted) mt-0.5">
                <span className="flex items-center gap-1">
                  <LuStar className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {s.avgRating.toFixed(1)}
                </span>
                {s.deliveryTimeRange && (
                  <span className="flex items-center gap-1">
                    <LuTruck className="h-3 w-3 text-(--clr-fg-dim)" />
                    {DELIVERY_LABELS[s.deliveryTimeRange] ?? s.deliveryTimeRange}
                  </span>
                )}
                {s.supplierTags.includes("BULK_DISCOUNT") && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <LuPercent className="h-3 w-3" />
                    Bulk
                  </span>
                )}
              </div>
            </div>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 ${getScoreBg(s.matchScore)}`}>
              <span className={`text-xs font-bold ${getScoreColor(s.matchScore)}`}>
                <ScoreDisplay score={s.matchScore} delayMs={Math.round((0.64 + i * 0.08 + 0.4) * 1000)} />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}

const DELIVERY_LABELS: Record<string, string> = {
  SAME_DAY: "Same day",
  NEXT_DAY: "Next day",
  TWO_THREE_DAYS: "2-3 days",
  WITHIN_WEEK: "Within week",
  FLEXIBLE: "Flexible",
};

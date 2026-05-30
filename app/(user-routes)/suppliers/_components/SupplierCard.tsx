import Link from "next/link";
import { LuStar, LuShieldCheck, LuMapPin, LuTruck, LuPackage, LuBadgeCheck, LuPercent } from "react-icons/lu";
import type { SupplierSummary } from "@/backend/supplier-recommender/types";
import { SUPPLIER_TAG_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";
import { CATEGORY_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";

function getScoreColor(score: number): string {
  if (score >= 80) return "text-emerald-400";
  if (score >= 60) return "text-amber-400";
  if (score >= 40) return "text-orange-400";
  return "text-rose-400";
}

function getScoreBarColor(score: number): string {
  if (score >= 80) return "bg-emerald-400";
  if (score >= 60) return "bg-amber-400";
  if (score >= 40) return "bg-orange-400";
  return "bg-rose-400";
}

export function SupplierCard({ supplier }: { supplier: SupplierSummary }) {
  return (
    <Link
      href={`/suppliers/${supplier.id}`}
      className="bento-card noise-overlay flex flex-col cursor-pointer! group transition-all duration-300 hover:border-(--clr-border-hover) active:scale-[0.98]"
    >
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl bg-(--clr-surface2) border border-(--clr-border)">
              {supplier.profileImage ? (
                <img
                  src={supplier.profileImage}
                  alt={supplier.businessName ?? supplier.name}
                  className="h-full w-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-lg font-bold text-(--clr-fg-muted)">
                  {(supplier.businessName ?? supplier.name).charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-(--clr-fg) group-hover:text-(--clr-teal-dim) transition-colors">
                {supplier.businessName || supplier.name}
              </h3>
              {supplier.businessName && (
                <p className="truncate text-xs text-(--clr-fg-muted)">{supplier.name}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <LuStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-semibold text-(--clr-fg)">{supplier.avgRating.toFixed(1)}</span>
          </div>
        </div>

        {supplier.primaryCategory && (
          <div className="flex flex-wrap gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-[10px] text-(--clr-fg-muted)">
              {CATEGORY_LABELS.get(supplier.primaryCategory) ?? supplier.primaryCategory}
            </span>
            {supplier.isVerified && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] text-emerald-400">
                <LuBadgeCheck className="h-3 w-3" />
                Verified
              </span>
            )}
            {supplier.bulkDiscountAvailable && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[10px] text-amber-400">
                <LuPercent className="h-3 w-3" />
                Bulk Discount
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-(--clr-fg-muted)">
          {supplier.district && (
            <span className="inline-flex items-center gap-1">
              <LuMapPin className="h-3 w-3" />
              {supplier.district}{supplier.area ? `, ${supplier.area}` : ""}
            </span>
          )}
          {supplier.deliveryTimeRange && (
            <span className="inline-flex items-center gap-1">
              <LuTruck className="h-3 w-3" />
              {DELIVERY_TIME_LABELS.get(supplier.deliveryTimeRange) ?? supplier.deliveryTimeRange}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <LuPackage className="h-3 w-3" />
            {supplier.productCount} products
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {supplier.supplierTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-(--clr-teal-dim)/10 px-2 py-0.5 text-[10px] font-medium text-(--clr-teal-dim)"
            >
              {SUPPLIER_TAG_LABELS.get(tag) ?? tag}
            </span>
          ))}
          {supplier.supplierTags.length > 3 && (
            <span className="text-[10px] text-(--clr-fg-dim)">+{supplier.supplierTags.length - 3}</span>
          )}
        </div>

        {supplier.matchScore > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-(--clr-fg-dim)">Match Score</span>
              <span className={`font-bold ${getScoreColor(supplier.matchScore)}`}>
                {supplier.matchScore}%
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-(--clr-surface2) overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getScoreBarColor(supplier.matchScore)}`}
                style={{ width: `${supplier.matchScore}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

const DELIVERY_TIME_LABELS = new Map([
  ["SAME_DAY", "Same day"],
  ["NEXT_DAY", "Next day"],
  ["TWO_THREE_DAYS", "2-3 days"],
  ["WITHIN_WEEK", "Within week"],
  ["FLEXIBLE", "Flexible"],
]);

import Link from "next/link";
import { LuStar, LuBadgeCheck, LuMapPin, LuClock, LuPackage, LuTruck, LuExternalLink } from "react-icons/lu";
import type { SupplierDetail } from "@/backend/supplier-recommender/types";
import { CATEGORY_LABELS, SUPPLIER_TAG_LABELS, DELIVERY_TIME_LABELS, PRICING_TYPE_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";
import type { SupplierTag } from "@/prisma/generated/prisma/client";

const CURRENCY = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

export function SupplierHeader({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        {/* Left — Avatar + Name */}
        <div className="w-full lg:w-72 lg:shrink-0 p-8 flex flex-col items-center justify-center bg-neutral-900 border-b lg:border-b-0 lg:border-r border-neutral-800">
          <Link href={`/profile/${supplier.id}`} className="relative h-24 w-24 overflow-hidden rounded-3xl bg-neutral-800 border border-neutral-700 mb-4 block group">
            {supplier.profileImage ? (
              <img
                src={supplier.profileImage}
                alt={supplier.businessName ?? supplier.name}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-neutral-500">
                {(supplier.businessName ?? supplier.name).charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <Link href={`/profile/${supplier.id}`} className="hover:underline underline-offset-2">
            <h1 className="text-xl font-naston text-white text-center">
              {supplier.businessName || supplier.name}
            </h1>
          </Link>
          {supplier.businessName && (
            <p className="text-sm text-neutral-500 mt-0.5">{supplier.name}</p>
          )}
          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              <LuStar className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-white">{supplier.avgRating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-neutral-500">
              {supplier.totalTransactions} transactions
            </span>
          </div>
          {supplier.isVerified && (
            <div className="flex items-center gap-1 mt-3 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400">
              <LuBadgeCheck className="h-3.5 w-3.5" />
              Verified
            </div>
          )}
        </div>

        {/* Right — Details */}
        <div className="flex-1 p-6 lg:p-8 space-y-6">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {supplier.primaryCategory && (
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1 text-xs text-neutral-400">
                {CATEGORY_LABELS.get(supplier.primaryCategory) ?? supplier.primaryCategory}
              </span>
            )}
            {supplier.businessType && (
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1 text-xs text-neutral-400">
                {supplier.businessType}
              </span>
            )}
            {supplier.businessSize && (
              <span className="rounded-full border border-neutral-800 bg-neutral-900 px-3.5 py-1 text-xs text-neutral-400">
                {supplier.businessSize}
              </span>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">District</span>
              <p className="mt-1 font-medium text-white flex items-center gap-1.5">
                <LuMapPin className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                {supplier.district ?? "N/A"}{supplier.area ? `, ${supplier.area}` : ""}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Service Area</span>
              <p className="mt-1 font-medium text-white flex items-center gap-1.5">
                <LuTruck className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                {supplier.serviceArea ?? "N/A"}
                {supplier.serviceRadiusKm ? ` (${supplier.serviceRadiusKm}km)` : ""}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Delivery</span>
              <p className="mt-1 font-medium text-white flex items-center gap-1.5">
                <LuClock className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                {supplier.deliveryTimeRange ? (DELIVERY_TIME_LABELS.get(supplier.deliveryTimeRange) ?? supplier.deliveryTimeRange) : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Pricing</span>
              <p className="mt-1 font-medium text-white">
                {supplier.pricingType ? (PRICING_TYPE_LABELS.get(supplier.pricingType) ?? supplier.pricingType) : "N/A"}
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Products</span>
              <p className="mt-1 font-medium text-white flex items-center gap-1.5">
                <LuPackage className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                {supplier.productCount} items
              </p>
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Years</span>
              <p className="mt-1 font-medium text-white">
                {supplier.yearsInBusiness ? `${supplier.yearsInBusiness} years` : "N/A"}
              </p>
            </div>
          </div>

          {/* Tags */}
          {supplier.supplierTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {supplier.supplierTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-400"
                >
                  {SUPPLIER_TAG_LABELS.get(tag) ?? tag}
                </span>
              ))}
              {supplier.bulkDiscountAvailable && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-400">
                  Bulk Discount
                </span>
              )}
            </div>
          )}

          {/* Order Info */}
          {(supplier.minOrderValue || supplier.maxOrderValue || supplier.paymentTerms) && (
            <div className="border-t border-neutral-800 pt-5 grid grid-cols-2 sm:grid-cols-3 gap-5 text-sm">
              {supplier.minOrderValue && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Min Order</span>
                  <p className="mt-1 font-medium text-white">{CURRENCY.format(supplier.minOrderValue)}</p>
                </div>
              )}
              {supplier.maxOrderValue && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Max Order</span>
                  <p className="mt-1 font-medium text-white">{CURRENCY.format(supplier.maxOrderValue)}</p>
                </div>
              )}
              {supplier.paymentTerms && (
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-medium">Payment Terms</span>
                  <p className="mt-1 font-medium text-white">{supplier.paymentTerms}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { saveOnboarding } from "@/backend/onboarding";
import {
  type BusinessSize,
  type BusinessType,
  type BuyingPriority,
  type Category,
  type DeliveryMethod,
  type DeliveryTime,
  type DistancePreference,
  type NegotiationPreference,
  type PricingType,
  type ServiceArea,
  type SupplierTag,
} from "@/prisma/generated/prisma/client";

type UserRole = "STORE_OWNER" | "SUPPLIER" | "BOTH";

type SelectValue<T> = T | "";

type FormState = {
  name: string;
  role: UserRole;
  phone: string;
  businessName: string;
  businessType: SelectValue<BusinessType>;
  businessSize: SelectValue<BusinessSize>;
  district: string;
  area: string;
  primaryCategory: SelectValue<Category>;
  subCategories: Category[];
  monthlyPurchaseRange: string;
  pricingPreference: SelectValue<PricingType>;
  negotiationPreference: SelectValue<NegotiationPreference>;
  maxDeliveryTime: SelectValue<DeliveryTime>;
  preferredDistance: SelectValue<DistancePreference>;
  buyingPriority: SelectValue<BuyingPriority>;
  restockFrequency: string;
  serviceArea: SelectValue<ServiceArea>;
  serviceRadiusKm: string;
  deliveryMethod: SelectValue<DeliveryMethod>;
  deliveryTimeRange: SelectValue<DeliveryTime>;
  pricingType: SelectValue<PricingType>;
  bulkDiscountAvailable: string;
  orderCapacity: SelectValue<BusinessSize>;
  supplierTags: SupplierTag[];
};

const ROLE_OPTIONS: Array<{ value: UserRole; title: string; blurb: string }> = [
  { value: "STORE_OWNER", title: "Store Owner", blurb: "Buying for a shop or outlet" },
  { value: "SUPPLIER", title: "Supplier", blurb: "Selling inventory to others" },
  { value: "BOTH", title: "Both", blurb: "Buying and supplying" },
];

const BUSINESS_TYPES = [
  { value: "RETAILER", label: "Retailer" },
  { value: "WHOLESALER", label: "Wholesaler" },
  { value: "DISTRIBUTOR", label: "Distributor" },
  { value: "MANUFACTURER", label: "Manufacturer" },
  { value: "IMPORTER", label: "Importer" },
  { value: "EXPORTER", label: "Exporter" },
  { value: "TRADER", label: "Trader" },
  { value: "PROCESSOR", label: "Processor" },
  { value: "AGRO_PROCESSOR", label: "Agro processor" },
  { value: "APPAREL_FACTORY", label: "Apparel factory" },
  { value: "SERVICE_PROVIDER", label: "Service provider" },
];

const BUSINESS_SIZES = [
  { value: "SMALL", label: "Small" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LARGE", label: "Large" },
  { value: "ENTERPRISE", label: "Enterprise" },
];

const CATEGORIES = [
  { value: "GROCERIES", label: "Groceries" },
  { value: "FMCG", label: "FMCG" },
  { value: "FRESH_PRODUCE", label: "Fresh produce" },
  { value: "AGRO_PRODUCTS", label: "Agro products" },
  { value: "FISHERY_SEAFOOD", label: "Fishery and seafood" },
  { value: "MEAT_POULTRY", label: "Meat and poultry" },
  { value: "DAIRY", label: "Dairy" },
  { value: "ELECTRONICS", label: "Electronics" },
  { value: "MOBILE_ACCESSORIES", label: "Mobile accessories" },
  { value: "CLOTHING", label: "Clothing" },
  { value: "TEXTILES_APPAREL", label: "Textiles and apparel" },
  { value: "FOOTWEAR", label: "Footwear" },
  { value: "BEAUTY_PERSONAL_CARE", label: "Beauty and personal care" },
  { value: "HOME_APPLIANCE", label: "Home appliances" },
  { value: "FURNITURE", label: "Furniture" },
  { value: "HARDWARE", label: "Hardware" },
  { value: "CONSTRUCTION_MATERIALS", label: "Construction materials" },
  { value: "AUTO_PARTS", label: "Auto parts" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "STATIONERY", label: "Stationery" },
  { value: "OFFICE_SUPPLIES", label: "Office supplies" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "CHEMICALS", label: "Chemicals" },
  { value: "PLASTICS", label: "Plastics" },
  { value: "RESTAURANT_SUPPLY", label: "Restaurant supply" },
  { value: "HOSPITALITY_SUPPLY", label: "Hospitality supply" },
  { value: "OTHER", label: "Other" },
];

const PRICING_TYPES = [
  { value: "BUDGET", label: "Budget" },
  { value: "VALUE", label: "Value" },
  { value: "MID_RANGE", label: "Mid range" },
  { value: "PREMIUM", label: "Premium" },
];

const DELIVERY_TIMES = [
  { value: "SAME_DAY", label: "Same day" },
  { value: "NEXT_DAY", label: "Next day" },
  { value: "TWO_THREE_DAYS", label: "2-3 days" },
  { value: "WITHIN_WEEK", label: "Within week" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const DISTANCE_PREFERENCES = [
  { value: "NEIGHBORHOOD", label: "Neighborhood" },
  { value: "LOCAL", label: "Local" },
  { value: "CITY", label: "City" },
  { value: "REGIONAL", label: "Regional" },
  { value: "NATIONWIDE", label: "Nationwide" },
  { value: "INTERNATIONAL", label: "International" },
];

const SERVICE_AREAS = [
  { value: "LOCAL", label: "Local" },
  { value: "CITY", label: "City" },
  { value: "REGIONAL", label: "Regional" },
  { value: "NATIONWIDE", label: "Nationwide" },
  { value: "INTERNATIONAL", label: "International" },
];

const DELIVERY_METHODS = [
  { value: "SELF", label: "Self delivery" },
  { value: "COURIER", label: "Courier" },
  { value: "BOTH", label: "Both" },
  { value: "PICKUP", label: "Pickup" },
  { value: "FREIGHT", label: "Freight" },
];

const BUYING_PRIORITIES = [
  { value: "CHEAP", label: "Low cost" },
  { value: "FAST", label: "Fast" },
  { value: "QUALITY", label: "Quality" },
  { value: "RELIABILITY", label: "Reliability" },
  { value: "CONSISTENCY", label: "Consistency" },
];

const NEGOTIATION_PREFERENCES = [
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "FIXED", label: "Fixed" },
  { value: "NO_NEGOTIATION", label: "No negotiation" },
];

const MONTHLY_PURCHASE_RANGES = [
  { value: "UNDER_500", label: "Under 500" },
  { value: "500_2000", label: "500 - 2,000" },
  { value: "2000_10000", label: "2,000 - 10,000" },
  { value: "10000_PLUS", label: "10,000+" },
];

const RESTOCK_FREQUENCIES = [
  { value: "WEEKLY", label: "Weekly" },
  { value: "BIWEEKLY", label: "Bi-weekly" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "SEASONAL", label: "Seasonal" },
];

const SUPPLIER_TAGS = [
  { value: "FAST_DELIVERY", label: "Fast delivery" },
  { value: "BULK_DISCOUNT", label: "Bulk discount" },
  { value: "PREMIUM_QUALITY", label: "Premium quality" },
  { value: "LOW_PRICE", label: "Low price" },
  { value: "FACTORY_DIRECT", label: "Factory direct" },
  { value: "CASH_ON_DELIVERY", label: "Cash on delivery" },
  { value: "VAT_INVOICE", label: "VAT invoice" },
  { value: "HALAL_CERTIFIED", label: "Halal certified" },
  { value: "BSTI_CERTIFIED", label: "BSTI certified" },
  { value: "EXPORT_READY", label: "Export ready" },
  { value: "COLD_CHAIN", label: "Cold chain" },
  { value: "SAMPLE_AVAILABLE", label: "Sample available" },
];

const ORDER_CAPACITY = BUSINESS_SIZES;

const INPUT_BASE =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50";

const SELECT_BASE =
  "w-full rounded-xl border border-white/10 bg-[#1a1a1a] px-4 py-3 text-sm text-white transition-all focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/50";

const LABEL_BASE =
  "text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500";

function OptionalBadge() {
  return (
    <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Optional</span>
  );
}

export default function OnboardingForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    name: initialName,
    role: "STORE_OWNER",
    phone: "",
    businessName: "",
    businessType: "",
    businessSize: "",
    district: "",
    area: "",
    primaryCategory: "",
    subCategories: [],
    monthlyPurchaseRange: "",
    pricingPreference: "",
    negotiationPreference: "",
    maxDeliveryTime: "",
    preferredDistance: "",
    buyingPriority: "",
    restockFrequency: "",
    serviceArea: "",
    serviceRadiusKm: "",
    deliveryMethod: "",
    deliveryTimeRange: "",
    pricingType: "",
    bulkDiscountAvailable: "",
    orderCapacity: "",
    supplierTags: [],
  });

  const showBuyerFields = form.role === "STORE_OWNER" || form.role === "BOTH";
  const showSupplierFields = form.role === "SUPPLIER" || form.role === "BOTH";

  const requiredMissing = useMemo(() => {
    const missing: string[] = [];
    if (!form.name.trim()) missing.push("name");
    if (!form.phone.trim()) missing.push("phone");
    if (!form.businessName.trim()) missing.push("business name");
    if (!form.businessType) missing.push("business type");
    if (!form.businessSize) missing.push("business size");
    if (!form.district.trim()) missing.push("district");
    if (!form.area.trim()) missing.push("area");
    if (!form.primaryCategory) missing.push("primary category");
    return missing;
  }, [form]);

  const handleMultiSelect = (
    event: ChangeEvent<HTMLSelectElement>,
    key: "subCategories" | "supplierTags"
  ) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setForm((prev) => ({ ...prev, [key]: values as FormState[typeof key] }));
  };

  const handleSelect =
    <K extends keyof FormState>(key: K) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value as FormState[K] }));
    };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (requiredMissing.length > 0) {
      setError(`Please complete: ${requiredMissing.join(", ")}.`);
      return;
    }

    const radiusValue = form.serviceRadiusKm.trim()
      ? Number(form.serviceRadiusKm)
      : undefined;

    startTransition(async () => {
      try {
        const result = await saveOnboarding({
          name: form.name,
          role: form.role,
          phone: form.phone,
          businessName: form.businessName,
          businessType: form.businessType || undefined,
          businessSize: form.businessSize || undefined,
          district: form.district,
          area: form.area,
          primaryCategory: form.primaryCategory || undefined,
          subCategories: form.subCategories,
          monthlyPurchaseRange: form.monthlyPurchaseRange || undefined,
          pricingPreference: form.pricingPreference || undefined,
          negotiationPreference: form.negotiationPreference || undefined,
          maxDeliveryTime: form.maxDeliveryTime || undefined,
          preferredDistance: form.preferredDistance || undefined,
          buyingPriority: form.buyingPriority || undefined,
          restockFrequency: form.restockFrequency || undefined,
          serviceArea: form.serviceArea || undefined,
          serviceRadiusKm: Number.isFinite(radiusValue) ? radiusValue : undefined,
          deliveryMethod: form.deliveryMethod || undefined,
          deliveryTimeRange: form.deliveryTimeRange || undefined,
          pricingType: form.pricingType || undefined,
          bulkDiscountAvailable:
            form.bulkDiscountAvailable === "" ? undefined : form.bulkDiscountAvailable === "true",
          orderCapacity: form.orderCapacity || undefined,
          supplierTags: form.supplierTags,
        });

        if (!result?.ok) {
          setError(result?.message ?? "Something went wrong.");
          return;
        }

        router.push("/dashboard");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  return (
    <div className="flex min-h-[100dvh] flex-col lg:flex-row">
      <section className="relative flex min-h-[40vh] flex-col items-center justify-center bg-primary px-6 py-12 text-[#111111] lg:min-h-screen lg:w-[46%]">
        <div className="absolute left-6 top-6 text-xs font-semibold uppercase tracking-[0.2em] text-[#111111]/70">
          Onboarding
        </div>
        <div className="max-w-md text-center">
          <h1 className="font-naston text-4xl md:text-5xl tracking-widest">OPTIZIVE</h1>
          <p className="mt-4 font-instrument text-xl italic text-[#111111]/80">
            Shape your supply chain profile with Bangladesh-ready context and global reach.
          </p>
          <div className="mt-10 grid gap-3 text-left text-sm font-archivo text-[#111111]/80">
            <div className="rounded-2xl bg-white/90 px-4 py-3">
              Share the essentials, then refine later.
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3">
              Roles unlock the right fields instantly.
            </div>
            <div className="rounded-2xl bg-white/90 px-4 py-3">
              Optional data is clearly labeled.
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-start justify-center bg-[#111111] px-6 py-12 lg:py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-8">
          <div>
            <h2 className="font-naston text-3xl text-white">Let us set you up</h2>
            <p className="mt-2 font-archivo text-sm text-zinc-400">
              Fill the fields that matter for your role. You can update everything later.
            </p>
          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-[#141414] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={LABEL_BASE}>Full name</label>
                <input
                  className={INPUT_BASE}
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Your name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={LABEL_BASE}>Phone</label>
                <input
                  className={INPUT_BASE}
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="e.g. +8801XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className={LABEL_BASE}>You are</label>
              <div className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-[#1a1a1a] p-2 md:flex-row">
                {ROLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, role: option.value }))}
                    className={`relative flex-1 rounded-xl px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      form.role === option.value ? "text-[#111111]" : "text-zinc-300"
                    }`}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {form.role === option.value && (
                      <motion.div
                        layoutId="roleHighlight"
                        className="absolute inset-0 rounded-xl bg-primary"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="relative z-10">
                      <div className="font-archivo text-sm font-semibold">{option.title}</div>
                      <div
                        className={`text-xs ${
                          form.role === option.value
                            ? "text-[#111111]/70"
                            : "text-zinc-400"
                        }`}
                      >
                        {option.blurb}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5 rounded-3xl border border-white/10 bg-[#141414] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={LABEL_BASE}>Business name</label>
                <input
                  className={INPUT_BASE}
                  value={form.businessName}
                  onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                  placeholder="Your business name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={LABEL_BASE}>Business type</label>
                <select
                  className={SELECT_BASE}
                  value={form.businessType}
                  onChange={handleSelect("businessType")}
                  required
                >
                  <option value="">Select type</option>
                  {BUSINESS_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={LABEL_BASE}>Business size</label>
                <select
                  className={SELECT_BASE}
                  value={form.businessSize}
                  onChange={handleSelect("businessSize")}
                  required
                >
                  <option value="">Select size</option>
                  {BUSINESS_SIZES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className={LABEL_BASE}>Primary category</label>
                <select
                  className={SELECT_BASE}
                  value={form.primaryCategory}
                  onChange={handleSelect("primaryCategory")}
                  required
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={LABEL_BASE}>District</label>
                <input
                  className={INPUT_BASE}
                  value={form.district}
                  onChange={(event) => setForm((prev) => ({ ...prev, district: event.target.value }))}
                  placeholder="District"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className={LABEL_BASE}>Area</label>
                <input
                  className={INPUT_BASE}
                  value={form.area}
                  onChange={(event) => setForm((prev) => ({ ...prev, area: event.target.value }))}
                  placeholder="Area or zone"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className={LABEL_BASE}>Sub-categories</label>
                <OptionalBadge />
              </div>
              <select
                className={`${SELECT_BASE} h-32`}
                multiple
                value={form.subCategories}
                onChange={(event) => handleMultiSelect(event, "subCategories")}
              >
                {CATEGORIES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {showBuyerFields && (
            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#141414] p-6">
              <div>
                <h3 className="font-archivo text-base font-semibold text-white">Buyer preferences</h3>
                <p className="mt-1 text-xs text-zinc-500">Optional fields for store owners.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Monthly purchase range</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.monthlyPurchaseRange}
                    onChange={handleSelect("monthlyPurchaseRange")}
                  >
                    <option value="">Select range</option>
                    {MONTHLY_PURCHASE_RANGES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Pricing preference</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.pricingPreference}
                    onChange={handleSelect("pricingPreference")}
                  >
                    <option value="">Select pricing</option>
                    {PRICING_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Negotiation preference</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.negotiationPreference}
                    onChange={handleSelect("negotiationPreference")}
                  >
                    <option value="">Select preference</option>
                    {NEGOTIATION_PREFERENCES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Max delivery time</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.maxDeliveryTime}
                    onChange={handleSelect("maxDeliveryTime")}
                  >
                    <option value="">Select time</option>
                    {DELIVERY_TIMES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Preferred distance</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.preferredDistance}
                    onChange={handleSelect("preferredDistance")}
                  >
                    <option value="">Select distance</option>
                    {DISTANCE_PREFERENCES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Buying priority</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.buyingPriority}
                    onChange={handleSelect("buyingPriority")}
                  >
                    <option value="">Select priority</option>
                    {BUYING_PRIORITIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Restock frequency</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.restockFrequency}
                    onChange={handleSelect("restockFrequency")}
                  >
                    <option value="">Select frequency</option>
                    {RESTOCK_FREQUENCIES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {showSupplierFields && (
            <div className="space-y-5 rounded-3xl border border-white/10 bg-[#141414] p-6">
              <div>
                <h3 className="font-archivo text-base font-semibold text-white">Supplier details</h3>
                <p className="mt-1 text-xs text-zinc-500">Optional fields for suppliers.</p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Service area</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.serviceArea}
                    onChange={handleSelect("serviceArea")}
                  >
                    <option value="">Select area</option>
                    {SERVICE_AREAS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Service radius (km)</label>
                    <OptionalBadge />
                  </div>
                  <input
                    className={INPUT_BASE}
                    value={form.serviceRadiusKm}
                    onChange={(event) => setForm((prev) => ({ ...prev, serviceRadiusKm: event.target.value }))}
                    placeholder="e.g. 30"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Delivery method</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.deliveryMethod}
                    onChange={handleSelect("deliveryMethod")}
                  >
                    <option value="">Select method</option>
                    {DELIVERY_METHODS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Delivery time range</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.deliveryTimeRange}
                    onChange={handleSelect("deliveryTimeRange")}
                  >
                    <option value="">Select time</option>
                    {DELIVERY_TIMES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Pricing type</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.pricingType}
                    onChange={handleSelect("pricingType")}
                  >
                    <option value="">Select pricing</option>
                    {PRICING_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Bulk discount</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.bulkDiscountAvailable}
                    onChange={handleSelect("bulkDiscountAvailable")}
                  >
                    <option value="">Select</option>
                    <option value="true">Available</option>
                    <option value="false">Not available</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className={LABEL_BASE}>Order capacity</label>
                    <OptionalBadge />
                  </div>
                  <select
                    className={SELECT_BASE}
                    value={form.orderCapacity}
                    onChange={handleSelect("orderCapacity")}
                  >
                    <option value="">Select capacity</option>
                    {ORDER_CAPACITY.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className={LABEL_BASE}>Supplier tags</label>
                  <OptionalBadge />
                </div>
                <select
                  className={`${SELECT_BASE} h-32`}
                  multiple
                  value={form.supplierTags}
                  onChange={(event) => handleMultiSelect(event, "supplierTags")}
                >
                  {SUPPLIER_TAGS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {error && <p className="text-sm font-medium text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isPending}
            className="btn-press w-full rounded-xl bg-primary py-4 text-sm font-bold text-[#111111] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save and continue"}
          </button>
        </form>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { saveOnboarding } from "@/backend/onboarding";
import { MorphButton } from "@/components/landing-page/MorphButton";
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
  subCategories: string[];
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

const InlineInput = ({ value, onChange, placeholder, ...props }: any) => {
  const pStr = placeholder || "_______";
  const displayString = value.length > pStr.length ? value : pStr;

  return (
    <span className="relative inline-block group mx-1 align-baseline">
      <span className="invisible whitespace-pre px-1 font-sans text-2xl md:text-3xl font-bold italic text-primary">
        {displayString}
      </span>
      <input
        className="absolute inset-0 w-full bg-transparent border-b-2 border-dashed border-white/20 text-primary placeholder:text-white/20 focus:border-primary focus:border-solid focus:outline-none font-sans text-2xl md:text-3xl text-center font-bold italic transition-all"
        value={value}
        onChange={onChange}
        placeholder={pStr}
        {...props}
      />
    </span>
  );
};

const InlineSelect = ({ value, onChange, options, placeholder }: any) => {
  const label = options.find((o: any) => o.value === value)?.label || options.find((o: any) => o.value === value)?.title || placeholder || "_______";
  return (
    <span className="relative inline-block cursor-pointer group mx-1 align-baseline">
      <span className="invisible whitespace-pre px-4 font-sans text-2xl md:text-3xl font-bold italic text-primary">{label}</span>
      <select
        className="absolute inset-0 w-full appearance-none bg-transparent border-b-2 border-dashed border-white/20 text-primary focus:outline-none focus:border-primary focus:border-solid cursor-pointer font-sans text-2xl md:text-3xl text-center font-bold italic transition-all"
        value={value}
        onChange={onChange}
      >
        <option value="" disabled className="bg-[#111] font-sans text-base text-zinc-400 italic">{placeholder || "_______"}</option>
        {options.map((o: any) => (
          <option key={o.value} value={o.value} className="bg-[#111] font-sans text-base text-white">
            {o.label || o.title}
          </option>
        ))}
      </select>
      <span className="absolute right-0 top-[60%] -translate-y-1/2 pointer-events-none text-white/30 text-[10px] group-hover:text-primary transition-colors">▼</span>
    </span>
  );
};

const InlineMultiSelect = ({ values, onChange, options, placeholder }: any) => {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const matched = options.find((o: any) => o.label.toLowerCase() === inputValue.toLowerCase());
      if (matched) {
        if (!values.includes(matched.value)) {
          onChange([...values, matched.value]);
          setInputValue("");
        }
      } else if (inputValue.trim()) {
        if (!values.includes(inputValue.trim())) {
          onChange([...values, inputValue.trim()]);
          setInputValue("");
        }
      }
    } else if (e.key === "Backspace" && inputValue === "" && values.length > 0) {
      onChange(values.slice(0, -1));
    }
  };

  const filteredOptions = options.filter((o: any) => 
    o.label.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(o.value)
  );

  const pStr = values.length === 0 ? (placeholder || "_______") : "...";
  const displayString = inputValue.length > pStr.length ? inputValue : pStr;

  return (
    <span className="inline-flex flex-wrap items-center gap-2 align-middle mx-1 relative">
      {values.map((val: string) => {
        const option = options.find((o: any) => o.value === val);
        return (
          <span key={val} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 font-sans text-sm font-bold italic border border-primary/20 hover:border-primary/50 transition-colors relative top-[1px]">
            {option?.label || val}
            <button
              type="button"
              onClick={() => onChange(values.filter((v: string) => v !== val))}
              className="text-primary/70 hover:text-white ml-1 flex items-center justify-center focus:outline-none"
            >
              &times;
            </button>
          </span>
        );
      })}
      <span className="relative inline-block group">
        <span className="invisible whitespace-pre px-1 font-sans text-2xl md:text-3xl font-bold italic text-primary">
          {displayString}
        </span>
        <input
          ref={inputRef}
          className="absolute inset-0 w-full bg-transparent border-b-2 border-dashed border-white/20 text-primary placeholder:text-white/20 focus:border-primary focus:border-solid focus:outline-none font-sans text-2xl md:text-3xl text-center font-bold italic transition-all"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={pStr}
        />
        {isOpen && (filteredOptions.length > 0 || (inputValue.trim() && !options.find((o: any) => o.label.toLowerCase() === inputValue.toLowerCase()))) && (
          <div className="absolute top-[calc(100%+8px)] left-0 max-h-48 overflow-auto bg-[#1a1a1a] border border-white/10 rounded-xl shadow-xl z-50 p-1 flex flex-col min-w-[220px] text-left text-base font-medium">
            {filteredOptions.map((o: any) => (
              <button
                key={o.value}
                type="button"
                className="text-left px-3 py-2 text-zinc-300 font-sans text-base italic hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur
                  onChange([...values, o.value]);
                  setInputValue("");
                  inputRef.current?.focus();
                }}
              >
                {o.label}
              </button>
            ))}
            {inputValue.trim() && !options.find((o: any) => o.label.toLowerCase() === inputValue.toLowerCase()) && !values.includes(inputValue.trim()) && (
              <button
                type="button"
                className="text-left px-3 py-2 text-primary font-sans text-base italic hover:bg-white/5 rounded-lg transition-colors border-t border-white/5 mt-1"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange([...values, inputValue.trim()]);
                  setInputValue("");
                  inputRef.current?.focus();
                }}
              >
                Add "{inputValue.trim()}"...
              </button>
            )}
          </div>
        )}
      </span>
      <span className="pointer-events-none absolute right-[-14px] text-white/30 text-[10px] opacity-0 group-focus-within:opacity-100 transition-opacity">▼</span>
    </span>
  );
};

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

  const handleSelect =
    <K extends keyof FormState>(key: K) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value as FormState[K] }));
    };

  const handleSubmit = (event?: FormEvent<HTMLFormElement>) => {
    if (event) event.preventDefault();
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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0d0d0d] px-6 py-16 lg:py-24 overflow-x-hidden">
      <div className="w-full max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12"
        >
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4">
            Profile Setup
          </div>
          <h1 className="font-naston text-4xl md:text-5xl tracking-widest text-white mb-4">OPTIZIVE</h1>
          <p className="font-instrument text-xl md:text-2xl italic text-zinc-400">
            Tell us about your business context.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="w-full">
          <div className="font-archivo text-3xl md:text-4xl leading-[1.8] md:leading-[2] text-zinc-300 font-medium">
            <motion.div layout className="mb-10">
              Hello, my name is{" "}
              <InlineInput value={form.name} onChange={(e: any) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="your name" />
              and I can be reached at{" "}
              <InlineInput value={form.phone} onChange={(e: any) => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="phone number" />
              I am joining as a{" "}
              <InlineSelect value={form.role} onChange={handleSelect("role")} options={ROLE_OPTIONS} placeholder="role" />
            </motion.div>

            <motion.div layout className="mb-10">
              My business is called{" "}
              <InlineInput value={form.businessName} onChange={(e: any) => setForm(p => ({ ...p, businessName: e.target.value }))} placeholder="business name" />
              we operate as a{" "}
              <InlineSelect value={form.businessType} onChange={handleSelect("businessType")} options={BUSINESS_TYPES} placeholder="business type" />{" "}
              of{" "}
              <InlineSelect value={form.businessSize} onChange={handleSelect("businessSize")} options={BUSINESS_SIZES} placeholder="size" />{" "}
              scale and we are based in{" "}
              <InlineInput value={form.area} onChange={(e: any) => setForm(p => ({ ...p, area: e.target.value }))} placeholder="area" />
              ,{" "}
              <InlineInput value={form.district} onChange={(e: any) => setForm(p => ({ ...p, district: e.target.value }))} placeholder="district" />
            </motion.div>

            <motion.div layout className="mb-10">
              Our primary category is{" "}
              <InlineSelect value={form.primaryCategory} onChange={handleSelect("primaryCategory")} options={CATEGORIES} placeholder="category" />
              and we also deal with{" "}
              <InlineMultiSelect
                values={form.subCategories}
                onChange={(vals: string[]) => setForm(p => ({ ...p, subCategories: vals }))}
                options={CATEGORIES}
                placeholder="other categories (optional)"
              />
            </motion.div>

            <AnimatePresence mode="popLayout">
              {showBuyerFields && (
                <motion.div
                  key="buyer-fields"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.5 }}
                  className="mb-10 pt-10 border-t border-white/5"
                >
                  As a buyer, I usually purchase{" "}
                  <InlineSelect value={form.monthlyPurchaseRange} onChange={handleSelect("monthlyPurchaseRange")} options={MONTHLY_PURCHASE_RANGES} placeholder="an amount (optional)" />{" "}
                  per month, I prefer{" "}
                  <InlineSelect value={form.pricingPreference} onChange={handleSelect("pricingPreference")} options={PRICING_TYPES} placeholder="pricing (optional)" />{" "}
                  pricing and{" "}
                  <InlineSelect value={form.negotiationPreference} onChange={handleSelect("negotiationPreference")} options={NEGOTIATION_PREFERENCES} placeholder="negotiation (optional)" />{" "}
                  negotiation where my biggest priority is{" "}
                  <InlineSelect value={form.buyingPriority} onChange={handleSelect("buyingPriority")} options={BUYING_PRIORITIES} placeholder="priority (optional)" />{" "}
                  and I restock{" "}
                  <InlineSelect value={form.restockFrequency} onChange={handleSelect("restockFrequency")} options={RESTOCK_FREQUENCIES} placeholder="frequency (optional)" />
                  using suppliers within a{" "}
                  <InlineSelect value={form.preferredDistance} onChange={handleSelect("preferredDistance")} options={DISTANCE_PREFERENCES} placeholder="distance (optional)" />{" "}
                  distance and delivery within{" "}
                  <InlineSelect value={form.maxDeliveryTime} onChange={handleSelect("maxDeliveryTime")} options={DELIVERY_TIMES} placeholder="timeframe (optional)" />
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {showSupplierFields && (
                <motion.div
                  key="supplier-fields"
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20, filter: "blur(4px)" }}
                  transition={{ duration: 0.5 }}
                  className="mb-10 pt-10 border-t border-white/5"
                >
                  As a supplier, I serve the{" "}
                  <InlineSelect value={form.serviceArea} onChange={handleSelect("serviceArea")} options={SERVICE_AREAS} placeholder="service area (optional)" />{" "}
                  area within a{" "}
                  <InlineInput value={form.serviceRadiusKm} onChange={(e: any) => setForm(p => ({ ...p, serviceRadiusKm: e.target.value }))} placeholder="radius (optional)" />{" "}
                  km radius where I can offer{" "}
                  <InlineSelect value={form.deliveryMethod} onChange={handleSelect("deliveryMethod")} options={DELIVERY_METHODS} placeholder="delivery method (optional)" />{" "}
                  within{" "}
                  <InlineSelect value={form.deliveryTimeRange} onChange={handleSelect("deliveryTimeRange")} options={DELIVERY_TIMES} placeholder="timeframe (optional)" />
                  while providing{" "}
                  <InlineSelect value={form.pricingType} onChange={handleSelect("pricingType")} options={PRICING_TYPES} placeholder="pricing type (optional)" />{" "}
                  pricing and bulk discounts are{" "}
                  <InlineSelect value={form.bulkDiscountAvailable} onChange={handleSelect("bulkDiscountAvailable")} options={[{label: "available", value: "true"}, {label: "not available", value: "false"}]} placeholder="availability (optional)" />
                  where my operation can handle orders of{" "}
                  <InlineSelect value={form.orderCapacity} onChange={handleSelect("orderCapacity")} options={ORDER_CAPACITY} placeholder="capacity (optional)" />{" "}
                  size and I specialize in{" "}
                  <InlineMultiSelect
                    values={form.supplierTags}
                    onChange={(vals: string[]) => setForm(p => ({ ...p, supplierTags: vals as any }))}
                    options={SUPPLIER_TAGS}
                    placeholder="specialties (optional)"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.div layout className="pt-6 flex flex-col items-center gap-4">
            {error && (
              <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-medium text-red-400 bg-red-400/10 px-4 py-2 rounded-lg">
                {error}
              </motion.p>
            )}
            
            <div className="mt-4">
              <MorphButton
                isLoading={isPending}
                onClick={() => handleSubmit()}
              >
                Complete Profile
                <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </MorphButton>
            </div>
          </motion.div>
        </form>
      </div>
    </div>
  );
}

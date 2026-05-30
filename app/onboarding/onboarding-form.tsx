"use client";

import { useMemo, useState, useTransition, type ChangeEvent, type FormEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { saveOnboarding } from "@/backend/onboarding/onboarding";
import { MorphButton } from "@/components/landing-page/MorphButton";
import type { SupplierTag } from "@/prisma/generated/prisma/client";

import {
  ROLE_OPTIONS,
  BUSINESS_TYPES,
  BUSINESS_SIZES,
  CATEGORIES,
  PRICING_TYPES,
  DELIVERY_TIMES,
  DISTANCE_PREFERENCES,
  SERVICE_AREAS,
  DELIVERY_METHODS,
  BUYING_PRIORITIES,
  NEGOTIATION_PREFERENCES,
  MONTHLY_PURCHASE_RANGES,
  RESTOCK_FREQUENCIES,
  SUPPLIER_TAGS,
  ORDER_CAPACITY,
  BULK_DISCOUNT_OPTIONS,
} from "./_components/constants";
import type { FormState, TabId } from "./_components/types";
import { InlineInput } from "./_components/InlineInput";
import { InlineSelect } from "./_components/InlineSelect";
import { InlineMultiSelect } from "./_components/InlineMultiSelect";
import { WelcomeModal } from "./_components/WelcomeModal";

export default function OnboardingForm({ initialName }: { initialName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [currentTab, setCurrentTab] = useState<TabId>("personal");
  const [form, setForm] = useState<FormState>({
    name: initialName,
    role: "STORE_OWNER",
    phone: "",
    businessName: "",
    businessType: "",
    businessSize: "",
    yearsInBusiness: "",
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

  const tabs = [
    { id: "personal" as TabId, label: "Personal Info", number: 1 },
    { id: "business" as TabId, label: "Business Details", number: 2 },
    { id: "preferences" as TabId, label: "Preferences", number: 3 },
  ];

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

  const canProceedToNext = () => {
    if (currentTab === "personal") {
      return form.name.trim() && form.phone.trim();
    }
    if (currentTab === "business") {
      return form.businessName.trim() && form.businessType && form.businessSize && form.district.trim() && form.area.trim() && form.primaryCategory;
    }
    return true;
  };

  const isTabCompleted = (tabId: TabId) => {
    if (tabId === "personal") {
      return form.name.trim() && form.phone.trim();
    }
    if (tabId === "business") {
      return form.businessName.trim() && form.businessType && form.businessSize && form.district.trim() && form.area.trim() && form.primaryCategory;
    }
    return false;
  };

  const handleNext = () => {
    if (currentTab === "personal") setCurrentTab("business");
    else if (currentTab === "business") setCurrentTab("preferences");
  };

  const handlePrevious = () => {
    if (currentTab === "preferences") setCurrentTab("business");
    else if (currentTab === "business") setCurrentTab("personal");
  };

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
          yearsInBusiness: form.yearsInBusiness.trim()
            ? Number(form.yearsInBusiness)
            : undefined,
          supplierTags: form.supplierTags,
        });

        if (!result?.ok) {
          setError(result?.message ?? "Something went wrong.");
          return;
        }

        setShowWelcomeModal(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  };

  const handleRedirectToDashboard = useCallback(() => {
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#0d0d0d] px-6 py-16 lg:py-24 overflow-x-hidden">
      <div className="w-full max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-12 text-center"
        >
          <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary mb-4">
            Profile Setup
          </div>
          <h1 className="font-naston text-4xl md:text-5xl tracking-widest text-white mb-4">OPTIZIVE</h1>
          <p className="font-instrument text-xl md:text-2xl italic text-zinc-400">
            Tell us about your business context.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0}}
          animate={{ opacity: 1}}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-center gap-2 md:gap-4">
            {tabs.map((tab, index) => (
              <div key={tab.id} className="flex items-center">
                <button
                  type="button"
                  onClick={() => setCurrentTab(tab.id)}
                  className={`group flex items-center gap-2 md:gap-3 px-4 md:px-4 py-1.5 rounded-full transition-all duration-300 ${
                    currentTab === tab.id
                      ? "bg-primary/10 border-2 border-primary"
                      : "bg-white/5 border-2 border-white/10 hover:border-white/20"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center w-3 h-3 md:w-4.5 md:h-4.5 rounded-full font-bold text-md  transition-all ${
                      currentTab === tab.id
                        ? "bg-primary text-black"
                        : isTabCompleted(tab.id)
                        ? "bg-primary/80 text-black"
                        : "bg-white/10 text-white/50 group-hover:bg-white/20 group-hover:text-white/70"
                    }`}
                  >
                    {tab.number}
                  </span>
                  <span
                    className={`hidden sm:block font-sans text-sm md:text-base font-medium transition-all ${
                      currentTab === tab.id 
                        ? "text-primary" 
                        : isTabCompleted(tab.id)
                        ? "text-primary/70"
                        : "text-white/50 group-hover:text-white/70"
                    }`}
                  >
                    {tab.label}
                  </span>
                </button>
                {index < tabs.length - 1 && (
                  <div 
                    className={`w-6 md:w-12 h-[2px] mx-1 md:mx-2 transition-all duration-300 ${
                      isTabCompleted(tabs[index].id) ? "bg-primary" : "bg-white/10"
                    }`} 
                  />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <form onSubmit={handleSubmit} className="w-full">
          <AnimatePresence mode="wait">
            {/* Tab 1: Personal Info */}
            {currentTab === "personal" && (
              <motion.div
                key="personal"
                initial={{ opacity: 0}}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0,  }}
                className="font-archivo text-2xl md:text-3xl leading-[1.9] md:leading-[2.1] text-zinc-300 font-medium min-h-[300px]"
              >
                <div className="mb-8">
                  Hello, my name is{" "}
                  <InlineInput 
                    value={form.name} 
                    onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} 
                    placeholder="your name"
                    size="large"
                  />
                  {" "}and I can be reached at{" "}
                  <InlineInput 
                    value={form.phone} 
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setForm(p => ({ ...p, phone: value }));
                    }} 
                    placeholder="phone number"
                    size="large"
                    maxLength={11}
                  />
                  {" "}I am joining as a{" "}
                  <InlineSelect 
                    value={form.role} 
                    onChange={handleSelect("role")} 
                    options={ROLE_OPTIONS} 
                    placeholder="role"
                    size="large"
                  />
                </div>
              </motion.div>
            )}

            {/* Tab 2: Business Details */}
            {currentTab === "business" && (
              <motion.div
                key="business"
                initial={{ opacity: 0}}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-archivo text-2xl md:text-3xl leading-[1.9] md:leading-[2.1] text-zinc-300 font-medium min-h-[300px]"
              >
                <div className="mb-8">
                  My business is called{" "}
                  <InlineInput 
                    value={form.businessName} 
                    onChange={(e) => setForm(p => ({ ...p, businessName: e.target.value }))} 
                    placeholder="business name"
                    size="large"
                  />
                  {" "}we operate as a{" "}
                  <InlineSelect 
                    value={form.businessType} 
                    onChange={handleSelect("businessType")} 
                    options={BUSINESS_TYPES} 
                    placeholder="business type"
                    size="large"
                  />
                  {" "}of{" "}
                  <InlineSelect 
                    value={form.businessSize} 
                    onChange={handleSelect("businessSize")} 
                    options={BUSINESS_SIZES} 
                    placeholder="size"
                    size="large"
                  />
                  {" "}scale. We have been in business for{" "}
                  <InlineInput 
                    value={form.yearsInBusiness} 
                    onChange={(e) => setForm(p => ({ ...p, yearsInBusiness: e.target.value }))} 
                    placeholder="years"
                    size="large"
                  />
                  {" "}and are based in{" "}
                  <InlineInput 
                    value={form.area} 
                    onChange={(e) => setForm(p => ({ ...p, area: e.target.value }))} 
                    placeholder="area"
                    size="large"
                  />
                  {", "}
                  <InlineInput 
                    value={form.district} 
                    onChange={(e) => setForm(p => ({ ...p, district: e.target.value }))} 
                    placeholder="district"
                    size="large"
                  />
                </div>

                <div className="mb-8">
                  Our primary category is{" "}
                  <InlineSelect 
                    value={form.primaryCategory} 
                    onChange={handleSelect("primaryCategory")} 
                    options={CATEGORIES} 
                    placeholder="category"
                    size="large"
                  />
                  {" "}and we also deal with{" "}
                  <InlineMultiSelect
                    values={form.subCategories}
                    onChange={(vals: string[]) => setForm(p => ({ ...p, subCategories: vals }))}
                    options={CATEGORIES}
                    placeholder="other categories"
                    size="large"
                  />
                </div>
              </motion.div>
            )}

            {/* Tab 3: Preferences */}
            {currentTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0}}
                animate={{ opacity: 1 }}
                className="font-archivo text-xl md:text-2xl leading-[1.9] md:leading-[2.1] text-zinc-300 font-medium min-h-[300px]"
              >
                {showBuyerFields && (
                  <div className="mb-10 pb-10 border-b border-white/5">
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-primary/70 mb-6">
                      Buyer Preferences
                    </div>
                    <div>
                      As a buyer, I usually purchase{" "}
                      <InlineSelect 
                        value={form.monthlyPurchaseRange} 
                        onChange={handleSelect("monthlyPurchaseRange")} 
                        options={MONTHLY_PURCHASE_RANGES} 
                        placeholder="an amount"
                        size="base"
                      />
                      {" "}per month, I prefer{" "}
                      <InlineSelect 
                        value={form.pricingPreference} 
                        onChange={handleSelect("pricingPreference")} 
                        options={PRICING_TYPES} 
                        placeholder="pricing"
                        size="base"
                      />
                      {" "}pricing and{" "}
                      <InlineSelect 
                        value={form.negotiationPreference} 
                        onChange={handleSelect("negotiationPreference")} 
                        options={NEGOTIATION_PREFERENCES} 
                        placeholder="negotiation"
                        size="base"
                      />
                      {" "}negotiation where my biggest priority is{" "}
                      <InlineSelect 
                        value={form.buyingPriority} 
                        onChange={handleSelect("buyingPriority")} 
                        options={BUYING_PRIORITIES} 
                        placeholder="priority"
                        size="base"
                      />
                      {" "}and I restock{" "}
                      <InlineSelect 
                        value={form.restockFrequency} 
                        onChange={handleSelect("restockFrequency")} 
                        options={RESTOCK_FREQUENCIES} 
                        placeholder="frequency"
                        size="base"
                      />
                      {" "}using suppliers within a{" "}
                      <InlineSelect 
                        value={form.preferredDistance} 
                        onChange={handleSelect("preferredDistance")} 
                        options={DISTANCE_PREFERENCES} 
                        placeholder="distance"
                        size="base"
                      />
                      {" "}distance and delivery within{" "}
                      <InlineSelect 
                        value={form.maxDeliveryTime} 
                        onChange={handleSelect("maxDeliveryTime")} 
                        options={DELIVERY_TIMES} 
                        placeholder="timeframe"
                        size="base"
                      />
                    </div>
                  </div>
                )}

                {showSupplierFields && (
                  <div className="mb-10">
                    <div className="text-sm font-bold uppercase tracking-[0.2em] text-primary/70 mb-6">
                      Supplier Preferences
                    </div>
                    <div>
                      As a supplier, I serve the{" "}
                      <InlineSelect 
                        value={form.serviceArea} 
                        onChange={handleSelect("serviceArea")} 
                        options={SERVICE_AREAS} 
                        placeholder="service area"
                        size="base"
                      />
                      {" "}area within a{" "}
                      <InlineInput 
                        value={form.serviceRadiusKm} 
                        onChange={(e) => setForm(p => ({ ...p, serviceRadiusKm: e.target.value }))} 
                        placeholder="radius"
                        size="base"
                      />
                      {" "}km radius where I can offer{" "}
                      <InlineSelect 
                        value={form.deliveryMethod} 
                        onChange={handleSelect("deliveryMethod")} 
                        options={DELIVERY_METHODS} 
                        placeholder="delivery method"
                        size="base"
                      />
                      {" "}within{" "}
                      <InlineSelect 
                        value={form.deliveryTimeRange} 
                        onChange={handleSelect("deliveryTimeRange")} 
                        options={DELIVERY_TIMES} 
                        placeholder="timeframe"
                        size="base"
                      />
                      {" "}while providing{" "}
                      <InlineSelect 
                        value={form.pricingType} 
                        onChange={handleSelect("pricingType")} 
                        options={PRICING_TYPES} 
                        placeholder="pricing type"
                        size="base"
                      />
                      {" "}pricing and bulk discounts are{" "}
                      <InlineSelect 
                        value={form.bulkDiscountAvailable} 
                        onChange={handleSelect("bulkDiscountAvailable")} 
                        options={BULK_DISCOUNT_OPTIONS} 
                        placeholder="availability"
                        size="base"
                      />
                      {" "}where my operation can handle orders of{" "}
                      <InlineSelect 
                        value={form.orderCapacity} 
                        onChange={handleSelect("orderCapacity")} 
                        options={ORDER_CAPACITY} 
                        placeholder="capacity"
                        size="base"
                      />
                      {" "}size and I specialize in{" "}
                      <InlineMultiSelect
                        values={form.supplierTags}
                        onChange={(vals: string[]) => setForm(p => ({ ...p, supplierTags: vals as SupplierTag[] }))}
                        options={SUPPLIER_TAGS}
                        placeholder="specialties"
                        size="base"
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div layout className="pt-8 flex flex-col items-center gap-6">
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-sm font-medium text-red-400 bg-red-400/10 px-4 py-2 rounded-lg"
              >
                {error}
              </motion.p>
            )}
            
            <div className="flex items-center gap-4">
              {currentTab !== "personal" && (
                <button
                  type="button"
                  onClick={handlePrevious}
                  className="px-6 py-3 rounded-xl bg-white/5 border-2 border-white/10 text-white/70 hover:border-white/20 hover:text-white transition-all font-sans font-medium"
                >
                  <svg className="mr-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Previous
                </button>
              )}

              {currentTab !== "preferences" ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedToNext()}
                  className="px-6 py-3 rounded-xl bg-primary text-black font-sans font-bold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <svg className="ml-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ) : (
                <MorphButton
                  isLoading={isPending}
                  onClick={() => handleSubmit()}
                >
                  Complete Profile
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </MorphButton>
              )}
            </div>
          </motion.div>
        </form>
      </div>

      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
        onRedirect={handleRedirectToDashboard}
      />
    </div>
  );
}

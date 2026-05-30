"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { FiLoader } from "react-icons/fi";
import {
  LuPlus,
  LuX,
  LuSparkles,
  LuSave,
  LuGlobe,
  LuLock,
  LuPackage,
} from "react-icons/lu";

import {
  createSmartBasket,
  getProductById,
  getSmartBasketRuleRecommendations,
  getSmartBasketAiRecommendations,
} from "@/backend/smart-basket/smart-basket";
import type {
  SmartBasketProductSummary,
  SmartBasketSuggestionItem,
} from "@/backend/smart-basket/smart-basket";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
} from "@/app/(user-routes)/inventory/_components/types";
import { ProductPickerDialog } from "../_components/ProductPickerDialog";

const MAX_PRODUCTS = 3;

const btnActive = "active:scale-[0.97] transition-transform duration-150";

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

function SuggestionSkeleton() {
  return (
    <div className="bento-card bento-card-no-hover noise-overlay overflow-hidden">
      <div className="aspect-square w-full bg-(--clr-surface) animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-3/4 rounded-full bg-(--clr-surface) animate-pulse" />
        <div className="h-2.5 w-1/2 rounded-full bg-(--clr-surface) animate-pulse" />
        <div className="h-2 w-full rounded-full bg-(--clr-surface) animate-pulse mt-3" />
      </div>
    </div>
  );
}

export default function SmartBasketCreatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectId = searchParams.get("productId");

  const [selectedProducts, setSelectedProducts] = useState<SmartBasketProductSummary[]>([]);
  const [suggestions, setSuggestions] = useState<{ rule: SmartBasketSuggestionItem[]; ai: SmartBasketSuggestionItem[] }>({
    rule: [],
    ai: [],
  });
  const [title, setTitle] = useState("Great Value Basket");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [saveAsBundle, setSaveAsBundle] = useState(true);
  const [customTotal, setCustomTotal] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isSuggestingRules, setIsSuggestingRules] = useState(false);
  const [isSuggestingAi, setIsSuggestingAi] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);

  const selectedIds = useMemo(() => selectedProducts.map((item) => item.id), [selectedProducts]);
  const baseTotal = useMemo(
    () => selectedProducts.reduce((sum, item) => sum + item.sellingPrice, 0),
    [selectedProducts],
  );
  const suggestionsPaused = selectedProducts.length >= MAX_PRODUCTS;
  const hasSeedProducts = selectedProducts.length > 0;

  const trimmedCustomTotal = customTotal.trim();
  const parsedCustomTotal = trimmedCustomTotal ? Number(trimmedCustomTotal) : Number.NaN;
  const customTotalValue = Number.isFinite(parsedCustomTotal) && parsedCustomTotal > 0 ? parsedCustomTotal : null;
  const finalTotal = customTotalValue ?? baseTotal;

  useEffect(() => {
    if (!preselectId) return;
    let active = true;
    const productId = preselectId;

    async function loadProduct() {
      const product = await getProductById(productId);
      if (!product || !active) return;
      setSelectedProducts((prev) => {
        if (prev.find((item) => item.id === product.id) || prev.length >= MAX_PRODUCTS) return prev;
        return [...prev, product];
      });
    }

    loadProduct();

    return () => {
      active = false;
    };
  }, [preselectId]);

  useEffect(() => {
    if (selectedProducts.length === 0 || selectedProducts.length >= MAX_PRODUCTS) {
      requestIdRef.current += 1;
      setSuggestions({ rule: [], ai: [] });
      setIsSuggestingRules(false);
      setIsSuggestingAi(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsSuggestingRules(true);
    setIsSuggestingAi(true);

    const ids = selectedProducts.map((item) => item.id);

    const timer = window.setTimeout(async () => {
      if (requestId !== requestIdRef.current) return;

      getSmartBasketRuleRecommendations(ids).then((ruleResult) => {
        if (requestId !== requestIdRef.current) return;
        setSuggestions((prev) => ({ ...prev, rule: ruleResult ?? [] }));
        setIsSuggestingRules(false);
      });

      getSmartBasketAiRecommendations(ids).then((aiResult) => {
        if (requestId !== requestIdRef.current) return;
        setSuggestions((prev) => ({ ...prev, ai: aiResult ?? [] }));
        setIsSuggestingAi(false);
      });
    }, 320);

    return () => window.clearTimeout(timer);
  }, [selectedProducts]);

  const handleAddProduct = (product: SmartBasketProductSummary) => {
    setSelectedProducts((prev) => {
      if (prev.find((item) => item.id === product.id)) return prev;
      if (prev.length >= MAX_PRODUCTS) return prev;
      return [...prev, product];
    });
    setIsPickerOpen(false);
  };

  const handleRemoveProduct = (productId: string) => {
    setSelectedProducts((prev) => prev.filter((item) => item.id !== productId));
  };

  const handleSave = async () => {
    setError(null);

    if (!title.trim()) {
      setError("Basket title is required.");
      return;
    }

    if (selectedProducts.length === 0) {
      setError("Select at least one product to continue.");
      return;
    }

    setIsSaving(true);

    const result = await createSmartBasket({
      title: title.trim(),
      description: description.trim() || null,
      productIds: selectedProducts.map((item) => item.id),
      isPublic,
      customTotal: customTotalValue,
      saveAsBundle,
    });

    setIsSaving(false);

    if (!result.ok) {
      setError(result.message ?? "Failed to save smart basket.");
      return;
    }

    router.push("/smart-basket");
  };

  const renderSlot = (index: number) => {
    const product = selectedProducts[index];

    if (!product) {
      return (
        <button
          type="button"
          onClick={() => setIsPickerOpen(true)}
          className={`${btnActive} bento-card bento-card-no-hover noise-overlay overflow-hidden border-dashed border-(--clr-border) bg-(--clr-surface2)/50 hover:border-(--clr-border-hover) flex flex-col w-full min-h-75`}
        >
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface) mx-auto mb-2">
                <LuPlus className="h-4 w-4" />
              </span>
              <div className="text-sm font-semibold text-(--clr-fg-muted)">Add product</div>
            </div>
          </div>
        </button>
      );
    }

    const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;

    return (
      <div className="bento-card noise-overlay overflow-hidden relative flex flex-col w-full">
        <button
          type="button"
          onClick={() => handleRemoveProduct(product.id)}
          className={`${btnActive} absolute right-2 top-2 z-10 rounded-full border border-(--clr-border) bg-(--clr-surface2) p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg) opacity-70 hover:opacity-100 transition-opacity`}
        >
          <LuX className="h-3.5 w-3.5" />
        </button>
        <div className="w-full aspect-square border-b border-(--clr-border) relative p-3">
          <img
            src={product.imageLink || ''}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'block';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'none';
            }}
            style={{ display: product.imageLink ? 'block' : 'none' }}
          />
          <div
            className="absolute inset-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
              display: product.imageLink ? 'none' : 'block'
            }}
          />
        </div>
        <div className="p-3 flex flex-col gap-1.5">
          <h3 className="text-sm font-semibold text-(--clr-fg) truncate">{product.name}</h3>
          <div className="flex items-center justify-between gap-2">
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold truncate max-w-[60%]"
              style={{
                borderColor: `${palette.from}40`,
                backgroundColor: `${palette.from}18`,
                color: palette.from,
              }}
            >
              {formatCategory(product.category)}
            </span>
            <span className="font-mono text-sm font-bold text-(--clr-fg) shrink-0">{formatCurrency(product.sellingPrice)}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSuggestion = (item: SmartBasketSuggestionItem) => {
    const isAdded = selectedIds.includes(item.id);
    const palette = CATEGORY_PALETTES[item.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;
    const matchPercent = Math.round(item.matchPercent ?? 0);

    return (
      <div key={item.id} className="bento-card noise-overlay overflow-hidden flex flex-col">
        <div className="w-full aspect-square border-b border-(--clr-border) relative p-3">
          <img
            src={item.imageLink || ''}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'block';
            }}
            onLoad={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'block';
              const fallback = target.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'none';
            }}
            style={{ display: item.imageLink ? 'block' : 'none' }}
          />
          <div
            className="absolute inset-3 rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`,
              display: item.imageLink ? 'none' : 'block'
            }}
          />
          <span
            className="absolute right-4 top-4 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
            style={{
              borderColor: matchPercent >= 80 ? '#fff44f' : '#60a5fa',
              backgroundColor: matchPercent >= 80 ? '#fff44f' : '#60a5fa',
              color: matchPercent >= 80 ? '#1a1a1a' : '#ffffff',
            }}
          >
            {matchPercent}% match
          </span>
        </div>
        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <h3 className="text-sm font-semibold text-(--clr-fg) line-clamp-2 leading-snug">{item.name}</h3>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
              style={{
                borderColor: `${palette.from}40`,
                backgroundColor: `${palette.from}18`,
                color: palette.from,
              }}
            >
              {formatCategory(item.category)}
            </span>
            <span className="font-mono text-sm font-bold text-(--clr-fg)">{formatCurrency(item.sellingPrice)}</span>
          </div>
          {item.reason && (
            <p className="text-[11px] text-(--clr-fg-muted) leading-relaxed mt-0.5">{item.reason}</p>
          )}
          <div className="mt-auto pt-1.5">
            <button
              type="button"
              onClick={() => handleAddProduct({
                id: item.id,
                name: item.name,
                category: item.category,
                sellingPrice: item.sellingPrice,
                costPrice: 0,
                quantity: item.quantity,
                unit: item.unit,
                imageLink: item.imageLink,
                isActive: true,
                expiryDate: null,
                margin: 0,
              })}
              disabled={isAdded || selectedProducts.length >= MAX_PRODUCTS}
              className={`${btnActive} inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-(--clr-border) bg-(--clr-surface) px-3 py-1.5 text-[11px] font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-colors disabled:opacity-50`}
            >
              <LuPlus className="h-3 w-3" />
              {isAdded ? "Added" : "Add"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative pb-10">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* LEFT SIDEBAR */}
        <div className="xl:sticky xl:top-24 xl:w-90 shrink-0 space-y-6 z-10">
          <FadeUp delay={0}>
            <header>
              <h1 className="font-naston text-3xl md:text-5xl text-(--clr-fg)">
                Smart Basket Creator
              </h1>
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
              <h2 className="text-sm font-semibold text-(--clr-fg)">Basket details</h2>
              <div className="grid gap-4">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">Title</span>
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">Description</span>
                  <textarea
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    rows={3}
                    className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition"
                    placeholder="Optional note for shoppers"
                  />
                </label>

                <div className="flex flex-wrap gap-3 justify-end">
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm cursor-pointer">
                    <span className="flex items-center gap-2 text-(--clr-fg)">
                      {isPublic ? <LuGlobe className="h-4 w-4" /> : <LuLock className="h-4 w-4" />}
                      Public
                    </span>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(event) => setIsPublic(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                  <label className="inline-flex items-center gap-3 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm cursor-pointer">
                    <span className="flex items-center gap-2 text-(--clr-fg)">
                      <LuPackage className="h-4 w-4" />
                      Save
                    </span>
                    <input
                      type="checkbox"
                      checked={saveAsBundle}
                      onChange={(event) => setSaveAsBundle(event.target.checked)}
                      className="h-4 w-4"
                    />
                  </label>
                </div>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <div className="bento-card bento-card-no-hover noise-overlay p-5 space-y-5">
              <h2 className="text-sm font-semibold text-(--clr-fg)">Pricing</h2>
              <div className="flex items-center justify-between">
                <span className="text-xs text-(--clr-fg-muted)">Base total</span>
                <span className="font-mono text-base font-bold text-(--clr-fg)">{formatCurrency(baseTotal)}</span>
              </div>
              <div className="border-t border-(--clr-border) pt-5 space-y-2">
                <span className="block text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
                  Custom total
                </span>
                <input
                  value={customTotal}
                  onChange={(event) => setCustomTotal(event.target.value)}
                  placeholder="Override total price"
                  className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-(--clr-fg-muted)">Final total</span>
                <span className="font-mono text-base font-bold text-(--clr-fg)">{formatCurrency(finalTotal)}</span>
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.12}>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`${btnActive} w-full inline-flex items-center justify-center gap-2 rounded-full bg-(--clr-yellow) px-5 py-2.5 text-sm font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim) disabled:opacity-60`}
            >
              <LuSave className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save smart basket"}
            </button>
          </FadeUp>
        </div>

        {/* RIGHT CONTENT */}
        <section className="flex-1 min-w-0 space-y-6 w-full">
          <FadeUp delay={0}>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-(--clr-fg)">Selected products</h2>
                <span className="text-xs text-(--clr-fg-muted)">
                  <span className="font-mono">{selectedProducts.length}</span>/{MAX_PRODUCTS} selected
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                {Array.from({ length: MAX_PRODUCTS }).map((_, index) => (
                  <div key={index}>{renderSlot(index)}</div>
                ))}
              </div>
            </div>
          </FadeUp>

          <FadeUp delay={0.08}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
                <LuSparkles className="h-3 w-3 text-(--clr-teal-dim)" />
                <span>Rule picks</span>
                {isSuggestingRules && <FiLoader className="h-3 w-3 animate-spin" />}
              </div>
              {!hasSeedProducts ? (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  Add a product to see rule matches.
                </div>
              ) : suggestionsPaused ? (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  Suggestions paused for full basket.
                </div>
              ) : suggestions.rule.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {suggestions.rule.map(renderSuggestion)}
                </div>
              ) : isSuggestingRules ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SuggestionSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  No rule-based matches yet.
                </div>
              )}
            </div>
          </FadeUp>

          <FadeUp delay={0.16}>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
                <LuSparkles className="h-3 w-3 text-(--clr-teal-dim)" />
                <span>AI picks</span>
                {isSuggestingAi && <FiLoader className="h-3 w-3 animate-spin" />}
              </div>
              {!hasSeedProducts ? (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  Add a product to see AI matches.
                </div>
              ) : suggestionsPaused ? (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  Suggestions paused for full basket.
                </div>
              ) : suggestions.ai.length > 0 ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {suggestions.ai.map(renderSuggestion)}
                </div>
              ) : isSuggestingAi ? (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <SuggestionSkeleton key={i} />
                  ))}
                </div>
              ) : (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  AI picks will appear when available.
                </div>
              )}
            </div>
          </FadeUp>
        </section>
      </div>

      <ProductPickerDialog
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelect={handleAddProduct}
        excludedIds={selectedIds}
      />
    </div>
  );
}

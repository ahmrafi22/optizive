"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
          className={`${btnActive} bento-card bento-card-no-hover noise-overlay overflow-hidden border-dashed border-(--clr-border) bg-(--clr-surface2)/50 hover:border-(--clr-border-hover) flex flex-col w-full`}
        >
          <div className="h-40 w-full flex items-center justify-center border-b border-(--clr-border)">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface)">
              <LuPlus className="h-4 w-4" />
            </span>
          </div>
          <div className="p-3">
            <div className="text-sm font-semibold text-(--clr-fg-muted)">Add product</div>
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
          className={`${btnActive} absolute right-2 top-2 z-10 rounded-full border border-(--clr-border) bg-(--clr-surface2) p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-(--clr-fg)`}
        >
          <LuX className="h-3.5 w-3.5" />
        </button>
        <div className="h-32 w-full border-b border-(--clr-border)">
          {product.imageLink ? (
            <img src={product.imageLink} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
            />
          )}
        </div>
        <div className="p-3">
          <div className="text-sm font-semibold text-(--clr-fg) truncate">{product.name}</div>
          <div className="mt-1 text-xs text-(--clr-fg-muted) truncate">
            {formatCategory(product.category)} - <span className="font-mono">{formatCurrency(product.sellingPrice)}</span>
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
      <div key={item.id} className="bento-card noise-overlay overflow-hidden">
        <div className="relative">
          <div className="aspect-square w-full border-b border-(--clr-border)">
            {item.imageLink ? (
              <img src={item.imageLink} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }} />
            )}
          </div>
          <span className="absolute right-3 top-3 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2 py-0.5 text-[10px] font-semibold text-(--clr-fg)">
            Match {matchPercent}%
          </span>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-sm font-semibold text-(--clr-fg)">{item.name}</div>
          <div className="text-xs text-(--clr-fg-muted)">
            {formatCategory(item.category)} - <span className="font-mono">{formatCurrency(item.sellingPrice)}</span>
          </div>
          <div className="text-xs text-(--clr-fg-muted)">{item.reason}</div>
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
    );
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl md:text-4xl font-naston text-(--clr-fg)">Smart Basket Creator</h1>
      </header>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-300">
          {error}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
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
        </div>

        <aside className="space-y-6">
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

          <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className={`${btnActive} inline-flex items-center justify-center gap-2 rounded-full bg-(--clr-yellow) px-5 py-2.5 text-sm font-semibold text-(--clr-charcoal) hover:bg-(--clr-yellow-dim) disabled:opacity-60`}
          >
            <LuSave className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save smart basket"}
          </button>
          </div>
        </aside>
      </section>

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

      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-(--clr-fg)">
          <LuSparkles className="h-4 w-4 text-(--clr-teal-dim)" />
          Rule + AI suggestions
        </div>
        {!hasSeedProducts && (
          <p className="text-xs text-(--clr-fg-muted)">Select at least one product to load suggestions.</p>
        )}
        {suggestionsPaused && (
          <p className="text-xs text-(--clr-fg-muted)">Max products selected. Remove one to see suggestions.</p>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {suggestions.rule.map(renderSuggestion)}
                </div>
              ) : isSuggestingRules ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bento-card bento-card-no-hover noise-overlay h-56 animate-pulse bg-(--clr-surface2)" />
                  ))}
                </div>
              ) : (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  No rule-based matches yet.
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-(--clr-fg-dim)">
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
                <div className="grid gap-4 sm:grid-cols-2">
                  {suggestions.ai.map(renderSuggestion)}
                </div>
              ) : isSuggestingAi ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="bento-card bento-card-no-hover noise-overlay h-56 animate-pulse bg-(--clr-surface2)" />
                  ))}
                </div>
              ) : (
                <div className="bento-card bento-card-no-hover noise-overlay p-4 text-xs text-(--clr-fg-muted)">
                  AI picks will appear when available.
                </div>
              )}
            </div>
        </div>
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

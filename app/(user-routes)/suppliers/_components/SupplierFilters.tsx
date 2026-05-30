"use client";

import { useCallback, useRef, useState } from "react";
import { LuSearch, LuX, LuSlidersHorizontal } from "react-icons/lu";
import { CATEGORY_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";
import { SUPPLIER_TAG_LABELS } from "@/app/(user-routes)/profile/_components/profile-helpers";
import type { SupplierSearchFilters } from "@/backend/supplier-recommender/types";

const PRICING_OPTIONS = [
  { value: "BUDGET", label: "Budget" },
  { value: "VALUE", label: "Value" },
  { value: "MID_RANGE", label: "Mid range" },
  { value: "PREMIUM", label: "Premium" },
];

const DELIVERY_OPTIONS = [
  { value: "SAME_DAY", label: "Same day" },
  { value: "NEXT_DAY", label: "Next day" },
  { value: "TWO_THREE_DAYS", label: "2-3 days" },
  { value: "WITHIN_WEEK", label: "Within week" },
  { value: "FLEXIBLE", label: "Flexible" },
];

const SUPPLIER_TAG_OPTIONS = Array.from(SUPPLIER_TAG_LABELS.entries()).map(([value, label]) => ({
  value,
  label,
}));

const SORT_OPTIONS = [
  { value: "matchScore" as const, label: "Best Match" },
  { value: "rating" as const, label: "Highest Rated" },
  { value: "delivery" as const, label: "Fastest Delivery" },
  { value: "transactions" as const, label: "Most Transactions" },
];

interface SupplierFiltersProps {
  categories: { value: string; count: number }[];
  districts: { value: string; count: number }[];
  onFiltersChange: (filters: SupplierSearchFilters) => void;
  onSearch: (search: string) => void;
  initialSearch?: string;
}

export function SupplierFilters({
  categories,
  districts,
  onFiltersChange,
  onSearch,
  initialSearch,
}: SupplierFiltersProps) {
  const [search, setSearch] = useState(initialSearch ?? "");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedPricing, setSelectedPricing] = useState<string>("");
  const [selectedDelivery, setSelectedDelivery] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<string>("matchScore");
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const emitFilters = useCallback(
    (overrides?: Partial<SupplierSearchFilters>) => {
      const filters: SupplierSearchFilters = {
        search: search || undefined,
        category: selectedCategory || undefined,
        district: selectedDistrict || undefined,
        pricingType: selectedPricing || undefined,
        deliveryTime: selectedDelivery || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        minRating: minRating > 0 ? minRating : undefined,
        sort: sort as SupplierSearchFilters["sort"],
        limit: 20,
        offset: 0,
      };
      onFiltersChange({ ...filters, ...overrides });
    },
    [search, selectedCategory, selectedDistrict, selectedPricing, selectedDelivery, selectedTags, minRating, sort, onFiltersChange],
  );

  function handleSearchChange(value: string) {
    setSearch(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      onSearch(value);
    }, 300);
  }

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    requestAnimationFrame(() => emitFilters());
  }

  const activeFilterCount = [
    selectedCategory,
    selectedDistrict,
    selectedPricing,
    selectedDelivery,
    ...selectedTags,
    minRating > 0 ? "rating" : null,
  ].filter(Boolean).length;

  function clearFilters() {
    setSelectedCategory("");
    setSelectedDistrict("");
    setSelectedPricing("");
    setSelectedDelivery("");
    setSelectedTags([]);
    setMinRating(0);
    setSort("matchScore");
    emitFilters({
      category: undefined,
      district: undefined,
      pricingType: undefined,
      deliveryTime: undefined,
      tags: undefined,
      minRating: undefined,
      sort: "matchScore",
    });
  }

  function FilterSelect({
    label,
    value,
    options,
    onChange,
  }: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (v: string) => void;
  }) {
    return (
      <div className="space-y-1.5">
        <label className="text-[10px] uppercase tracking-widest text-(--clr-fg-dim)">{label}</label>
        <select
          value={value}
          onChange={(e) => { onChange(e.target.value); requestAnimationFrame(() => emitFilters()); }}
          className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs text-(--clr-fg) outline-none focus:border-(--clr-teal-dim) transition-colors"
        >
          <option value="">All</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-dim)" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search suppliers by name, business, or location..."
            className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) py-2.5 pl-10 pr-10 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) outline-none focus:border-(--clr-teal-dim) transition-colors"
          />
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(""); onSearch(""); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-(--clr-fg-dim) hover:text-(--clr-fg) transition-colors"
            >
              <LuX className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className={`relative inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-xs font-semibold transition-all ${
            showFilters || activeFilterCount > 0
              ? "border-(--clr-teal-dim)/30 bg-(--clr-teal-dim)/10 text-(--clr-teal-dim)"
              : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg)"
          }`}
        >
          <LuSlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-(--clr-teal-dim) text-[9px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-5 space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-(--clr-fg)">Filter by</span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-xs text-(--clr-fg-dim) hover:text-(--clr-fg) transition-colors"
              >
                <LuX className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <FilterSelect
              label="Category"
              value={selectedCategory}
              options={categories.map((c) => ({
                value: c.value,
                label: `${CATEGORY_LABELS.get(c.value) ?? c.value} (${c.count})`,
              }))}
              onChange={setSelectedCategory}
            />
            <FilterSelect
              label="District"
              value={selectedDistrict}
              options={districts.map((d) => ({
                value: d.value,
                label: `${d.value} (${d.count})`,
              }))}
              onChange={setSelectedDistrict}
            />
            <FilterSelect
              label="Pricing"
              value={selectedPricing}
              options={PRICING_OPTIONS}
              onChange={setSelectedPricing}
            />
            <FilterSelect
              label="Delivery"
              value={selectedDelivery}
              options={DELIVERY_OPTIONS}
              onChange={setSelectedDelivery}
            />
            <FilterSelect
              label="Sort by"
              value={sort}
              options={SORT_OPTIONS}
              onChange={(v) => { setSort(v); requestAnimationFrame(() => emitFilters()); }}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-(--clr-fg-dim)">
              Min Rating: {minRating > 0 ? `${minRating}+` : "Any"}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                step={0.5}
                value={minRating}
                onChange={(e) => { setMinRating(Number(e.target.value)); requestAnimationFrame(() => emitFilters()); }}
                className="flex-1 accent-(--clr-teal-dim)"
              />
              <span className="flex items-center gap-1 text-xs text-(--clr-fg-muted) min-w-[3rem]">
                <LuX className="h-3 w-3" />
                {minRating > 0 ? minRating : "Any"}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-(--clr-fg-dim)">Supplier Tags</label>
            <div className="flex flex-wrap gap-2">
              {SUPPLIER_TAG_OPTIONS.map((tag) => (
                <button
                  key={tag.value}
                  type="button"
                  onClick={() => handleTagToggle(tag.value)}
                  className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-all ${
                    selectedTags.includes(tag.value)
                      ? "border-(--clr-teal-dim)/30 bg-(--clr-teal-dim)/10 text-(--clr-teal-dim)"
                      : "border-(--clr-border) text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover)"
                  }`}
                >
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

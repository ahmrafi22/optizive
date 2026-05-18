import { LuFilter, LuSearch, LuRefreshCw } from "react-icons/lu";

import {
  SORT_OPTIONS,
  STATUS_OPTIONS,
  VIEW_OPTIONS,
  type InventoryCategoryOption,
  type SortOption,
  type StatusFilter,
  type ViewMode,
} from "./types";

export interface InventoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: string;
  onCategoryChange: (value: string) => void;
  categories: InventoryCategoryOption[];
  sort: SortOption;
  onSortChange: (value: SortOption) => void;
  status: StatusFilter;
  onStatusChange: (value: StatusFilter) => void;
  minPrice: string;
  onMinPriceChange: (value: string) => void;
  maxPrice: string;
  onMaxPriceChange: (value: string) => void;
  activeOnly: boolean;
  onActiveOnlyChange: (value: boolean) => void;
  view: ViewMode;
  onViewChange: (value: ViewMode) => void;
  onClear: () => void;
  onRefresh: () => void;
  isFetching: boolean;
  error: string | null;
}

export function InventoryFilters({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categories,
  sort,
  onSortChange,
  status,
  onStatusChange,
  minPrice,
  onMinPriceChange,
  maxPrice,
  onMaxPriceChange,
  activeOnly,
  onActiveOnlyChange,
  view,
  onViewChange,
  onClear,
  onRefresh,
  isFetching,
  error,
}: InventoryFiltersProps) {
  return (
    <section className="bento-card bento-card-no-hover noise-overlay p-5 md:p-6 space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-[2fr_1.2fr_1fr] gap-3">
          <div className="relative">
            <LuSearch className="absolute left-3 top-3.5 h-4 w-4 text-(--clr-fg-muted)" aria-hidden="true" />
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search name, SKU, barcode"
              className="w-full rounded-2xl border border-(--clr-border) bg-(--clr-surface2) py-3 pl-10 pr-3 text-sm text-(--clr-fg) outline-none focus:border-(--clr-border-hover)"
            />
          </div>

          <div className="relative">
            <LuFilter className="absolute left-3 top-3.5 h-4 w-4 text-(--clr-fg-muted)" aria-hidden="true" />
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="w-full appearance-none rounded-2xl border border-(--clr-border) bg-(--clr-surface2) py-3 pl-10 pr-8 text-sm text-(--clr-fg) outline-none focus:border-(--clr-border-hover)"
            >
              <option value="ALL">All categories</option>
              {categories.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="relative">
            <select
              value={`${sort.value}-${sort.order}`}
              onChange={(e) => {
                const selected = SORT_OPTIONS.find((o) => `${o.value}-${o.order}` === e.target.value);
                if (selected) onSortChange(selected);
              }}
              className="w-full appearance-none rounded-2xl border border-(--clr-border) bg-(--clr-surface2) py-3 pl-3 pr-8 text-sm text-(--clr-fg) outline-none focus:border-(--clr-border-hover)"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={`${option.value}-${option.order}`} value={`${option.value}-${option.order}`}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-3 text-xs text-(--clr-fg-muted)">
            <span>Active only</span>
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => onActiveOnlyChange(e.target.checked)}
              className="h-4 w-4 accent-[var(--clr-yellow)]"
            />
          </div>
          <div className="flex items-center gap-2">
            {VIEW_OPTIONS.map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => onViewChange(value)}
                className={`inline-flex items-center gap-2 rounded-2xl border px-3 py-3 text-xs font-semibold transition-colors ${view === value
                    ? "border-(--clr-border-hover) bg-(--clr-charcoal) text-white"
                    : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted)"
                  }`}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-2 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-3 text-xs font-semibold text-(--clr-fg-muted)"
          >
            <LuRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} aria-hidden="true" />
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onStatusChange(option.value)}
              className={`active:scale-[0.97] transition-transform duration-150 rounded-full border px-3 py-1.5 text-xs font-semibold ${status === option.value
                  ? "border-(--clr-border-hover) bg-(--clr-charcoal) text-white"
                  : "border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg-muted) hover:text-(--clr-fg)"
                }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={minPrice}
            onChange={(e) => onMinPriceChange(e.target.value)}
            placeholder="Min price"
            type="number"
            min={0}
            className="w-28 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs text-(--clr-fg)"
          />
          <input
            value={maxPrice}
            onChange={(e) => onMaxPriceChange(e.target.value)}
            placeholder="Max price"
            type="number"
            min={0}
            className="w-28 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs text-(--clr-fg)"
          />
          <button
            type="button"
            onClick={onClear}
            className="active:scale-[0.97] transition-transform duration-150 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:text-(--clr-fg)"
          >
            Clear filters
          </button>
        </div>
      </div>

      {error && <div className="text-xs text-rose-500">{error}</div>}
    </section>
  );
}

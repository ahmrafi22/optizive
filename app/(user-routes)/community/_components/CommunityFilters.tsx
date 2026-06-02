"use client";

import { LuSearch, LuRefreshCw, LuSlidersHorizontal } from "react-icons/lu";
import type { Category } from "@/prisma/generated/prisma/client";

interface CommunityFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  type: string;
  onTypeChange: (v: string) => void;
  status: string;
  onStatusChange: (v: string) => void;
  category: string;
  onCategoryChange: (v: string) => void;
  categories: { value: Category; label: string }[];
  sort: string;
  onSortChange: (v: string) => void;
  onClear: () => void;
  isFetching: boolean;
}

const inputBase =
  "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all";
const selectBase =
  "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all appearance-none";

export function CommunityFilters({
  search, onSearchChange, type, onTypeChange, status, onStatusChange,
  category, onCategoryChange, categories, sort, onSortChange, onClear, isFetching,
}: CommunityFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-dim)" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search posts..."
            className={`${inputBase} pl-10`}
          />
        </div>
        <button
          type="button"
          onClick={onClear}
          className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
        >
          <LuRefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Clear
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select value={type} onChange={(e) => onTypeChange(e.target.value)} className={`${selectBase} w-auto min-w-[120px]`}>
          <option value="ALL">All Types</option>
          <option value="PROCUREMENT">Procurement</option>
          <option value="GENERAL">General</option>
        </select>

        <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={`${selectBase} w-auto min-w-[120px]`}>
          <option value="ALL">All Status</option>
          <option value="OPEN">Open</option>
          <option value="FILLED">Filled</option>
          <option value="CLOSED">Closed</option>
        </select>

        <select value={category} onChange={(e) => onCategoryChange(e.target.value)} className={`${selectBase} w-auto min-w-[140px]`}>
          <option value="ALL">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>

        <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={`${selectBase} w-auto min-w-[120px]`}>
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="popular">Most Upvoted</option>
          <option value="active">Recently Active</option>
        </select>
      </div>
    </div>
  );
}

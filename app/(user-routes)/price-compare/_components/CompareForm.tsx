"use client";

import { useState } from "react";
import {
  LuChevronDown,
  LuChevronRight,
  LuInfo,
  LuLoader,
  LuSearch,
  LuX,
} from "react-icons/lu";
import { CATEGORY_OPTIONS, COUNTRY_OPTIONS } from "./types";

interface CompareFormProps {
  form: {
    productName: string;
    category: string;
    info: string;
    city: string;
    country: string;
  };
  streaming: boolean;
  isLoading: boolean;
  error: string | null;
  onFormChange: (field: string, value: string) => void;
  onStreamingChange: (value: boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onAbort: () => void;
  onClear: () => void;
}

const inputBase =
  "w-full rounded-2xl bg-(--clr-surface2) border border-(--clr-border) px-4 py-3 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition";

const labelBase = "block text-[11px] font-semibold uppercase tracking-[0.15em] text-(--clr-fg-muted) mb-1.5";

// ---------------------------------------------------------------------------
// Custom country selector with flag image
// ---------------------------------------------------------------------------

function CountrySelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = COUNTRY_OPTIONS.find((c) => c.value === value) ?? COUNTRY_OPTIONS[0];

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 rounded-2xl bg-(--clr-surface2) border border-(--clr-border) px-4 py-3 text-sm text-(--clr-fg) focus:outline-none focus:border-(--clr-border-hover) focus:ring-2 focus:ring-[rgba(255,244,79,0.25)] transition hover:border-white/20"
      >
        <img
          src={`https://flagcdn.com/24x18/${selected.tld}.png`}
          alt={selected.label}
          className="h-4 w-auto rounded-sm shrink-0 object-cover"
          loading="lazy"
        />
        <span className="flex-1 text-left truncate">{selected.label}</span>
        <LuChevronDown
          className={`h-4 w-4 text-(--clr-fg-muted) transition-transform duration-200 shrink-0 ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 mt-2 z-20 max-h-64 overflow-y-auto rounded-2xl border border-(--clr-border) bg-(--clr-surface) shadow-2xl py-1">
            {COUNTRY_OPTIONS.map((country) => (
              <button
                key={country.value}
                type="button"
                onClick={() => {
                  onChange(country.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors hover:bg-(--clr-surface2) ${
                  country.value === value ? "text-(--clr-fg) bg-(--clr-surface2)" : "text-(--clr-fg-muted)"
                }`}
              >
                <img
                  src={`https://flagcdn.com/24x18/${country.tld}.png`}
                  alt=""
                  className="h-3.5 w-auto rounded-sm shrink-0"
                  loading="lazy"
                />
                <span className="truncate">{country.label}</span>
                {country.value === value && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main form
// ---------------------------------------------------------------------------

export function CompareForm({
  form,
  streaming,
  isLoading,
  error,
  onFormChange,
  onStreamingChange,
  onSubmit,
  onAbort,
  onClear,
}: CompareFormProps) {
  return (
    <section className="rounded-3xl border border-(--clr-border) shadow-xl noise-overlay p-6 md:p-8 flex flex-col gap-0 bg-(--clr-surface)">
      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-xl font-semibold text-(--clr-fg)">Compare a product</h2>
        </div>
        <div className="h-10 w-10 rounded-full bg-amber-400/10 dark:bg-primary/10 border border-amber-400/20 dark:border-primary/20 flex items-center justify-center shrink-0">
          <LuSearch className="h-5 w-5 text-amber-600 dark:text-primary" aria-hidden="true" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {/* Product name */}
        <div>
          <label className={labelBase}>Product name <span className="text-primary">*</span></label>
          <input
            className={inputBase}
            value={form.productName}
            onChange={(e) => onFormChange("productName", e.target.value)}
            placeholder="e.g. iPhone 15 Pro"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelBase}>Category <span className="text-primary">*</span></label>
          <div className="relative">
            <select
              className={`${inputBase} appearance-none pr-10`}
              value={form.category}
              onChange={(e) => onFormChange("category", e.target.value)}
              required
            >
              <option value="">Select a category</option>
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <LuChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-muted)" aria-hidden="true" />
          </div>
        </div>

        {/* Variant info */}
        <div>
          <label className={labelBase}>Variant info</label>
          <input
            className={inputBase}
            value={form.info}
            onChange={(e) => onFormChange("info", e.target.value)}
            placeholder="e.g. 256GB Blue"
          />
          <p className="mt-1.5 text-[11px] text-(--clr-fg-muted)">Optional — size, color, or bundle variant.</p>
        </div>

        {/* City + Country — two column layout */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelBase}>City</label>
            <input
              className={inputBase}
              value={form.city}
              onChange={(e) => onFormChange("city", e.target.value)}
              placeholder="Dhaka"
            />
          </div>
          <div>
            <label className={labelBase}>Country <span className="text-primary">*</span></label>
            <CountrySelector
              value={form.country}
              onChange={(val) => onFormChange("country", val)}
            />
          </div>
        </div>

        {/* Streaming toggle */}
        <div className="flex items-center justify-between rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-(--clr-fg)">
            <LuInfo className="h-4 w-4 text-(--clr-fg-muted)" aria-hidden="true" />
            Stream live updates
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={streaming}
            onClick={() => onStreamingChange(!streaming)}
            className={`relative h-5 w-9 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${streaming ? "bg-primary" : "bg-black/20 dark:bg-white/10"}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${streaming ? "translate-x-4" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <LuX className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="btn-press inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-[#111111] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                Comparing…
              </>
            ) : (
              <>
                Compare prices
                <LuChevronRight className="h-4 w-4" aria-hidden="true" />
              </>
            )}
          </button>
          {isLoading ? (
            <button
              type="button"
              onClick={onAbort}
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-(--clr-border) px-5 py-3 text-xs font-semibold text-(--clr-fg-muted) hover:border-red-400/40 hover:text-red-500 dark:hover:text-red-300 transition-colors"
            >
              <LuX className="h-3.5 w-3.5" aria-hidden="true" />
              Cancel request
            </button>
          ) : (
            <button
              type="button"
              onClick={onClear}
              className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-(--clr-border) px-5 py-3 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
            >
              Clear form
            </button>
          )}
        </div>
      </form>
    </section>
  );
}

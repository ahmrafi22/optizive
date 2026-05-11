import type { StreamStage } from "./types";

export function formatCurrency(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) return "Not listed";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

export function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

export function matchTone(match: number) {
  if (match >= 85) return "bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30";
  if (match >= 70) return "bg-yellow-400/15 text-yellow-700 dark:text-yellow-200 border-yellow-400/30";
  return "bg-orange-400/15 text-orange-700 dark:text-orange-200 border-orange-400/30";
}

export function availabilityTone(availability: string | null) {
  if (!availability) return "bg-zinc-500/15 text-zinc-700 dark:text-zinc-200 border-zinc-400/20";
  if (availability === "in_stock") return "bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30";
  if (availability === "out_of_stock") return "bg-red-400/15 text-red-700 dark:text-red-200 border-red-400/30";
  return "bg-zinc-500/15 text-zinc-700 dark:text-zinc-200 border-zinc-400/20";
}

export function stageTone(stage: StreamStage) {
  if (stage === "complete") return "bg-emerald-400/15 text-emerald-700 dark:text-emerald-200 border-emerald-400/30";
  if (stage === "error") return "bg-red-400/15 text-red-700 dark:text-red-200 border-red-400/30";
  if (stage === "analysis") return "bg-teal-400/15 text-teal-700 dark:text-teal-200 border-teal-400/30";
  if (stage === "crawling") return "bg-yellow-400/15 text-yellow-700 dark:text-yellow-200 border-yellow-400/30";
  return "bg-(--clr-surface2) text-(--clr-fg-muted) border-(--clr-border)";
}

export function sanitizeValue(value: string) {
  return value.trim();
}

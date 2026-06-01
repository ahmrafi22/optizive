"use client";

import type { BuyerType } from "./types";
import { LuUserCheck, LuUserX } from "react-icons/lu";

export default function BuyerTypeBadge({ type }: { type: BuyerType }) {
  const isPlatform = type === "PLATFORM_USER";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${
        isPlatform
          ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      }`}
    >
      {isPlatform ? <LuUserCheck className="h-3 w-3" /> : <LuUserX className="h-3 w-3" />}
      {isPlatform ? "Platform" : "External"}
    </span>
  );
}

"use client";

import type { PaymentStatus } from "./types";
import { LuCircleCheck, LuClock, LuCircleX } from "react-icons/lu";

const config: Record<PaymentStatus, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
  PAID: {
    label: "Paid",
    classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    icon: LuCircleCheck,
  },
  PARTIAL: {
    label: "Partial",
    classes: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    icon: LuClock,
  },
  UNPAID: {
    label: "Unpaid",
    classes: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
    icon: LuCircleX,
  },
};

export default function PaymentBadge({ status }: { status: PaymentStatus }) {
  const c = config[status];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${c.classes}`}
    >
      <Icon className="h-3 w-3" />
      {c.label}
    </span>
  );
}

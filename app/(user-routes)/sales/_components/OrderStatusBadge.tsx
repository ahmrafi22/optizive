"use client";

import type { OrderStatus } from "./types";
import { LuPackage, LuCheck, LuX, LuRefreshCw, LuTruck, LuClock, LuUndo } from "react-icons/lu";

const config: Record<OrderStatus, { label: string; classes: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Pending", classes: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", icon: LuClock },
  CONFIRMED: { label: "Confirmed", classes: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", icon: LuCheck },
  PROCESSING: { label: "Processing", classes: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300", icon: LuRefreshCw },
  SHIPPED: { label: "Shipped", classes: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300", icon: LuTruck },
  DELIVERED: { label: "Delivered", classes: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", icon: LuPackage },
  CANCELLED: { label: "Cancelled", classes: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", icon: LuX },
  RETURNED: { label: "Returned", classes: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300", icon: LuUndo },
};

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
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

import {
  LuTriangleAlert,
  LuCheck as LuCheckCircle2,
  LuCircleX as LuXCircle,
} from "react-icons/lu";

import { STATUS_BADGES, type InventoryStockStatus } from "./types";

const STATUS_ICONS: Record<InventoryStockStatus, typeof LuCheckCircle2> = {
  IN_STOCK: LuCheckCircle2,
  LOW_STOCK: LuTriangleAlert,
  OUT_OF_STOCK: LuXCircle,
  INACTIVE: LuXCircle,
};

export function StockBadge({ status }: { status: InventoryStockStatus }) {
  const Icon = STATUS_ICONS[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGES[status]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

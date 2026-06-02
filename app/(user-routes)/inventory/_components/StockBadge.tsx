import { STATUS_BADGES, STATUS_ICONS, type InventoryStockStatus } from "./types";

export function StockBadge({ status }: { status: InventoryStockStatus }) {
  const Icon = STATUS_ICONS[status];

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${STATUS_BADGES[status]}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {status.replace(/_/g, " ")}
    </span>
  );
}

import { formatCurrency, type InventoryStats as InventoryStatsShape } from "./types";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bento-card noise-overlay p-4 md:p-5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-(--clr-fg)">{value}</div>
      <div className="mt-1 text-xs text-(--clr-fg-muted)">{hint}</div>
    </div>
  );
}

export function InventoryStats({
  stats,
}: {
  stats: InventoryStatsShape;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Total products"
        value={String(stats.totalProducts)}
        hint="All inventory items"
      />
      <StatCard
        label="Low stock"
        value={String(stats.lowStock)}
        hint="Needs replenishment soon"
      />
      <StatCard
        label="Out of stock"
        value={String(stats.outOfStock)}
        hint="Unavailable right now"
      />
      <StatCard
        label="Inventory value"
        value={formatCurrency(stats.totalValue)}
        hint="Total worth of stock"
      />
    </section>
  );
}

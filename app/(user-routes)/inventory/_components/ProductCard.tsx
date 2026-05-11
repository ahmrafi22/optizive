import { StockBadge } from "./StockBadge";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
  formatDate,
  type InventoryProduct,
  type ViewMode,
} from "./types";

export function ProductCard({ product, view }: { product: InventoryProduct; view: ViewMode }) {
  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;

  return (
    <article className={`bento-card noise-overlay flex flex-col ${view === "large" ? "min-h-[260px]" : "min-h-[220px]"}`}>
      <div className="p-5 flex items-start gap-4">
        <div
          className="h-14 w-14 rounded-2xl border border-(--clr-border) shadow-sm"
          style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-(--clr-fg-muted)">
              {formatCategory(product.category)}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>
          <h3 className="mt-2 text-[15px] font-semibold text-(--clr-fg) leading-snug line-clamp-2">
            {product.name}
          </h3>
          <p className="mt-1 text-xs text-(--clr-fg-muted) line-clamp-2">
            {product.description ?? "No description added yet."}
          </p>
        </div>
      </div>

      <div className="h-px mx-5 bg-(--clr-border)" />

      <div className="px-5 py-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted)">Price</div>
          <div className="mt-1 text-lg font-semibold text-(--clr-fg)">{formatCurrency(product.sellingPrice)}</div>
          <div className="text-xs text-(--clr-fg-muted)">Margin {formatCurrency(product.margin)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted)">Stock</div>
          <div className="mt-1 text-lg font-semibold text-(--clr-fg)">
            {product.quantity} {product.unit}
          </div>
          <div className="text-xs text-(--clr-fg-muted)">
            Min {product.minStock ?? "-"} &bull; Value {formatCurrency(product.value)}
          </div>
        </div>
      </div>

      <div className="mt-auto px-5 pb-5 text-xs text-(--clr-fg-muted) flex flex-wrap items-center gap-3">
        <span>SKU {product.sku ?? "-"}</span>
        <span>Barcode {product.barcode ?? "-"}</span>
        <span className="ml-auto">Updated {formatDate(product.updatedAt)}</span>
      </div>
    </article>
  );
}

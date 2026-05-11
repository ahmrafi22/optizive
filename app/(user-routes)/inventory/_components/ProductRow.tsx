import { StockBadge } from "./StockBadge";
import {
  CATEGORY_PALETTES,
  formatCategory,
  formatCurrency,
  formatDate,
  type InventoryProduct,
} from "./types";

export function ProductRow({ product }: { product: InventoryProduct }) {
  const palette = CATEGORY_PALETTES[product.category ?? "OTHER"] ?? CATEGORY_PALETTES.OTHER;

  return (
    <article className="bento-card noise-overlay">
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_1fr_1fr] gap-4 items-center">
        <div
          className="h-12 w-12 rounded-2xl border border-(--clr-border)"
          style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        />
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-(--clr-fg-muted)">
              {formatCategory(product.category)}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>
          <div className="mt-2 text-[15px] font-semibold text-(--clr-fg)">{product.name}</div>
          <div className="text-xs text-(--clr-fg-muted)">SKU {product.sku ?? "-"} &bull; Updated {formatDate(product.updatedAt)}</div>
        </div>
        <div className="text-sm">
          <div className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted)">Price</div>
          <div className="mt-1 font-semibold text-(--clr-fg)">{formatCurrency(product.sellingPrice)}</div>
          <div className="text-xs text-(--clr-fg-muted)">Margin {formatCurrency(product.margin)}</div>
        </div>
        <div className="text-sm">
          <div className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted)">Stock</div>
          <div className="mt-1 font-semibold text-(--clr-fg)">
            {product.quantity} {product.unit}
          </div>
          <div className="text-xs text-(--clr-fg-muted)">Min {product.minStock ?? "-"}</div>
        </div>
        <div className="text-sm">
          <div className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted)">Value</div>
          <div className="mt-1 font-semibold text-(--clr-fg)">{formatCurrency(product.value)}</div>
          <div className="text-xs text-(--clr-fg-muted)">Barcode {product.barcode ?? "-"}</div>
        </div>
      </div>
    </article>
  );
}

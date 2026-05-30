import Link from "next/link";

import { StockBadge } from "./StockBadge";
import {
  CATEGORY_ICONS,
  formatCategory,
  formatCurrency,
  formatDate,
  type InventoryProduct,
} from "./types";

export function ProductRow({ product }: { product: InventoryProduct }) {
  const FallbackIcon = CATEGORY_ICONS[product.category ?? "OTHER"] ?? CATEGORY_ICONS.OTHER;

  return (
    <Link href={`/inventory/${product.id}`} className="bento-card noise-overlay block !cursor-pointer">
      <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-[auto_2fr_1fr_1fr_1fr] gap-4 items-center">
        <div className="h-12 w-12 rounded-2xl border border-(--clr-border) relative overflow-hidden bg-(--clr-surface2)">
          {product.imageLink ? (
            <img
              src={product.imageLink}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
            />
          ) : (
            <div className="w-full h-full bg-(--clr-surface) flex items-center justify-center">
              <FallbackIcon className="h-5 w-5 text-(--clr-fg-dim)" />
            </div>
          )}
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-(--clr-fg-muted)">
              {formatCategory(product.category)}
            </span>
            <StockBadge status={product.stockStatus} />
          </div>
          <div className="mt-2 text-[15px] font-semibold text-(--clr-fg)">{product.name}</div>
          <div className="text-xs text-(--clr-fg-muted)">Updated {formatDate(product.updatedAt)}</div>
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
        </div>
      </div>
    </Link>
  );
}

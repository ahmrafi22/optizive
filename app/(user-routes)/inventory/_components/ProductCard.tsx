import Link from "next/link";

import { StockBadge } from "./StockBadge";
import { MiniSalesChart } from "./MiniSalesChart";
import {
  CATEGORY_ICONS,
  formatCategory,
  formatCurrency,
  type InventoryProduct,
  type ViewMode,
} from "./types";

export function ProductCard({ product, view }: { product: InventoryProduct; view: ViewMode }) {
  const FallbackIcon = CATEGORY_ICONS[product.category ?? "OTHER"] ?? CATEGORY_ICONS.OTHER;

  return (
    <Link
      href={`/inventory/${product.id}`}
      className={`bento-card noise-overlay flex flex-col cursor-pointer! ${view === "large" ? "min-h-95" : "min-h-85"}`}
    >
      {/* Square polaroid-style image */}
      <div className="w-full aspect-square border-b border-(--clr-border) relative p-4 bg-(--clr-surface2)">
        {product.imageLink ? (
          <img
            src={product.imageLink}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-(--clr-surface) flex items-center justify-center">
            <FallbackIcon className="h-10 w-10 text-(--clr-fg-dim)" />
          </div>
        )}
      </div>

      {/* Polaroid-style bottom section with info */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-(--clr-fg-muted)">
            {formatCategory(product.category)}
          </span>
          <StockBadge status={product.stockStatus} />
        </div>
        
        <h3 className="text-[14px] font-semibold text-(--clr-fg) leading-snug line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-xs text-(--clr-fg-muted) line-clamp-2">
          {product.description ?? "No description added yet."}
        </p>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <div className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted)">Price</div>
            <div className="mt-0.5 text-sm font-semibold text-(--clr-fg)">{formatCurrency(product.sellingPrice)}</div>
            <div className="text-[10px] text-(--clr-fg-muted)">Margin {formatCurrency(product.margin)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted)">Stock</div>
            <div className="mt-0.5 text-sm font-semibold text-(--clr-fg)">
              {product.quantity} {product.unit}
            </div>
            <div className="text-[10px] text-(--clr-fg-muted)">
              Min {product.minStock ?? "-"} &bull; Value {formatCurrency(product.value)}
            </div>
          </div>
        </div>

        {/* Sales Trend Chart */}
        <div className="mt-2 pt-3 border-t border-(--clr-border)">
          <div className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted) mb-1">
            Sales Trend (1 Month)
          </div>
          <MiniSalesChart productId={product.id} data={product.salesHistory} />
        </div>
      </div>
    </Link>
  );
}

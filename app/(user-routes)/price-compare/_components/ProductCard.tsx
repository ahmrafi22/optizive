import { LuActivity, LuExternalLink, LuGlobe, LuTag } from "react-icons/lu";
import type { ProductResult } from "./types";
import { availabilityTone, formatCurrency, matchTone } from "./utils";

interface ProductCardProps {
  product: ProductResult;
  isStreaming?: boolean;
}

export function ProductCard({ product, isStreaming }: ProductCardProps) {
  const priceText = formatCurrency(product.price, product.currency);
  const match = Math.max(40, Math.min(100, product.matchPercentage));
  const availabilityLabel = product.availability
    ? product.availability.replace(/_/g, " ")
    : "Unknown";
  const hasUnitPrice = product.unitPrice && product.unitPriceUnit;
  const hasUnit = product.unitValue && product.unitName;

  return (
    <article
      className={`bento-card noise-overlay bg-[color:var(--clr-surface)] overflow-hidden flex flex-col ${isStreaming ? "animate-fade-in" : ""}`}
    >
      {/* Top section — image + meta + title */}
      <div className="p-5 md:p-6 flex gap-5 items-start">
        {/* Product image */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
          ) : (
            <LuActivity className="h-7 w-7 text-zinc-600" aria-hidden="true" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Source + Availability row */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] px-2.5 py-1 text-[color:var(--clr-fg)]">
              {product.sourceLogoUrl ? (
                <img
                  src={product.sourceLogoUrl}
                  alt=""
                  className="h-3.5 w-3.5 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <LuGlobe className="h-3 w-3 text-zinc-400" aria-hidden="true" />
              )}
              <span className="truncate max-w-[140px] font-medium">{product.source}</span>
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 capitalize font-medium ${availabilityTone(product.availability)}`}>
              {availabilityLabel}
            </span>
          </div>

          {/* Product name */}
          <h3
            className="mt-2.5 text-[15px] font-semibold text-[color:var(--clr-fg)] leading-snug line-clamp-2"
            title={product.productName}
          >
            {product.productName}
          </h3>

          {/* Notes */}
          {product.notes && (
            <p className="mt-1.5 text-xs text-zinc-500 line-clamp-2 leading-relaxed">
              {product.notes}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px mx-5 bg-[color:var(--clr-border)]" />

      {/* Stats row */}
      <div className="px-5 md:px-6 py-4 grid grid-cols-3 gap-3">
        {/* Price */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Price</div>
          <div className="font-mono text-lg font-bold text-[color:var(--clr-fg)] leading-none">{priceText}</div>
          <div className="text-[11px] text-zinc-500 leading-snug">
            {product.pricePerUnit ?? product.unitText ?? "—"}
          </div>
        </div>

        {/* Match */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Match</div>
          <div className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${matchTone(match)}`}>
            {match}%
          </div>
          <div className="mt-1.5 h-1.5 w-full rounded-full bg-[color:var(--clr-surface2)] overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={match}>
            <div
              className="h-full rounded-full bg-linear-to-r from-yellow-400/80 via-yellow-300/70 to-teal-400/80 transition-all duration-500"
              style={{ width: `${match}%` }}
            />
          </div>
        </div>

        {/* Unit */}
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-widest text-zinc-600 font-semibold">Unit</div>
          <div className="text-sm font-medium text-[color:var(--clr-fg)]">
            {hasUnit ? `${product.unitValue} ${product.unitName}` : "—"}
          </div>
          <div className="text-[11px] text-zinc-500">
            {hasUnitPrice
              ? `${formatCurrency(product.unitPrice, product.currency)} / ${product.unitPriceUnit}`
              : ""}
          </div>
        </div>
      </div>

      {/* Footer — view button */}
      <div className="mt-auto px-5 md:px-6 pb-5 pt-1">
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-press group flex items-center justify-center gap-2 w-full rounded-xl border border-[color:var(--clr-border)] px-4 py-2.5 text-xs font-semibold text-[color:var(--clr-fg-muted)] hover:border-[color:var(--clr-border-hover)] hover:bg-[color:var(--clr-surface2)] hover:text-[color:var(--clr-fg)] transition-all"
        >
          <LuTag className="h-3.5 w-3.5 text-zinc-500 group-hover:text-primary transition-colors" aria-hidden="true" />
          View listing
          <LuExternalLink className="ml-auto h-3.5 w-3.5 text-zinc-500 group-hover:text-[color:var(--clr-fg-muted)] transition-colors" aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}

import { LuLoader, LuPackageSearch, LuSparkles } from "react-icons/lu";
import type { ProductResult } from "./types";
import { ProductCard } from "./ProductCard";

interface ProductResultsProps {
  exactMatches: ProductResult[];
  relatedProducts: ProductResult[];
  isLoading: boolean;
}

function SectionHeader({
  title,
  count,
  isLoading,
  accent,
}: {
  title: string;
  count: number;
  isLoading: boolean;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-base font-semibold text-[color:var(--clr-fg)] flex items-center gap-2.5">
        {title}
        {isLoading && (
          <LuLoader className="h-3.5 w-3.5 animate-spin text-zinc-500" aria-hidden="true" />
        )}
      </h3>
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${accent}`}>
        {count} {count === 1 ? "item" : "items"}
      </span>
    </div>
  );
}

export function ProductResults({ exactMatches, relatedProducts, isLoading }: ProductResultsProps) {
  if (exactMatches.length === 0 && relatedProducts.length === 0 && !isLoading) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* ── Exact Matches ───────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          title="Exact matches"
          count={exactMatches.length}
          isLoading={isLoading}
          accent={
            exactMatches.length > 0
              ? "border-emerald-400/30 text-emerald-300 bg-emerald-400/10"
              : "border-[color:var(--clr-border)] text-[color:var(--clr-fg-muted)] bg-[color:var(--clr-surface2)]"
          }
        />

        {exactMatches.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {exactMatches.map((product, idx) => (
              <ProductCard
                key={`exact-${product.source}-${product.productUrl}-${idx}`}
                product={product}
                isStreaming={isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="bento-card noise-overlay p-6 bg-[color:var(--clr-surface)] flex items-center gap-4 text-[color:var(--clr-fg-muted)]">
            {isLoading ? (
              <>
                <div className="h-9 w-9 rounded-xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center shrink-0">
                  <LuLoader className="h-4 w-4 animate-spin text-zinc-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--clr-fg)]">Scanning sources…</p>
                  <p className="text-xs text-[color:var(--clr-fg-muted)] mt-0.5">Searching for exact product matches</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center shrink-0">
                  <LuPackageSearch className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="text-sm text-[color:var(--clr-fg-muted)]">No exact matches found — check related products below.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Related Products ─────────────────────────────────────── */}
      <div className="space-y-4">
        <SectionHeader
          title="Related products"
          count={relatedProducts.length}
          isLoading={isLoading}
          accent={
            relatedProducts.length > 0
              ? "border-teal-400/30 text-teal-300 bg-teal-400/10"
              : "border-[color:var(--clr-border)] text-[color:var(--clr-fg-muted)] bg-[color:var(--clr-surface2)]"
          }
        />

        {relatedProducts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {relatedProducts.map((product, idx) => (
              <ProductCard
                key={`related-${product.source}-${product.productUrl}-${idx}`}
                product={product}
                isStreaming={isLoading}
              />
            ))}
          </div>
        ) : (
          <div className="bento-card noise-overlay p-6 bg-[color:var(--clr-surface)] flex items-center gap-4 text-[color:var(--clr-fg-muted)]">
            {isLoading ? (
              <>
                <div className="h-9 w-9 rounded-xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center shrink-0">
                  <LuLoader className="h-4 w-4 animate-spin text-zinc-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--clr-fg)]">Finding alternatives…</p>
                  <p className="text-xs text-[color:var(--clr-fg-muted)] mt-0.5">Looking for similar and related products</p>
                </div>
              </>
            ) : (
              <>
                <div className="h-9 w-9 rounded-xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center shrink-0">
                  <LuSparkles className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                </div>
                <p className="text-sm text-[color:var(--clr-fg-muted)]">No related products found.</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

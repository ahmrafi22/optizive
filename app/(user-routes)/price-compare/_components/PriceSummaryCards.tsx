import { LuLoader, LuTrendingDown, LuTrendingUp, LuPackage } from "react-icons/lu";
import { formatTimestamp } from "./utils";

interface PriceSummaryCardsProps {
  bestPrice: string | null;
  sellerPrice: string | null;
  totalFound: number | null;
  timestamp: string | null;
  isLoading: boolean;
}

export function PriceSummaryCards({
  bestPrice,
  sellerPrice,
  totalFound,
  timestamp,
  isLoading,
}: PriceSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Best price */}
      <div className="bento-card noise-overlay p-5 bg-[color:var(--clr-surface)] group hover:border-emerald-400/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--clr-fg-muted)] font-semibold">Best price</p>
          <div className="h-8 w-8 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <LuTrendingDown className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[color:var(--clr-fg)] font-mono leading-none">
          {isLoading && !bestPrice ? (
            <span className="flex items-center gap-2 text-base text-[color:var(--clr-fg-muted)]">
              <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyzing…
            </span>
          ) : (
            bestPrice ?? <span className="text-[color:var(--clr-fg-muted)] font-sans text-lg">—</span>
          )}
        </div>
        <p className="mt-2.5 text-xs text-[color:var(--clr-fg-muted)]">Most competitive listing found.</p>
      </div>

      {/* Seller range */}
      <div className="bento-card noise-overlay p-5 bg-[color:var(--clr-surface)] group hover:border-yellow-400/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--clr-fg-muted)] font-semibold">Seller range</p>
          <div className="h-8 w-8 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center">
            <LuTrendingUp className="h-4 w-4 text-yellow-400" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[color:var(--clr-fg)] font-mono leading-none">
          {isLoading && !sellerPrice ? (
            <span className="flex items-center gap-2 text-base text-[color:var(--clr-fg-muted)]">
              <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              Analyzing…
            </span>
          ) : (
            sellerPrice ?? <span className="text-[color:var(--clr-fg-muted)] font-sans text-lg">—</span>
          )}
        </div>
        <p className="mt-2.5 text-xs text-[color:var(--clr-fg-muted)]">Expected negotiation band.</p>
      </div>

      {/* Total found */}
      <div className="bento-card noise-overlay p-5 bg-[color:var(--clr-surface)] group hover:border-teal-400/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--clr-fg-muted)] font-semibold">Total found</p>
          <div className="h-8 w-8 rounded-xl bg-teal-400/10 border border-teal-400/20 flex items-center justify-center">
            <LuPackage className="h-4 w-4 text-teal-400" aria-hidden="true" />
          </div>
        </div>
        <div className="text-2xl font-bold text-[color:var(--clr-fg)] font-mono leading-none">
          {isLoading && totalFound === null ? (
            <span className="flex items-center gap-2 text-base text-[color:var(--clr-fg-muted)]">
              <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
              Searching…
            </span>
          ) : (
            totalFound ?? <span className="text-[color:var(--clr-fg-muted)] font-sans text-lg">0</span>
          )}
        </div>
        <p className="mt-2.5 text-xs text-[color:var(--clr-fg-muted)]">
          {timestamp ? `Updated ${formatTimestamp(timestamp)}` : "Awaiting results"}
        </p>
      </div>
    </div>
  );
}

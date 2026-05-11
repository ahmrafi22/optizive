import { LuChartBar, LuLoader, LuMessageSquare } from "react-icons/lu";

interface MarketOverviewProps {
  summary: string;
  sellerSummary: string;
  isLoading: boolean;
}

export function MarketOverview({ summary, sellerSummary, isLoading }: MarketOverviewProps) {
  return (
    <div className="bento-card noise-overlay p-6 md:p-7">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-full bg-amber-400/10 dark:bg-primary/10 border border-amber-400/20 dark:border-primary/20 flex items-center justify-center shrink-0">
          <LuChartBar className="h-5 w-5 text-amber-600 dark:text-primary" aria-hidden="true" />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted) font-semibold">Summary</p>
          <h3 className="text-lg font-semibold text-(--clr-fg) leading-none mt-0.5">Market overview</h3>
        </div>
      </div>

      {isLoading && !summary ? (
        <div className="flex items-center gap-3 text-sm text-(--clr-fg-muted) py-2">
          <LuLoader className="h-4 w-4 animate-spin text-(--clr-fg-muted) shrink-0" aria-hidden="true" />
          <span>Generating market analysis…</span>
        </div>
      ) : (
        <>
          <p className="text-sm text-(--clr-fg) leading-relaxed">
            {summary || "Run a comparison to see the market summary."}
          </p>

          {sellerSummary && (
            <div className="mt-4 rounded-2xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-4">
              <div className="flex items-center gap-2 mb-2">
                <LuMessageSquare className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
                <p className="text-[11px] uppercase tracking-[0.15em] text-(--clr-fg-muted) font-semibold">Seller guidance</p>
              </div>
              <p className="text-sm text-(--clr-fg-muted) leading-relaxed">{sellerSummary}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

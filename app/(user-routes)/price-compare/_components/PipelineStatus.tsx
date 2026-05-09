import { LuCheck, LuLink2, LuLoader, LuSearch, LuX, LuZap } from "react-icons/lu";
import type { StreamStage } from "./types";
import { STAGE_LABELS } from "./types";
import { stageTone as getStageTone } from "./utils";

interface PipelineStatusProps {
  statusStage: StreamStage;
  statusMessage: string;
  isLoading: boolean;
  progress: { completed: number; total: number };
  progressPercent: number;
  links: string[];
  searchLinks: string[];
  searchQueries: string[];
  totalFound: number | null;
  productName: string;
}

export function PipelineStatus({
  statusStage,
  statusMessage,
  isLoading,
  progress,
  progressPercent,
  links,
  searchLinks,
  searchQueries,
  totalFound,
  productName,
}: PipelineStatusProps) {
  const activeSources = links.length > 0 ? links : searchLinks;

  return (
    <div className="bento-card noise-overlay p-6 md:p-7 bg-[color:var(--clr-surface)]">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-[color:var(--clr-surface2)] border border-[color:var(--clr-border)] flex items-center justify-center shrink-0">
            <LuZap className="h-4 w-4 text-primary" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--clr-fg-muted)] font-semibold">Status</p>
            <h2 className="text-lg font-semibold text-[color:var(--clr-fg)] leading-none mt-0.5">Live pipeline</h2>
          </div>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${getStageTone(statusStage)}`}>
          {statusStage === "complete" ? (
            <LuCheck className="h-3.5 w-3.5" aria-hidden="true" />
          ) : statusStage === "error" ? (
            <LuX className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <LuLoader className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
          )}
          {STAGE_LABELS[statusStage]}
        </span>
      </div>

      {/* Status message */}
      <p className="text-sm text-[color:var(--clr-fg)] min-h-[20px] leading-relaxed" aria-live="polite">
        {statusMessage}
      </p>

      {/* Progress bar */}
      {isLoading && (
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs text-[color:var(--clr-fg-muted)]">
            <span>Crawling progress</span>
            <span className="font-mono">
              {progress.total ? `${progress.completed} / ${progress.total}` : "Initializing…"}
            </span>
          </div>
          <div
            className="h-2 w-full rounded-full bg-[color:var(--clr-surface2)] overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progressPercent}
          >
            <div
              className="h-full rounded-full bg-linear-to-r from-yellow-400/80 via-yellow-300/70 to-teal-400/80 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          {progressPercent > 0 && (
            <p className="text-[11px] text-right text-[color:var(--clr-fg-muted)] font-mono">{progressPercent}%</p>
          )}
        </div>
      )}

      {/* Stats pills */}
      <div className="mt-5 flex flex-wrap items-center gap-2.5 text-xs text-[color:var(--clr-fg-muted)]">
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--clr-border)] px-3 py-1.5 bg-[color:var(--clr-surface2)]">
          <LuLink2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sources</span>
          <span className="font-semibold text-[color:var(--clr-fg)]">{links.length || searchLinks.length}</span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--clr-border)] px-3 py-1.5 bg-[color:var(--clr-surface2)]">
          <LuSearch className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Queries</span>
          <span className="font-semibold text-[color:var(--clr-fg)]">{searchQueries.length || (productName ? 1 : 0)}</span>
        </span>
        {totalFound !== null && totalFound > 0 && (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-300">
            <LuCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Found</span>
            <span className="font-semibold">{totalFound}</span>
          </span>
        )}
      </div>

      {/* Sources accordion */}
      {activeSources.length > 0 && (
        <details className="mt-4 rounded-xl border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] text-xs text-[color:var(--clr-fg-muted)] group">
          <summary className="cursor-pointer list-none flex items-center justify-between px-4 py-3 font-medium text-[color:var(--clr-fg)] hover:text-primary transition-colors select-none">
            <span>View sources ({activeSources.length})</span>
            <LuLink2 className="h-3.5 w-3.5 text-[color:var(--clr-fg-muted)]" aria-hidden="true" />
          </summary>
          <ul className="border-t border-[color:var(--clr-border)] px-4 py-3 space-y-1.5 text-[color:var(--clr-fg-muted)] max-h-40 overflow-y-auto">
            {activeSources.map((link, idx) => (
              <li key={`${link}-${idx}`} className="truncate hover:text-[color:var(--clr-fg)] transition-colors">
                <a href={link} target="_blank" rel="noreferrer" className="hover:underline underline-offset-2">
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { useSession } from "next-auth/react";
import { LuHistory, LuRotateCcw } from "react-icons/lu";

import {
  runStreamingCompare,
  runStandardCompare,
} from "@/backend/price-compare/price-compare";

import type { CompareRequest, CompareResponse } from "./_components/types";
import { COUNTRY_OPTIONS } from "./_components/types";
import { sanitizeValue } from "./_components/utils";
import { CompareForm } from "./_components/CompareForm";
import { PipelineStatus } from "./_components/PipelineStatus";
import { PriceSummaryCards } from "./_components/PriceSummaryCards";
import { MarketOverview } from "./_components/MarketOverview";
import { ProductResults } from "./_components/ProductResults";
import { PriceCompareHistory } from "./_components/PriceCompareHistory";
import { usePriceCompare } from "./_components/PriceCompareContext";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.56, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export default function PriceComparePage() {
  const { state, setState, abortRef, resetResults } = usePriceCompare();

  const [form, setForm] = useState({
    productName: "",
    category: "",
    info: "",
    city: "",
    country: "bangladesh",
  });
  const [streaming, setStreaming] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { data: session } = useSession();

  const [showHistory, setShowHistory] = useState(false);
  const [historyItems, setHistoryItems] = useState<
    { id: string; productName: string; category: string; country: string; createdAt: string }[]
  >([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const progressPercent = useMemo(() => {
    if (!state.progress.total) return 0;
    return Math.min(100, Math.round((state.progress.completed / state.progress.total) * 100));
  }, [state.progress]);

  const emptyState = !state.isLoading && state.exactMatches.length === 0 && state.relatedProducts.length === 0;

  // ---------------------------------------------------------------------------
  // History
  // ---------------------------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    if (!session?.user?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetch("/api/price-compare/save");
      if (res.ok) {
        setHistoryItems(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoadingHistory(false);
    }
  }, [session]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const saveCurrentResult = async (response: CompareResponse) => {
    if (!session?.user?.id) return;
    if (!response.success) return;
    try {
      const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === form.country)?.label ?? form.country;
      await fetch("/api/price-compare/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: form.productName,
          category: form.category,
          info: form.info || undefined,
          city: form.city || undefined,
          country: countryLabel,
          data: response,
        }),
      });
      fetchHistory();
    } catch {
      // ignore
    }
  };

  const loadHistoryItem = async (id: string) => {
    try {
      const res = await fetch(`/api/price-compare/save/${id}`);
      if (res.ok) {
        const saved = await res.json();
        setForm({
          productName: saved.productName,
          category: saved.category,
          info: saved.info || "",
          city: saved.city || "",
          country: saved.country,
        });
        resetResults();
        setError(null);
        applyCompleteResponse(saved.data as CompareResponse);
        setShowHistory(false);
      }
    } catch {
      // ignore
    }
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const handleAbort = () => {
    abortRef.current?.abort();
    setState((prev) => ({
      ...prev,
      isLoading: false,
      statusStage: "idle",
      statusMessage: "Canceled",
    }));
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setForm({ productName: "", category: "", info: "", city: "", country: "bangladesh" });
  };

  const handleClearResults = () => {
    resetResults();
    setError(null);
  };

  // ---------------------------------------------------------------------------
  // Apply complete response data (shared between streaming and standard modes)
  // ---------------------------------------------------------------------------

  const applyCompleteResponse = (response: CompareResponse) => {
    console.log("Complete response:", response);
    setState((prev) => {
      const existingExactUrls = new Set(prev.exactMatches.map((p) => p.productUrl));
      const newExact = (response.exactMatches ?? []).filter((p) => !existingExactUrls.has(p.productUrl));
      const existingRelatedUrls = new Set(prev.relatedProducts.map((p) => p.productUrl));
      const newRelated = (response.relatedProducts ?? []).filter((p) => !existingRelatedUrls.has(p.productUrl));
      return {
        ...prev,
        exactMatches: [...prev.exactMatches, ...newExact],
        relatedProducts: [...prev.relatedProducts, ...newRelated],
        totalFound: response.totalFound ?? 0,
        bestPrice: response.bestPrice ?? null,
        sellerPrice: response.sellerPrice ?? null,
        summary: response.summary ?? "",
        sellerSummary: response.sellerSummary ?? "",
        timestamp: response.timestamp ?? null,
        searchQueries: response.searchQueries ?? [],
        searchLinks: response.searchLinks ?? [],
        statusStage: "complete",
        statusMessage: "Comparison complete!",
        isLoading: false,
      };
    });
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const countryLabel = COUNTRY_OPTIONS.find((c) => c.value === form.country)?.label ?? form.country;
    const payload: CompareRequest = {
      productName: sanitizeValue(form.productName),
      category: form.category,
      info: sanitizeValue(form.info) || undefined,
      city: sanitizeValue(form.city) || undefined,
      country: countryLabel,
    };

    if (!payload.productName || !payload.category || !payload.country) {
      setError("Please fill in product name, category, and country.");
      return;
    }

    resetResults();
    setError(null);
    setState((prev) => ({
      ...prev,
      isLoading: true,
      statusStage: "received",
      statusMessage: "Preparing the comparison",
    }));
    abortRef.current = new AbortController();

    try {
      if (streaming) {
        try {
          await runStreamingCompare(
            payload,
            abortRef.current.signal,
            {
              onStatus: (stage, message, total) => {
                setState((prev) => ({
                  ...prev,
                  statusStage: stage,
                  statusMessage: message ?? prev.statusMessage,
                  ...(typeof total === "number" ? { progress: { completed: 0, total } } : {}),
                }));
              },
              onLinks: (newLinks) => {
                setState((prev) => ({
                  ...prev,
                  links: newLinks,
                  statusStage: "crawling",
                  statusMessage: `Found ${newLinks.length} sources to crawl`,
                }));
              },
              onScrape: (completed, total) => {
                setState((prev) => ({
                  ...prev,
                  progress: { completed, total },
                  statusStage: "crawling",
                  statusMessage: `Crawling sources (${completed}/${total})`,
                }));
              },
              onProducts: (exact, related, completed, total, newTotalFound, source) => {
                setState((prev) => {
                  let newExactCount = 0;
                  let newRelatedCount = 0;

                  const existingExactUrls = new Set(prev.exactMatches.map((p) => p.productUrl));
                  const newExactProducts = exact.filter((p) => !existingExactUrls.has(p.productUrl));
                  newExactCount = newExactProducts.length;

                  const existingRelatedUrls = new Set(prev.relatedProducts.map((p) => p.productUrl));
                  const newRelatedProducts = related.filter((p) => !existingRelatedUrls.has(p.productUrl));
                  newRelatedCount = newRelatedProducts.length;

                  const next = {
                    ...prev,
                    exactMatches: [...prev.exactMatches, ...newExactProducts],
                    relatedProducts: [...prev.relatedProducts, ...newRelatedProducts],
                  };

                  if (typeof completed === "number" && typeof total === "number") {
                    next.progress = { completed, total };
                  }

                  if (newTotalFound !== null) next.totalFound = newTotalFound;

                  const totalNew = newExactCount + newRelatedCount;
                  if (totalNew > 0) {
                    if (completed < total && total > 0) {
                      next.statusStage = "crawling";
                      next.statusMessage = `Crawling sources (${completed}/${total}) — found ${totalNew} new products from ${source}`;
                    } else {
                      next.statusStage = "analysis";
                      next.statusMessage = `Added ${totalNew} new products, analyzing prices...`;
                    }
                  }

                  return next;
                });
              },
              onAnalysis: (bp, sp, sm, ss) => {
                setState((prev) => ({
                  ...prev,
                  bestPrice: bp,
                  sellerPrice: sp,
                  summary: sm,
                  sellerSummary: ss,
                  statusStage: "analysis",
                  statusMessage: "Finalizing market analysis...",
                }));
              },
              onComplete: (response) => {
                applyCompleteResponse(response);
                saveCurrentResult(response);
              },
              onError: (message) => {
                setState((prev) => ({
                  ...prev,
                  statusStage: "error",
                  statusMessage: "Request failed",
                  isLoading: false,
                }));
                setError(message);
              },
            },
            () => state.progress,
          );
        } catch (streamErr) {
          if ((streamErr as Error).name === "AbortError") {
            return;
          }
          setState((prev) => ({
            ...prev,
            statusStage: "analysis",
            statusMessage: "Streaming unavailable, switching to standard mode",
          }));
          abortRef.current = new AbortController();
          const data = await runStandardCompare(payload, abortRef.current.signal);
          applyCompleteResponse(data);
          saveCurrentResult(data);
        }
      } else {
        setState((prev) => ({
          ...prev,
          statusStage: "analysis",
          statusMessage: "Fetching full response",
        }));
        const data = await runStandardCompare(payload, abortRef.current.signal);
        applyCompleteResponse(data);
        saveCurrentResult(data);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }
      setState((prev) => ({
        ...prev,
        statusStage: "error",
        statusMessage: "Request failed",
        isLoading: false,
      }));
      setError((err as Error).message ?? "Something went wrong");
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="relative pb-10">
      <div className="flex flex-col xl:flex-row gap-6 items-start">
        <div className="xl:sticky xl:top-24 xl:w-90 shrink-0 space-y-6 z-10">
          <FadeUp delay={0}>
            <header className="relative">
              <h1 className="font-naston text-3xl md:text-4xl text-(--clr-fg)">
                Price Compare
              </h1>
            </header>
          </FadeUp>
          <FadeUp delay={0.04}>
            <CompareForm
              form={form}
              streaming={streaming}
              isLoading={state.isLoading}
              error={error}
              onFormChange={handleFormChange}
              onStreamingChange={setStreaming}
              onSubmit={handleSubmit}
              onAbort={handleAbort}
              onClear={handleClear}
            />
          </FadeUp>
        </div>

        <section className="flex-1 min-w-0 space-y-6 w-full">
          {emptyState && !state.isLoading ? (
            <FadeUp delay={0}>
              <div className="bento-card bento-card-no-hover noise-overlay p-6 md:p-8 border border-(--clr-border)">
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-10 w-10 rounded-full bg-(--clr-surface2) border border-(--clr-border) flex items-center justify-center shrink-0">
                    <LuHistory className="h-5 w-5 text-(--clr-fg-muted)" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-(--clr-fg)">Saved Comparisons</h2>
                  </div>
                </div>

                {historyItems.length > 0 ? (
                  <div className="space-y-2">
                    {historyItems.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item.id)}
                        className="w-full text-left flex items-center justify-between px-4 py-3 rounded-2xl bg-(--clr-surface2) border border-(--clr-border) hover:border-(--clr-border-hover) transition-colors"
                      >
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-(--clr-fg) truncate">{item.productName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] uppercase tracking-wider text-(--clr-fg-muted) bg-(--clr-surface) px-1.5 py-0.5 rounded-md">{item.category}</span>
                            <span className="text-[11px] text-(--clr-fg-dim)">{item.country}</span>
                          </div>
                        </div>
                        <span className="text-[11px] text-(--clr-fg-dim) shrink-0 ml-3">
                          {new Date(item.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                        </span>
                      </button>
                    ))}
                    {historyItems.length > 5 && (
                      <button
                        onClick={() => setShowHistory(true)}
                        className="w-full text-center py-2 text-xs text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors"
                      >
                        View all {historyItems.length} saved comparisons
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-10 text-center">
                    <LuHistory className="h-10 w-10 text-(--clr-fg-dim) opacity-40" />
                    <p className="text-sm text-(--clr-fg-muted)">No saved comparisons yet</p>
                    <p className="text-xs text-(--clr-fg-dim)">Use the form to compare prices, and your results will appear here automatically.</p>
                  </div>
                )}
              </div>
            </FadeUp>
          ) : (
            <>
              <FadeUp delay={0}>
                <PipelineStatus
                  statusStage={state.statusStage}
                  statusMessage={state.statusMessage}
                  isLoading={state.isLoading}
                  progress={state.progress}
                  progressPercent={progressPercent}
                  links={state.links}
                  searchLinks={state.searchLinks}
                  searchQueries={state.searchQueries}
                  totalFound={state.totalFound}
                  productName={form.productName}
                />
              </FadeUp>

              <FadeUp delay={0.08}>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => setShowHistory(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-(--clr-border) text-xs text-(--clr-fg-muted) hover:bg-(--clr-surface2) hover:text-(--clr-fg) transition-colors"
                  >
                    <LuHistory className="h-3.5 w-3.5" />
                    History
                  </button>
                  {!state.isLoading && (
                    <button
                      onClick={handleClearResults}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-(--clr-border) text-xs text-(--clr-fg-muted) hover:bg-(--clr-surface2) hover:text-(--clr-fg) transition-colors"
                    >
                      <LuRotateCcw className="h-3.5 w-3.5" />
                      Clear
                    </button>
                  )}
                </div>
              </FadeUp>

              <FadeUp delay={0.12}>
                <PriceSummaryCards
                  bestPrice={state.bestPrice}
                  sellerPrice={state.sellerPrice}
                  totalFound={state.totalFound}
                  timestamp={state.timestamp}
                  isLoading={state.isLoading}
                />
              </FadeUp>

              <FadeUp delay={0.20}>
                <MarketOverview
                  summary={state.summary}
                  sellerSummary={state.sellerSummary}
                  isLoading={state.isLoading}
                />
              </FadeUp>

              <FadeUp delay={0.28}>
                <ProductResults
                  exactMatches={state.exactMatches}
                  relatedProducts={state.relatedProducts}
                  isLoading={state.isLoading}
                />
              </FadeUp>
            </>
          )}
        </section>
      </div>

      <PriceCompareHistory
        open={showHistory}
        onClose={() => setShowHistory(false)}
        items={historyItems}
        loading={loadingHistory}
        onSelect={loadHistoryItem}
      />
    </div>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

import {
  runStreamingCompare,
  runStandardCompare,
} from "@/backend/price-compare/price-compare";

import type { StreamStage, ProductResult, CompareRequest, CompareResponse } from "./_components/types";
import { COUNTRY_OPTIONS } from "./_components/types";
import { sanitizeValue } from "./_components/utils";
import { CompareForm } from "./_components/CompareForm";
import { PipelineStatus } from "./_components/PipelineStatus";
import { PriceSummaryCards } from "./_components/PriceSummaryCards";
import { MarketOverview } from "./_components/MarketOverview";
import { ProductResults } from "./_components/ProductResults";

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
  const [form, setForm] = useState({
    productName: "",
    category: "",
    info: "",
    city: "",
    country: "bangladesh", // default
  });
  const [streaming, setStreaming] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [statusStage, setStatusStage] = useState<StreamStage>("idle");
  const [statusMessage, setStatusMessage] = useState("Ready to compare");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [links, setLinks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [exactMatches, setExactMatches] = useState<ProductResult[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<ProductResult[]>([]);
  const [totalFound, setTotalFound] = useState<number | null>(null);
  const [bestPrice, setBestPrice] = useState<string | null>(null);
  const [sellerPrice, setSellerPrice] = useState<string | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [sellerSummary, setSellerSummary] = useState<string>("");
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [searchQueries, setSearchQueries] = useState<string[]>([]);
  const [searchLinks, setSearchLinks] = useState<string[]>([]);

  const abortRef = useRef<AbortController | null>(null);

  const progressPercent = useMemo(() => {
    if (!progress.total) return 0;
    return Math.min(100, Math.round((progress.completed / progress.total) * 100));
  }, [progress]);

  const emptyState = !isLoading && exactMatches.length === 0 && relatedProducts.length === 0;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  const resetResults = () => {
    setExactMatches([]);
    setRelatedProducts([]);
    setTotalFound(null);
    setBestPrice(null);
    setSellerPrice(null);
    setSummary("");
    setSellerSummary("");
    setTimestamp(null);
    setSearchQueries([]);
    setSearchLinks([]);
    setLinks([]);
    setProgress({ completed: 0, total: 0 });
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStatusStage("idle");
    setStatusMessage("Canceled");
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleClear = () => {
    setForm({ productName: "", category: "", info: "", city: "", country: "bangladesh" });
  };

  // ---------------------------------------------------------------------------
  // Apply complete response data (shared between streaming and standard modes)
  // ---------------------------------------------------------------------------

  const applyCompleteResponse = (response: CompareResponse) => {
    console.log("Complete response:", response);

    setExactMatches((prev) => {
      const existingUrls = new Set(prev.map((p) => p.productUrl));
      const newProducts = (response.exactMatches ?? []).filter((p) => !existingUrls.has(p.productUrl));
      return [...prev, ...newProducts];
    });
    setRelatedProducts((prev) => {
      const existingUrls = new Set(prev.map((p) => p.productUrl));
      const newProducts = (response.relatedProducts ?? []).filter((p) => !existingUrls.has(p.productUrl));
      return [...prev, ...newProducts];
    });
    setTotalFound(response.totalFound ?? 0);
    setBestPrice(response.bestPrice ?? null);
    setSellerPrice(response.sellerPrice ?? null);
    setSummary(response.summary ?? "");
    setSellerSummary(response.sellerSummary ?? "");
    setTimestamp(response.timestamp ?? null);
    setSearchQueries(response.searchQueries ?? []);
    setSearchLinks(response.searchLinks ?? []);
    setStatusStage("complete");
    setStatusMessage("Comparison complete!");
    setIsLoading(false);
  };

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    // Map country value (e.g. "bangladesh") → display label ("Bangladesh") for the API
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
    setIsLoading(true);
    setStatusStage("received");
    setStatusMessage("Preparing the comparison");
    abortRef.current = new AbortController();

    try {
      if (streaming) {
        try {
          await runStreamingCompare(
            payload,
            abortRef.current.signal,
            {
              onStatus: (stage, message, total) => {
                setStatusStage(stage);
                if (message) setStatusMessage(message);
                if (typeof total === "number") setProgress({ completed: 0, total });
              },
              onLinks: (newLinks) => {
                setLinks(newLinks);
                setStatusStage("crawling");
                setStatusMessage(`Found ${newLinks.length} sources to crawl`);
              },
              onScrape: (completed, total) => {
                setProgress({ completed, total });
                setStatusStage("crawling");
                setStatusMessage(`Crawling sources (${completed}/${total})`);
              },
              onProducts: (exact, related, completed, total, newTotalFound, source, _prevCompleted, _prevTotal) => {
                let newExactCount = 0;
                let newRelatedCount = 0;

                if (exact.length > 0) {
                  setExactMatches((prev) => {
                    const existingUrls = new Set(prev.map((p) => p.productUrl));
                    const newProducts = exact.filter((p) => !existingUrls.has(p.productUrl));
                    newExactCount = newProducts.length;
                    return [...prev, ...newProducts];
                  });
                }

                if (related.length > 0) {
                  setRelatedProducts((prev) => {
                    const existingUrls = new Set(prev.map((p) => p.productUrl));
                    const newProducts = related.filter((p) => !existingUrls.has(p.productUrl));
                    newRelatedCount = newProducts.length;
                    return [...prev, ...newProducts];
                  });
                }

                if (typeof completed === "number" && typeof total === "number") {
                  setProgress({ completed, total });
                }

                if (newTotalFound !== null) setTotalFound(newTotalFound);

                const totalNew = newExactCount + newRelatedCount;
                if (totalNew > 0) {
                  if (completed < total && total > 0) {
                    setStatusStage("crawling");
                    setStatusMessage(`Crawling sources (${completed}/${total}) — found ${totalNew} new products from ${source}`);
                  } else {
                    setStatusStage("analysis");
                    setStatusMessage(`Added ${totalNew} new products, analyzing prices...`);
                  }
                }
              },
              onAnalysis: (bp, sp, sm, ss) => {
                setBestPrice(bp);
                setSellerPrice(sp);
                setSummary(sm);
                setSellerSummary(ss);
                setStatusStage("analysis");
                setStatusMessage("Finalizing market analysis...");
              },
              onComplete: applyCompleteResponse,
              onError: (message) => {
                setStatusStage("error");
                setStatusMessage("Request failed");
                setError(message);
                setIsLoading(false);
              },
            },
            () => progress,
          );
        } catch (streamErr) {
          if ((streamErr as Error).name === "AbortError") {
            throw streamErr;
          }
          setStatusStage("analysis");
          setStatusMessage("Streaming unavailable, switching to standard mode");
          abortRef.current = new AbortController();
          const data = await runStandardCompare(payload, abortRef.current.signal);
          applyCompleteResponse(data);
        }
      } else {
        setStatusStage("analysis");
        setStatusMessage("Fetching full response");
        const data = await runStandardCompare(payload, abortRef.current.signal);
        applyCompleteResponse(data);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        setIsLoading(false);
        return;
      }
      setStatusStage("error");
      setStatusMessage("Request failed");
      setError((err as Error).message ?? "Something went wrong");
      setIsLoading(false);
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
              <h1 className="font-naston text-3xl md:text-5xl text-(--clr-fg)">
                Price Compare
              </h1>
            </header>
          </FadeUp>
        <FadeUp delay={0.04}>
          <CompareForm
            form={form}
            streaming={streaming}
            isLoading={isLoading}
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
          <FadeUp delay={0}>
            <PipelineStatus
              statusStage={statusStage}
              statusMessage={statusMessage}
              isLoading={isLoading}
              progress={progress}
              progressPercent={progressPercent}
              links={links}
              searchLinks={searchLinks}
              searchQueries={searchQueries}
              totalFound={totalFound}
              productName={form.productName}
            />
          </FadeUp>

          <FadeUp delay={0.08}>
            <PriceSummaryCards
              bestPrice={bestPrice}
              sellerPrice={sellerPrice}
              totalFound={totalFound}
              timestamp={timestamp}
              isLoading={isLoading}
            />
          </FadeUp>

          <FadeUp delay={0.16}>
            <MarketOverview
              summary={summary}
              sellerSummary={sellerSummary}
              isLoading={isLoading}
            />
          </FadeUp>

          <FadeUp delay={0.24}>
            <ProductResults
              exactMatches={exactMatches}
              relatedProducts={relatedProducts}
              isLoading={isLoading}
            />
          </FadeUp>

          {emptyState && (
            <FadeUp delay={0.08}>
              <div className="bento-card bento-card-no-hover noise-overlay p-6 text-sm text-(--clr-fg-muted) border border-(--clr-border)">
                Enter a product, pick a category, and compare to see results.
              </div>
            </FadeUp>
          )}
        </section>
      </div>
    </div>
  );
}

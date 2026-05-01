"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductSearchForm from "@/components/price-monitor/ProductSearchForm";
import PriceMonitorResults from "@/components/price-monitor/PriceMonitorResults";
import PipelineStatus, { type PipelineStep } from "@/components/price-monitor/PipelineStatus";
import type {
  PriceDiscoveryRequest,
  PriceDiscoveryResponse,
} from "@/types/price-monitor";

export default function PriceMonitorClient() {
  const [result, setResult] = useState<PriceDiscoveryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>("idle");

  const handleSearch = async (payload: PriceDiscoveryRequest) => {
    setIsSubmitting(true);
    setResult(null);
    setError(null);
    setPipelineStep("browsing");

    // Start a timer to advance steps if the request is taking time
    // This provides visual feedback of "thinking"
    const stepTimer = setTimeout(() => {
      setPipelineStep("scraping");
    }, 2500);

    const stepTimer2 = setTimeout(() => {
      setPipelineStep("analyzing");
    }, 6000);

    try {
      const response = await fetch("/api/price-discovery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as PriceDiscoveryResponse;
      
      if (!response.ok) {
        const message = data.analysis?.risk_flags?.[0] ?? "Pipeline request failed.";
        setError(message);
        setPipelineStep("error");
      } else {
        setResult(data);
        setPipelineStep("completed");
      }
    } catch {
      setError("Unable to run discovery pipeline. Please try again.");
      setPipelineStep("error");
    } finally {
      clearTimeout(stepTimer);
      clearTimeout(stepTimer2);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_left,#fef3c7,transparent_40%),radial-gradient(circle_at_top_right,#dbeafe,transparent_45%),linear-gradient(180deg,#fafafa,#f4f4f5)] px-4 py-8 sm:px-6 sm:py-10">
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="mx-auto w-full max-w-6xl space-y-6"
      >
        <div className="rounded-3xl border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-3 py-1">Puppeteer</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">Firecrawl</span>
            <span className="rounded-full bg-zinc-100 px-3 py-1">OpenRouter</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
            Price Monitor Engine
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-700">
            Discover live product listings dynamically, normalize prices to BDT,
            and get AI-backed pricing guidance for better seller margins.
          </p>
        </div>

        <ProductSearchForm onSubmit={handleSearch} isSubmitting={isSubmitting} />

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              role="alert"
              className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
              {error}
            </motion.div>
          )}

          {isSubmitting && (
            <PipelineStatus key="loading" step={pipelineStep} />
          )}

          {result && !isSubmitting && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            >
              <PriceMonitorResults result={result} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>
    </main>
  );
}

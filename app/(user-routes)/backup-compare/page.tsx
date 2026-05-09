"use client";

import { useMemo, useRef, useState } from "react";
import {
  LuActivity,
  LuCheck,
  LuChevronRight,
  LuExternalLink,
  LuGlobe,
  LuInfo,
  LuLink2,
  LuLoader,
  LuSearch,
  LuSparkles,
  LuX,
} from "react-icons/lu";

const API_BASE_URL = process.env.NEXT_PUBLIC_PRICE_COMPARE_API ?? "http://localhost:2222";

type StreamStage =
  | "idle"
  | "received"
  | "query"
  | "crawling"
  | "analysis"
  | "complete"
  | "error";

interface CompareRequest {
  productName: string;
  category: string;
  info?: string;
  city?: string;
  country: string;
}

interface CompareResponse {
  success: boolean;
  searchQueries: string[];
  searchLinks: string[];
  exactMatches: ProductResult[];
  relatedProducts: ProductResult[];
  totalFound: number;
  sellerPrice: string | null;
  bestPrice: string | null;
  summary: string;
  sellerSummary: string;
  timestamp: string;
}

interface ProductResult {
  productName: string;
  source: string;
  sourceLogoUrl: string | null;
  price: number | null;
  currency: string;
  unitText: string | null;
  unitValue: number | null;
  unitName: string | null;
  unitPrice: number | null;
  unitPriceUnit: string | null;
  pricePerUnit: string | null;
  matchPercentage: number;
  productUrl: string;
  imageUrl: string | null;
  availability: string | null;
  notes: string | null;
}

const CATEGORY_OPTIONS = [
  { value: "groceries", label: "Groceries" },
  { value: "electronics", label: "Electronics" },
  { value: "raw_materials", label: "Raw materials" },
  { value: "clothing", label: "Clothing" },
  { value: "home_appliances", label: "Home appliances" },
  { value: "beauty_personal_care", label: "Beauty and personal care" },
  { value: "health_pharmacy", label: "Health and pharmacy" },
  { value: "baby_kids", label: "Baby and kids" },
  { value: "books_stationery", label: "Books and stationery" },
  { value: "sports_outdoors", label: "Sports and outdoors" },
  { value: "tools_hardware", label: "Tools and hardware" },
  { value: "automotive", label: "Automotive" },
  { value: "furniture_home", label: "Furniture and home" },
  { value: "pet_supplies", label: "Pet supplies" },
  { value: "office_supplies", label: "Office supplies" },
  { value: "services", label: "Services" },
  { value: "electronics_accessories", label: "Electronics accessories" },
  { value: "mobiles_computing", label: "Mobiles and computing" },
  { value: "kitchen_dining", label: "Kitchen and dining" },
  { value: "gifts_crafts", label: "Gifts and crafts" },
  { value: "travel_luggage", label: "Travel and luggage" },
  { value: "garden_farm", label: "Garden and farm" },
  { value: "toys_games", label: "Toys and games" },
  { value: "jewelry_watches", label: "Jewelry and watches" },
  { value: "music_instruments", label: "Music instruments" },
  { value: "industrial_equipment", label: "Industrial equipment" },
  { value: "software_digital", label: "Software and digital" },
  { value: "education_training", label: "Education and training" },
];

const STAGE_LABELS: Record<StreamStage, string> = {
  idle: "Ready",
  received: "Queued",
  query: "Searching",
  crawling: "Crawling",
  analysis: "Analyzing",
  complete: "Complete",
  error: "Error",
};

function formatCurrency(value: number | null, currency: string) {
  if (value === null || Number.isNaN(value)) return "Not listed";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toLocaleString()} ${currency}`;
  }
}

function formatTimestamp(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function matchTone(match: number) {
  if (match >= 85) return "bg-emerald-400/15 text-emerald-200 border-emerald-400/30";
  if (match >= 70) return "bg-yellow-400/15 text-yellow-200 border-yellow-400/30";
  return "bg-orange-400/15 text-orange-200 border-orange-400/30";
}

function availabilityTone(availability: string | null) {
  if (!availability) return "bg-zinc-500/15 text-zinc-200 border-zinc-400/20";
  if (availability === "in_stock") return "bg-emerald-400/15 text-emerald-200 border-emerald-400/30";
  if (availability === "out_of_stock") return "bg-red-400/15 text-red-200 border-red-400/30";
  return "bg-zinc-500/15 text-zinc-200 border-zinc-400/20";
}

function stageTone(stage: StreamStage) {
  if (stage === "complete") return "bg-emerald-400/15 text-emerald-200 border-emerald-400/30";
  if (stage === "error") return "bg-red-400/15 text-red-200 border-red-400/30";
  if (stage === "analysis") return "bg-teal-400/15 text-teal-200 border-teal-400/30";
  if (stage === "crawling") return "bg-yellow-400/15 text-yellow-200 border-yellow-400/30";
  return "bg-(--clr-surface2) text-(--clr-fg-muted) border-(--clr-border)";
}

function sanitizeValue(value: string) {
  return value.trim();
}

function ProductCard({ product, isStreaming }: { product: ProductResult; isStreaming?: boolean }) {
  const priceText = formatCurrency(product.price, product.currency);
  const match = Math.max(40, Math.min(100, product.matchPercentage));
  const availabilityLabel = product.availability
    ? product.availability.replace(/_/g, " ")
    : "Unknown";

  return (
    <article className={`bento-card noise-overlay p-4 md:p-5 bg-(--clr-charcoal) ${isStreaming ? "animate-fade-in" : ""}`}>
      <div className="flex items-start gap-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-black/40 border border-white/5 flex items-center justify-center">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <LuActivity className="h-6 w-6 text-zinc-400" aria-hidden="true" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-2 py-1">
              {product.sourceLogoUrl ? (
                <img
                  src={product.sourceLogoUrl}
                  alt=""
                  className="h-4 w-4 rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <LuGlobe className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span className="truncate max-w-[120px]">{product.source}</span>
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 ${availabilityTone(product.availability)}`}>
              {availabilityLabel}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-white line-clamp-2" title={product.productName}>
            {product.productName}
          </h3>
          <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
            {product.notes ?? "Verified listing from the crawl results."}
          </p>
        </div>
        <a
          href={product.productUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-press shrink-0 rounded-full border border-white/10 px-3 py-2 text-xs font-semibold text-white hover:border-white/30 hover:bg-white/5 transition-all"
        >
          View
          <LuExternalLink className="ml-1 inline h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
        <div className="rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">Price</div>
          <div className="font-mono text-xl font-bold text-white leading-tight mt-1">{priceText}</div>
          <div className="text-xs text-zinc-500 mt-1">
            {product.pricePerUnit ?? product.unitText ?? "Unit pricing unavailable"}
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">Match</div>
          <div className={`mt-1 inline-flex items-center gap-2 rounded-full border px-2 py-1 text-xs font-semibold ${matchTone(match)}`}>
            {match}% match
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={match}>
            <div className="h-full rounded-full bg-linear-to-r from-yellow-400/70 via-yellow-300/70 to-teal-400/70 transition-all duration-500" style={{ width: `${match}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-black/30 px-3 py-2.5">
          <div className="text-[11px] uppercase tracking-widest text-zinc-500">Unit</div>
          <div className="text-sm text-white mt-1">
            {product.unitValue && product.unitName
              ? `${product.unitValue} ${product.unitName}`
              : "No unit details"}
          </div>
          <div className="text-xs text-zinc-500 mt-1">
            {product.unitPrice && product.unitPriceUnit
              ? `${formatCurrency(product.unitPrice, product.currency)} / ${product.unitPriceUnit}`
              : ""}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PriceComparePage() {
  const [form, setForm] = useState({
    productName: "",
    category: "",
    info: "",
    city: "",
    country: "",
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
  const endStageRef = useRef<StreamStage | null>(null);
  const receivedProductsRef = useRef(false);

  const inputBase =
    "w-full rounded-2xl bg-(--clr-surface2) border border-(--clr-border) px-4 py-3 text-sm text-(--clr-fg) placeholder:text-[color:var(--clr-fg-dim)] focus:outline-none focus:border-[color:var(--clr-border-hover)] focus:ring-2 focus:ring-[color:rgba(255,244,79,0.25)] transition";

  const progressPercent = useMemo(() => {
    if (!progress.total) return 0;
    return Math.min(100, Math.round((progress.completed / progress.total) * 100));
  }, [progress]);

  const emptyState = !isLoading && exactMatches.length === 0 && relatedProducts.length === 0;

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
    endStageRef.current = null;
    receivedProductsRef.current = false;
  };

  const handleAbort = () => {
    abortRef.current?.abort();
    setIsLoading(false);
    setStatusStage("idle");
    setStatusMessage("Canceled");
  };

  const parseSseChunk = (chunk: string) => {
    const normalized = chunk.replace(/\r\n/g, "\n").trim();
    if (!normalized) return null;
    let eventType = "message";
    const dataLines: string[] = [];

    normalized.split("\n").forEach((line) => {
      if (line.startsWith("event:")) {
        eventType = line.replace("event:", "").trim();
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.replace(/^data:\s?/, ""));
      }
    });

    const dataText = dataLines.join("\n").trim();
    if (!dataText) return null;

    try {
      const payload = JSON.parse(dataText) as Record<string, unknown>;
      return { eventType, payload };
    } catch (err) {
      console.error("Failed to parse SSE chunk:", dataText, err);
      return null;
    }
  };

  const handleStreamEvent = (eventType: string, payload: Record<string, unknown>) => {
    console.log("Stream event:", eventType, payload);

    if (eventType === "status") {
      const stage = payload.stage as StreamStage;
      const message = (payload.message as string) ?? "";
      if (stage) setStatusStage(stage);
      if (message) setStatusMessage(message);
      if (typeof payload.total === "number") {
        setProgress({ completed: 0, total: payload.total });
      }
      return;
    }

    if (eventType === "links") {
      const nextLinks = Array.isArray(payload.links) ? (payload.links as string[]) : [];
      setLinks(nextLinks);
      setStatusStage("crawling");
      setStatusMessage(`Found ${nextLinks.length} sources to crawl`);
      return;
    }

    if (eventType === "scrape") {
      const completed = Number(payload.completed ?? 0);
      const total = Number(payload.total ?? 0);
      setProgress({ completed, total });
      setStatusStage("crawling");
      setStatusMessage(`Crawling sources (${completed}/${total})`);
      return;
    }

    if (eventType === "products") {
      const exact = (payload.exactMatches as ProductResult[]) ?? [];
      const related = (payload.relatedProducts as ProductResult[]) ?? [];
      const completed = Number(payload.completed ?? progress.completed);
      const total = Number(payload.total ?? progress.total);
      const source = (payload.source as string) || "a source";
      console.log("Products received:", { exact: exact.length, related: related.length, completed, total, source });

      // Append new products instead of replacing (for incremental streaming)
      let newExactCount = 0;
      let newRelatedCount = 0;

      if (exact.length > 0) {
        setExactMatches(prev => {
          const existingUrls = new Set(prev.map(p => p.productUrl));
          const newProducts = exact.filter(p => !existingUrls.has(p.productUrl));
          newExactCount = newProducts.length;
          return [...prev, ...newProducts];
        });
      }

      if (related.length > 0) {
        setRelatedProducts(prev => {
          const existingUrls = new Set(prev.map(p => p.productUrl));
          const newProducts = related.filter(p => !existingUrls.has(p.productUrl));
          newRelatedCount = newProducts.length;
          return [...prev, ...newProducts];
        });
      }

      if (exact.length > 0 || related.length > 0) {
        receivedProductsRef.current = true;
      }

      // Update progress from the products event so the bar stays in sync
      if (typeof payload.completed === "number" && typeof payload.total === "number") {
        setProgress({ completed, total });
      }

      if (typeof payload.totalFound === "number") {
        setTotalFound(payload.totalFound);
      }

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
      return;
    }

    if (eventType === "analysis") {
      setBestPrice((payload.bestPrice as string | null) ?? null);
      setSellerPrice((payload.sellerPrice as string | null) ?? null);
      setSummary((payload.summary as string) ?? "");
      setSellerSummary((payload.sellerSummary as string) ?? "");
      setStatusStage("analysis");
      setStatusMessage("Finalizing market analysis...");
      return;
    }

    if (eventType === "complete") {
      const response = payload as unknown as CompareResponse;
      endStageRef.current = "complete";
      console.log("Complete response:", response);
      
      // For complete event, merge with existing products to ensure we have everything
      setExactMatches(prev => {
        const existingUrls = new Set(prev.map(p => p.productUrl));
        const newProducts = (response.exactMatches ?? []).filter(p => !existingUrls.has(p.productUrl));
        return [...prev, ...newProducts];
      });
      
      setRelatedProducts(prev => {
        const existingUrls = new Set(prev.map(p => p.productUrl));
        const newProducts = (response.relatedProducts ?? []).filter(p => !existingUrls.has(p.productUrl));
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
      return;
    }

    if (eventType === "error") {
      endStageRef.current = "error";
      setStatusStage("error");
      setStatusMessage("Request failed");
      setError((payload.message as string) ?? "Something went wrong");
      setIsLoading(false);
    }
  };

  const runStreamingCompare = async (payload: CompareRequest) => {
    const streamUrl = "/api/price-compare";
    console.log("🚀 Starting streaming request to:", streamUrl);
    
    try {
      const response = await fetch(streamUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify(payload),
        signal: abortRef.current?.signal,
        cache: "no-store" as RequestCache,
      });

      console.log("📡 Response received:", {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Streaming request failed");
        throw new Error(errorText || `HTTP ${response.status}: Streaming unavailable`);
      }

      if (!response.body) {
        throw new Error("Response body is empty");
      }

      console.log("📖 Starting to read stream...");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let chunkCount = 0;

      try {
        while (true) {
          const { value, done } = await reader.read();
          
          if (done) {
            console.log("✅ Stream done signal received, total chunks:", chunkCount);
            break;
          }
          
          if (!value || value.length === 0) {
            console.warn("⚠️ Empty chunk received, continuing...");
            continue;
          }
          
          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          console.log(`📦 Chunk ${chunkCount} (${value.length} bytes):`, chunk.substring(0, 200));
          
          // Normalize \r\n to \n BEFORE adding to buffer so boundary detection works
          buffer += chunk.replace(/\r\n/g, "\n");

          // Process all complete SSE messages (separated by \n\n)
          let boundaryIndex = buffer.indexOf("\n\n");
          while (boundaryIndex !== -1) {
            const sseChunk = buffer.slice(0, boundaryIndex);
            buffer = buffer.slice(boundaryIndex + 2);
            
            // Skip keepalive comments (: keepalive or empty comment lines)
            const trimmed = sseChunk.trim();
            if (!trimmed || trimmed.startsWith(":")) {
              if (trimmed) console.log("💓 Keepalive received");
              boundaryIndex = buffer.indexOf("\n\n");
              continue;
            }
            
            console.log("🔍 Processing SSE chunk:", sseChunk.substring(0, 200));
            
            const parsed = parseSseChunk(sseChunk);
            if (parsed) {
              console.log("✅ Parsed event:", parsed.eventType);
              handleStreamEvent(parsed.eventType, parsed.payload);
            } else {
              console.warn("⚠️ Failed to parse SSE chunk:", sseChunk);
            }
            
            boundaryIndex = buffer.indexOf("\n\n");
          }
        }
      } catch (readError) {
        console.error("❌ Error reading stream:", readError);
        throw readError;
      }

      console.log("📊 Stream reading complete, total chunks:", chunkCount);

      // Handle any remaining buffer (last event may not have trailing \n\n)
      if (buffer.trim()) {
        const trimmed = buffer.trim();
        if (!trimmed.startsWith(":")) {
          console.log("🔍 Processing remaining buffer:", buffer.substring(0, 200));
          const parsed = parseSseChunk(buffer);
          if (parsed) {
            console.log("✅ Parsed remaining event:", parsed.eventType);
            handleStreamEvent(parsed.eventType, parsed.payload);
          }
        }
      }

      if (!endStageRef.current) {
        if (receivedProductsRef.current) {
          setStatusStage("complete");
          setStatusMessage("Comparison complete!");
          setIsLoading(false);
        } else {
          throw new Error("Stream ended unexpectedly without results. The backend connection may have closed during crawling.");
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw err;
      }
      console.error("❌ Streaming error:", err);
      throw new Error("Streaming failed, will retry with standard mode");
    }
  };


  const runStandardCompare = async (payload: CompareRequest) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: abortRef.current?.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.error || `HTTP ${response.status}: Request failed`;
        throw new Error(message);
      }

      const data = (await response.json()) as CompareResponse;

      if (!data.success) {
        throw new Error(data.summary || "No results available");
      }

      setExactMatches(data.exactMatches ?? []);
      setRelatedProducts(data.relatedProducts ?? []);
      setTotalFound(data.totalFound ?? 0);
      setBestPrice(data.bestPrice ?? null);
      setSellerPrice(data.sellerPrice ?? null);
      setSummary(data.summary ?? "");
      setSellerSummary(data.sellerSummary ?? "");
      setTimestamp(data.timestamp ?? null);
      setSearchQueries(data.searchQueries ?? []);
      setSearchLinks(data.searchLinks ?? []);
      setStatusStage("complete");
      setStatusMessage("Comparison complete!");
      setIsLoading(false);
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        throw err;
      }
      console.error("Standard request error:", err);
      throw err;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const payload: CompareRequest = {
      productName: sanitizeValue(form.productName),
      category: form.category,
      info: sanitizeValue(form.info) || undefined,
      city: sanitizeValue(form.city) || undefined,
      country: sanitizeValue(form.country),
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
    endStageRef.current = null;

    try {
      if (streaming) {
        try {
          await runStreamingCompare(payload);
        } catch (streamErr) {
          if ((streamErr as Error).name === "AbortError") {
            throw streamErr;
          }
          setStatusStage("analysis");
          setStatusMessage("Streaming unavailable, switching to standard mode");
          // Use a fresh AbortController for the fallback so a prior cancel doesn't kill it
          abortRef.current = new AbortController();
          await runStandardCompare(payload);
        }
      } else {
        setStatusStage("analysis");
        setStatusMessage("Fetching full response");
        await runStandardCompare(payload);
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

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 right-[-20%] h-90 w-90 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,244,79,0.35),transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute -top-24 left-[-10%] h-75 w-75 rounded-full bg-[radial-gradient(circle_at_center,rgba(78,205,196,0.35),transparent_65%)] blur-3xl" />

      <header className="relative space-y-5 mb-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-(--clr-fg-muted)">
          <LuSparkles className="h-3.5 w-3.5" aria-hidden="true" />
          Price intelligence
        </div>
        <div className="space-y-3">
          <h1 className="font-naston text-3xl md:text-5xl text-(--clr-fg)">
            Price Compare
          </h1>
          <p className="font-serif italic text-base md:text-lg text-(--clr-fg-muted) max-w-2xl">
            Compare live market offers and spot the best price band before you negotiate.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <section className="bento-card noise-overlay p-6 md:p-7 bg-(--clr-charcoal)">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Request</p>
              <h2 className="text-xl font-semibold text-white">Compare a product</h2>
            </div>
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <LuSearch className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Product name *
              </label>
              <input
                className={inputBase}
                value={form.productName}
                onChange={(event) => setForm({ ...form, productName: event.target.value })}
                placeholder="iPhone 15 Pro"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Category *
              </label>
              <select
                className={`${inputBase} appearance-none`}
                value={form.category}
                onChange={(event) => setForm({ ...form, category: event.target.value })}
                required
              >
                <option value="">Select a category</option>
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Variant info
              </label>
              <input
                className={inputBase}
                value={form.info}
                onChange={(event) => setForm({ ...form, info: event.target.value })}
                placeholder="256GB Blue"
              />
              <p className="text-xs text-zinc-500">Optional details like size, color, or bundle.</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                City
              </label>
              <input
                className={inputBase}
                value={form.city}
                onChange={(event) => setForm({ ...form, city: event.target.value })}
                placeholder="Dhaka"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Country *
              </label>
              <input
                className={inputBase}
                value={form.country}
                onChange={(event) => setForm({ ...form, country: event.target.value })}
                placeholder="Bangladesh"
                required
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3 text-sm text-zinc-300">
              <span className="flex items-center gap-2">
                <LuInfo className="h-4 w-4 text-zinc-400" aria-hidden="true" />
                Stream live updates
              </span>
              <label className="inline-flex items-center gap-2">
                <span className="text-xs text-zinc-400">{streaming ? "On" : "Off"}</span>
                <input
                  type="checkbox"
                  checked={streaming}
                  onChange={(event) => setStreaming(event.target.checked)}
                  className="h-4 w-4 rounded border border-white/20 bg-transparent text-primary focus:ring-primary"
                />
              </label>
            </div>

            {error && (
              <div role="alert" className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn-press inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-[#111111] transition disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                    Comparing
                  </>
                ) : (
                  <>
                    Compare prices
                    <LuChevronRight className="h-4 w-4" aria-hidden="true" />
                  </>
                )}
              </button>
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleAbort}
                  className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-zinc-200 hover:border-white/30"
                >
                  Cancel
                  <LuX className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setForm({ productName: "", category: "", info: "", city: "", country: "" })}
                  className="btn-press inline-flex items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-xs font-semibold text-zinc-300 hover:border-white/30"
                >
                  Clear form
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="space-y-6">
          <div className="bento-card noise-overlay p-6 md:p-7 bg-(--clr-charcoal)">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Status</p>
                <h2 className="text-xl font-semibold text-white">Live pipeline</h2>
              </div>
              <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${stageTone(statusStage)}`}>
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

            <p className="mt-3 text-sm text-zinc-300 min-h-[20px]" aria-live="polite">
              {statusMessage}
            </p>

            {isLoading && (
              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Crawling progress</span>
                  <span>{progress.total ? `${progress.completed} / ${progress.total}` : "Initializing..."}</span>
                </div>
                <div className="h-2 w-full rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                  <div
                    className="h-full rounded-full bg-linear-to-r from-yellow-400/70 via-yellow-300/70 to-teal-400/70 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 bg-black/20">
                <LuLink2 className="h-3.5 w-3.5" aria-hidden="true" />
                Sources: <span className="font-semibold text-white">{links.length || searchLinks.length}</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 bg-black/20">
                <LuSearch className="h-3.5 w-3.5" aria-hidden="true" />
                Queries: <span className="font-semibold text-white">{searchQueries.length || (form.productName ? 1 : 0)}</span>
              </span>
              {totalFound !== null && totalFound > 0 && (
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
                  <LuCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  Found: <span className="font-semibold">{totalFound}</span>
                </span>
              )}
            </div>

            {(links.length > 0 || searchLinks.length > 0) && (
              <details className="mt-4 rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-xs text-zinc-300">
                <summary className="cursor-pointer list-none font-semibold text-zinc-200 hover:text-white transition-colors">
                  View sources ({(links.length ? links : searchLinks).length})
                </summary>
                <ul className="mt-2 space-y-1 text-zinc-400 max-h-40 overflow-y-auto">
                  {(links.length ? links : searchLinks).map((link, idx) => (
                    <li key={`${link}-${idx}`} className="truncate hover:text-zinc-300 transition-colors">
                      <a href={link} target="_blank" rel="noreferrer" className="hover:underline">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bento-card noise-overlay p-5 bg-(--clr-charcoal) hover:border-emerald-400/30 transition-all">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Best price</p>
              <div className="mt-3 text-2xl font-bold text-white">
                {isLoading && !bestPrice ? (
                  <span className="flex items-center gap-2 text-lg text-zinc-400">
                    <LuLoader className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Analyzing...
                  </span>
                ) : (
                  bestPrice ?? "Not available"
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">Most competitive listing found.</p>
            </div>
            <div className="bento-card noise-overlay p-5 bg-(--clr-charcoal) hover:border-yellow-400/30 transition-all">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Seller range</p>
              <div className="mt-3 text-2xl font-bold text-white">
                {isLoading && !sellerPrice ? (
                  <span className="flex items-center gap-2 text-lg text-zinc-400">
                    <LuLoader className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Analyzing...
                  </span>
                ) : (
                  sellerPrice ?? "Not available"
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">Expected negotiation band.</p>
            </div>
            <div className="bento-card noise-overlay p-5 bg-(--clr-charcoal) hover:border-teal-400/30 transition-all">
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Total found</p>
              <div className="mt-3 text-2xl font-bold text-white">
                {isLoading && totalFound === null ? (
                  <span className="flex items-center gap-2 text-lg text-zinc-400">
                    <LuLoader className="h-5 w-5 animate-spin" aria-hidden="true" />
                    Searching...
                  </span>
                ) : (
                  totalFound ?? 0
                )}
              </div>
              <p className="mt-2 text-xs text-zinc-500">
                {timestamp ? `Updated ${formatTimestamp(timestamp)}` : "Awaiting results"}
              </p>
            </div>
          </div>

          <div className="bento-card noise-overlay p-6 md:p-7 bg-(--clr-charcoal)">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <LuActivity className="h-5 w-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Summary</p>
                <h3 className="text-lg font-semibold text-white">Market overview</h3>
              </div>
            </div>
            {isLoading && !summary ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-zinc-400">
                <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                Generating market analysis...
              </div>
            ) : (
              <>
                <p className="mt-4 text-sm text-zinc-300 leading-relaxed">
                  {summary || "Run a comparison to see the market summary."}
                </p>
                {sellerSummary && (
                  <div className="mt-3 rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Seller guidance</p>
                    <p className="text-sm text-zinc-400 leading-relaxed">{sellerSummary}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {(exactMatches.length > 0 || relatedProducts.length > 0 || isLoading) && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Exact matches
                    {isLoading && (
                      <LuLoader className="h-4 w-4 animate-spin text-zinc-400" aria-hidden="true" />
                    )}
                  </h3>
                  <span className={`text-xs font-semibold ${exactMatches.length > 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>
                    {exactMatches.length} {exactMatches.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

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
                  <div className="bento-card noise-overlay p-5 bg-(--clr-charcoal) text-sm text-zinc-400 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Searching for exact matches...
                      </>
                    ) : (
                      "No exact matches found. Check related products below."
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    Related products
                    {isLoading && (
                      <LuLoader className="h-4 w-4 animate-spin text-zinc-400" aria-hidden="true" />
                    )}
                  </h3>
                  <span className={`text-xs font-semibold ${relatedProducts.length > 0 ? 'text-teal-400' : 'text-zinc-400'}`}>
                    {relatedProducts.length} {relatedProducts.length === 1 ? 'item' : 'items'}
                  </span>
                </div>

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
                  <div className="bento-card noise-overlay p-5 bg-(--clr-charcoal) text-sm text-zinc-400 flex items-center gap-2">
                    {isLoading ? (
                      <>
                        <LuLoader className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Finding related products...
                      </>
                    ) : (
                      "No related products found."
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {emptyState && (
            <div className="bento-card noise-overlay p-6 bg-(--clr-charcoal) text-sm text-zinc-400">
              Enter a product, pick a category, and compare to see results.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

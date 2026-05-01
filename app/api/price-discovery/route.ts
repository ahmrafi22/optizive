import { NextResponse } from "next/server";
import type { PriceDiscoveryRequest, PriceDiscoveryResponse } from "@/types/price-monitor";
import { runPriceDiscoveryPipeline } from "@/lib/price-monitor/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RateEntry = {
  count: number;
  windowStartMs: number;
};

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 10;
const rateLimitStore = new Map<string, RateEntry>();

function fallbackResponse(product: string, message: string): PriceDiscoveryResponse {
  return {
    product,
    sources: [],
    summary: {
      lowest_price: "Not Found",
      highest_price: "Not Found",
      average_price: "Not Found",
      total_sources: 0,
    },
    analysis: {
      best_deal: `No verified listing found for ${product || "this product"}`,
      market_insight: "Data collection is incomplete for this request.",
      risk_flags: [message],
      recommendation:
        "Retry with a more specific product name (brand + model + storage/variant).",
    },
    diagnostics: {
      discovery: {
        status: "error",
        message,
        general_query: product ? `${product} price Bangladesh` : "N/A",
        general_results: 0,
        candidate_domains: 0,
        product_pages: 0,
      },
      scraping: {
        status: "warning",
        message: "Scraping skipped.",
        attempted_urls: 0,
        extracted_prices: 0,
      },
      analysis: {
        status: "warning",
        message: "Analysis skipped.",
        model: "nvidia/nemotron-3-super-120b-a12b:free",
        used_fallback: true,
      },
    },
  };
}

function getClientIdentifier(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || "local";
}

function isRateLimited(request: Request): boolean {
  const key = getClientIdentifier(request);
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || now - existing.windowStartMs > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { count: 1, windowStartMs: now });
    return false;
  }

  if (existing.count >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  existing.count += 1;
  rateLimitStore.set(key, existing);
  return false;
}

export async function POST(request: Request) {
  if (isRateLimited(request)) {
    return NextResponse.json(
      fallbackResponse("", "Rate limit exceeded. Please wait and retry."),
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as PriceDiscoveryRequest | null;
  const productName = body?.productName?.trim() ?? "";
  const country = body?.country?.trim() || "Bangladesh";

  if (!productName) {
    return NextResponse.json(
      fallbackResponse("", "Product name is required."),
      { status: 400 }
    );
  }

  try {
    const result = await runPriceDiscoveryPipeline(productName, country);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      fallbackResponse(productName, "Pipeline execution failed unexpectedly."),
      { status: 500 }
    );
  }
}

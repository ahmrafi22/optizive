import type {
  PipelineDiagnostics,
  PriceDiscoveryResponse,
  ScrapedProductSignal,
} from "@/types/price-monitor";
import { discoverProductUrls } from "@/lib/price-monitor/search-discovery";
import { scrapeProductData } from "@/lib/price-monitor/scrape-data";
import { cleanAndSummarize } from "@/lib/price-monitor/utils";
import { generatePriceAnalysis, NEMOTRON_MODEL } from "@/lib/price-monitor/llm-analysis";

function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export async function runPriceDiscoveryPipeline(
  productName: string,
  country = "Bangladesh"
): Promise<PriceDiscoveryResponse> {
  const normalizedProductName = productName.trim();
  const validationFlags: string[] = [];
  const generalQuery = `${normalizedProductName} price ${country}`;

  const diagnostics: PipelineDiagnostics = {
    discovery: {
      status: "warning",
      message: "Discovery not started.",
      general_query: generalQuery,
      general_results: 0,
      candidate_domains: 0,
      product_pages: 0,
    },
    scraping: {
      status: "warning",
      message: "Scraping not started.",
      attempted_urls: 0,
      extracted_prices: 0,
    },
    analysis: {
      status: "warning",
      message: "Analysis not started.",
      model: NEMOTRON_MODEL,
      used_fallback: true,
    },
  };

  let discoveredTargets = [];
  try {
    const discoveryResult = await discoverProductUrls(normalizedProductName, country);
    discoveredTargets = discoveryResult.targets;
    diagnostics.discovery = discoveryResult.diagnostics;

    if (discoveryResult.diagnostics.status !== "ok") {
      validationFlags.push(`Discovery: ${discoveryResult.diagnostics.message}`);
    }
  } catch (error) {
    const message = `Discovery error: ${errorMessage(error)}`;
    diagnostics.discovery = {
      status: "error",
      message,
      general_query: generalQuery,
      general_results: 0,
      candidate_domains: 0,
      product_pages: 0,
    };
    validationFlags.push(message);
  }

  let scrapedSignals: ScrapedProductSignal[] = [];
  if (discoveredTargets.length > 0) {
    try {
      scrapedSignals = await scrapeProductData(discoveredTargets);
      const extractedPrices = scrapedSignals.filter(
        (signal) => signal.priceValueBdt !== null
      ).length;

      const scrapeStatus = extractedPrices > 0 ? "ok" : "warning";
      const scrapeMessage =
        extractedPrices > 0
          ? "Scraping completed."
          : "Scraping ran but extracted zero prices. Target pages may block bots or hide prices behind scripts.";

      diagnostics.scraping = {
        status: scrapeStatus,
        message: scrapeMessage,
        attempted_urls: discoveredTargets.length,
        extracted_prices: extractedPrices,
      };

      if (scrapeStatus !== "ok") {
        validationFlags.push(`Scraping: ${scrapeMessage}`);
      }
    } catch (error) {
      const message = `Scraping error: ${errorMessage(error)}`;
      diagnostics.scraping = {
        status: "error",
        message,
        attempted_urls: discoveredTargets.length,
        extracted_prices: 0,
      };
      validationFlags.push(message);
    }
  } else {
    const message = "Scraping skipped because discovery returned zero product pages.";
    diagnostics.scraping = {
      status: "warning",
      message,
      attempted_urls: 0,
      extracted_prices: 0,
    };
    validationFlags.push(message);
  }

  const cleaned = cleanAndSummarize(scrapedSignals);
  const mergedFlags = [...new Set([...validationFlags, ...cleaned.validationFlags])];

  const analysisResult = await generatePriceAnalysis({
    productName: normalizedProductName,
    country,
    sources: cleaned.sources,
    summary: cleaned.summary,
    validationFlags: mergedFlags,
  });

  diagnostics.analysis = {
    status: analysisResult.usedFallback ? "warning" : "ok",
    message: analysisResult.message,
    model: analysisResult.model,
    used_fallback: analysisResult.usedFallback,
  };

  if (analysisResult.usedFallback) {
    validationFlags.push(`Analysis: ${analysisResult.message}`);
  }

  const riskFlags = [
    ...new Set([...analysisResult.analysis.risk_flags, ...validationFlags, ...mergedFlags]),
  ];

  return {
    product: normalizedProductName,
    sources: cleaned.sources,
    summary: cleaned.summary,
    analysis: {
      ...analysisResult.analysis,
      risk_flags: riskFlags,
    },
    diagnostics,
  };
}

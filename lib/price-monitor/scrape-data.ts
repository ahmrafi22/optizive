import FirecrawlApp from "@mendable/firecrawl-js";
import type {
  DiscoveredProductUrl,
  ScrapedProductSignal,
} from "@/types/price-monitor";
import { extractPriceFromText, inferAvailability } from "@/lib/price-monitor/utils";

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractProductNameFromText(text: string, fallback: string): string {
  const headingMatch = text.match(/^#\s+(.+)$/m) ?? text.match(/^(.{8,120})$/m);
  const candidate = headingMatch?.[1] ?? headingMatch?.[0] ?? fallback;
  return normalizeWhitespace(candidate).slice(0, 120);
}

function extractTextFromFirecrawl(payload: unknown): string {
  const response = payload as {
    markdown?: string;
    content?: string;
    html?: string;
    data?: {
      markdown?: string;
      content?: string;
      html?: string;
      metadata?: {
        title?: string;
        description?: string;
      };
    };
  };

  const parts = [
    response.data?.metadata?.title,
    response.data?.metadata?.description,
    response.data?.markdown,
    response.data?.content,
    response.data?.html,
    response.markdown,
    response.content,
    response.html,
  ].filter((part): part is string => typeof part === "string" && part.length > 0);

  return normalizeWhitespace(parts.join("\n\n"));
}

async function scrapeSingleUrl(
  firecrawl: FirecrawlApp,
  target: DiscoveredProductUrl
): Promise<ScrapedProductSignal> {
  try {
    const response = await firecrawl.scrapeUrl(
      target.url,
      {
        formats: ["markdown", "html"],
        onlyMainContent: true,
      } as never
    );

    const text = extractTextFromFirecrawl(response);

    const {
      rawPrice,
      currency,
      priceValueBdt,
      listPriceValueBdt,
      discountAmountBdt,
      estimated,
    } = extractPriceFromText(text, { productNameHint: target.title });

    return {
      domain: target.domain,
      url: target.url,
      productName: extractProductNameFromText(text, target.title),
      availability: inferAvailability(text),
      rawPrice,
      currency,
      priceValueBdt,
      listPriceValueBdt,
      discountAmountBdt,
      estimated,
    };
  } catch {
    return {
      domain: target.domain,
      url: target.url,
      productName: target.title,
      availability: "Unknown",
      rawPrice: null,
      currency: null,
      priceValueBdt: null,
      listPriceValueBdt: null,
      discountAmountBdt: null,
      estimated: false,
    };
  }
}

async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T) => Promise<R>
): Promise<R[]> {
  const workers = Array.from({ length: Math.max(1, concurrency) }, async (_, index) => {
    const output: R[] = [];
    for (let cursor = index; cursor < items.length; cursor += concurrency) {
      output.push(await mapper(items[cursor]));
    }
    return output;
  });

  const chunks = await Promise.all(workers);
  return chunks.flat();
}

export async function scrapeProductData(
  targets: DiscoveredProductUrl[]
): Promise<ScrapedProductSignal[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is missing.");
  }

  const firecrawl = new FirecrawlApp({ apiKey });
  const cappedTargets = targets.slice(0, 15);

  return runWithConcurrency(cappedTargets, 3, async (target) =>
    scrapeSingleUrl(firecrawl, target)
  );
}

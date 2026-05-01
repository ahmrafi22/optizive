import type {
  PriceSource,
  PriceSummary,
  ScrapedProductSignal,
} from "@/types/price-monitor";

const CURRENCY_TO_BDT: Record<string, number> = {
  BDT: 1,
  TK: 1,
  TAKA: 1,
  USD: 118,
  EUR: 128,
  GBP: 150,
  INR: 1.45,
};

const PRICE_PATTERNS: Array<{ regex: RegExp; currency: string }> = [
  {
    regex:
      /(?:৳|tk\.?|taka|bdt)\s*([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]{2,8}(?:\.[0-9]{1,2})?)/gi,
    currency: "BDT",
  },
  {
    regex:
      /(?:\$|usd)\s*([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]{2,8}(?:\.[0-9]{1,2})?)/gi,
    currency: "USD",
  },
  {
    regex:
      /(?:€|eur)\s*([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]{2,8}(?:\.[0-9]{1,2})?)/gi,
    currency: "EUR",
  },
  {
    regex:
      /(?:£|gbp)\s*([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]{2,8}(?:\.[0-9]{1,2})?)/gi,
    currency: "GBP",
  },
  {
    regex:
      /(?:₹|inr)\s*([0-9]{1,3}(?:[,.\s][0-9]{3})+|[0-9]{2,8}(?:\.[0-9]{1,2})?)/gi,
    currency: "INR",
  },
  {
    regex: /([0-9]{1,3}(?:[,\s][0-9]{3})+|[0-9]{4,8})\s*(?:tk\.?|taka|bdt)/gi,
    currency: "BDT",
  },
];

const EXPLICIT_PRICE_HINT =
  /(cash price|price in bangladesh|our price|selling price|offer price|sale price|price:|price\b|buy now|add to cart)/i;
const DISCOUNT_HINT = /(discount|off|save|cashback|voucher|coupon|instantly)/i;
const INSTALLMENT_HINT = /(emi|monthly|per month|installment)/i;
const SHIPPING_HINT = /(shipping|delivery fee|delivery charge|service charge)/i;
const LIST_PRICE_HINT = /(old price|regular price|mrp|was\s*৳?|~~|<del|strike)/i;

type PriceCandidate = {
  amount: number;
  currency: string;
  raw: string;
  score: number;
  context: string;
  index: number;
  priceValueBdt: number;
  estimated: boolean;
};

function parseAmount(value: string): number {
  const normalized = value.replace(/[\s,]/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function convertToBdt(amount: number, currency: string): {
  priceValueBdt: number;
  estimated: boolean;
} {
  const upper = currency.toUpperCase();
  const rate = CURRENCY_TO_BDT[upper] ?? 1;
  return {
    priceValueBdt: Math.round(amount * rate),
    estimated: upper !== "BDT" && upper !== "TK" && upper !== "TAKA",
  };
}

function getContext(text: string, index: number): string {
  const start = Math.max(0, index - 140);
  const end = Math.min(text.length, index + 140);
  return text.slice(start, end).replace(/\s+/g, " ").trim();
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function buildPriceCandidates(
  text: string,
  productNameHint?: string
): PriceCandidate[] {
  const candidates: PriceCandidate[] = [];
  const lowerText = text.toLowerCase();
  const productTokens = tokenize(productNameHint ?? "");

  for (const pattern of PRICE_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    let match: RegExpExecArray | null;

    while ((match = regex.exec(text)) !== null) {
      if (!match[1]) {
        continue;
      }

      const amount = parseAmount(match[1]);
      if (!Number.isFinite(amount) || amount <= 0) {
        continue;
      }

      const { priceValueBdt, estimated } = convertToBdt(amount, pattern.currency);
      const index = match.index;
      const context = getContext(text, index);
      const lowerContext = context.toLowerCase();

      let score = 0;

      if (EXPLICIT_PRICE_HINT.test(lowerContext)) {
        score += 70;
      }

      if (/(in stock|availability|shop now|add to cart|specification)/i.test(lowerContext)) {
        score += 20;
      }

      if (LIST_PRICE_HINT.test(lowerContext)) {
        score -= 14;
      }

      if (DISCOUNT_HINT.test(lowerContext)) {
        score -= 60;
      }

      if (INSTALLMENT_HINT.test(lowerContext)) {
        score -= 40;
      }

      if (SHIPPING_HINT.test(lowerContext)) {
        score -= 24;
      }

      if (priceValueBdt < 1_000) {
        score -= 90;
      } else if (priceValueBdt < 10_000) {
        score -= 15;
      } else if (priceValueBdt >= 20_000 && priceValueBdt <= 10_000_000) {
        score += 20;
      }

      if (pattern.currency === "BDT") {
        score += 8;
      }

      if (
        productTokens.length > 0 &&
        productTokens.some((token) => lowerContext.includes(token))
      ) {
        score += 16;
      }

      // Penalize tiny promotional numbers when much larger prices also exist on page.
      if (priceValueBdt < 5_000 && /price/.test(lowerText) && DISCOUNT_HINT.test(lowerContext)) {
        score -= 40;
      }

      candidates.push({
        amount,
        currency: pattern.currency,
        raw: match[0],
        score,
        context,
        index,
        priceValueBdt,
        estimated,
      });
    }
  }

  const deduped = new Map<string, PriceCandidate>();
  for (const candidate of candidates) {
    const key = `${candidate.priceValueBdt}:${candidate.currency}:${candidate.index}`;
    if (!deduped.has(key)) {
      deduped.set(key, candidate);
    }
  }

  return [...deduped.values()];
}

function pickPrimaryPrice(candidates: PriceCandidate[]): PriceCandidate | null {
  if (candidates.length === 0) {
    return null;
  }

  const maxValue = Math.max(...candidates.map((candidate) => candidate.priceValueBdt));

  const rescored = candidates.map((candidate) => {
    let score = candidate.score;

    if (candidate.priceValueBdt < maxValue * 0.08 && DISCOUNT_HINT.test(candidate.context)) {
      score -= 70;
    }

    if (candidate.priceValueBdt >= maxValue * 0.4) {
      score += 8;
    }

    return { ...candidate, score };
  });

  rescored.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.priceValueBdt - a.priceValueBdt;
  });

  const top = rescored[0];
  if (top.score > -40) {
    return top;
  }

  return rescored.find((candidate) => candidate.priceValueBdt >= maxValue * 0.5) ?? top;
}

function pickListPrice(
  currentPriceBdt: number,
  candidates: PriceCandidate[]
): number | null {
  const explicit = candidates
    .filter(
      (candidate) =>
        candidate.priceValueBdt > currentPriceBdt &&
        LIST_PRICE_HINT.test(candidate.context)
    )
    .sort((a, b) => a.priceValueBdt - b.priceValueBdt)[0];

  if (explicit) {
    return explicit.priceValueBdt;
  }

  const implicit = candidates
    .filter(
      (candidate) =>
        candidate.priceValueBdt > currentPriceBdt * 1.05 &&
        candidate.priceValueBdt <= currentPriceBdt * 2.2
    )
    .sort((a, b) => a.priceValueBdt - b.priceValueBdt)[0];

  return implicit?.priceValueBdt ?? null;
}

function pickDiscountAmount(
  currentPriceBdt: number,
  listPriceBdt: number | null,
  candidates: PriceCandidate[]
): number | null {
  if (listPriceBdt && listPriceBdt > currentPriceBdt) {
    return listPriceBdt - currentPriceBdt;
  }

  const discountCandidate = candidates
    .filter(
      (candidate) =>
        DISCOUNT_HINT.test(candidate.context) &&
        candidate.priceValueBdt < currentPriceBdt * 0.3
    )
    .sort((a, b) => b.score - a.score)[0];

  return discountCandidate?.priceValueBdt ?? null;
}

export function extractPriceFromText(
  text: string,
  options?: { productNameHint?: string }
): {
  rawPrice: string | null;
  currency: string | null;
  priceValueBdt: number | null;
  listPriceValueBdt: number | null;
  discountAmountBdt: number | null;
  estimated: boolean;
} {
  const candidates = buildPriceCandidates(text, options?.productNameHint);
  const selected = pickPrimaryPrice(candidates);

  if (!selected) {
    return {
      rawPrice: null,
      currency: null,
      priceValueBdt: null,
      listPriceValueBdt: null,
      discountAmountBdt: null,
      estimated: false,
    };
  }

  const listPriceValueBdt = pickListPrice(selected.priceValueBdt, candidates);
  const discountAmountBdt = pickDiscountAmount(
    selected.priceValueBdt,
    listPriceValueBdt,
    candidates
  );

  return {
    rawPrice: selected.raw,
    currency: selected.currency,
    priceValueBdt: selected.priceValueBdt,
    listPriceValueBdt,
    discountAmountBdt,
    estimated: selected.estimated,
  };
}

export function inferAvailability(text: string): string {
  const lower = text.toLowerCase();
  if (/(out of stock|sold out|unavailable|currently unavailable)/.test(lower)) {
    return "Out of Stock";
  }

  if (/(pre-?order|coming soon)/.test(lower)) {
    return "Pre-order";
  }

  if (/(in stock|available|ready stock|add to cart|buy now)/.test(lower)) {
    return "In Stock";
  }

  return "Unknown";
}

export function formatBdt(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "Not Found";
  }

  return `৳${Math.round(value).toLocaleString("en-BD")}`;
}

function toPriceSource(signal: ScrapedProductSignal): PriceSource {
  const originalPrice =
    signal.listPriceValueBdt !== null &&
    signal.priceValueBdt !== null &&
    signal.listPriceValueBdt > signal.priceValueBdt
      ? formatBdt(signal.listPriceValueBdt)
      : undefined;

  const discount =
    signal.discountAmountBdt !== null && signal.discountAmountBdt > 0
      ? formatBdt(signal.discountAmountBdt)
      : undefined;

  return {
    domain: signal.domain,
    price: formatBdt(signal.priceValueBdt),
    availability: signal.availability,
    url: signal.url,
    originalPrice,
    discount,
    estimated: signal.estimated || undefined,
  };
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }

  return sorted[middle];
}

function mean(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function cleanAndSummarize(
  signals: ScrapedProductSignal[]
): {
  sources: PriceSource[];
  summary: PriceSummary;
  validationFlags: string[];
} {
  const deduped = new Map<string, ScrapedProductSignal>();

  for (const signal of signals) {
    const key = `${signal.domain}:${signal.url}`;
    if (!deduped.has(key)) {
      deduped.set(key, signal);
    }
  }

  const cleaned = [...deduped.values()]
    .map((signal) => {
      const price = signal.priceValueBdt;
      if (price !== null && (price < 200 || price > 20_000_000)) {
        return {
          ...signal,
          priceValueBdt: null,
          listPriceValueBdt: null,
          discountAmountBdt: null,
          rawPrice: null,
        };
      }
      return signal;
    });

  const numericPricesBeforeFilter = cleaned
    .map((item) => item.priceValueBdt)
    .filter((value): value is number => value !== null);

  const validationFlags: string[] = [];
  const center = median(numericPricesBeforeFilter);

  // Remove implausibly low outliers when enough sources exist.
  const filtered =
    numericPricesBeforeFilter.length >= 3
      ? cleaned.filter((item) => {
          if (item.priceValueBdt === null) {
            return true;
          }

          const lowOutlierThreshold = center * 0.55;
          if (item.priceValueBdt < lowOutlierThreshold) {
            validationFlags.push(
              `Removed very low outlier from ${item.domain} (${formatBdt(
                item.priceValueBdt
              )}) compared to market cluster.`
            );
            return false;
          }

          return true;
        })
      : cleaned;

  filtered.sort((a, b) => {
    if (a.priceValueBdt === null && b.priceValueBdt === null) {
      return 0;
    }
    if (a.priceValueBdt === null) {
      return 1;
    }
    if (b.priceValueBdt === null) {
      return -1;
    }
    return a.priceValueBdt - b.priceValueBdt;
  });

  const numericPrices = filtered
    .map((item) => item.priceValueBdt)
    .filter((value): value is number => value !== null);
  const filteredCenter = median(numericPrices);

  const sources = filtered.map((item) => {
    const source = toPriceSource(item);
    if (item.priceValueBdt === null || filteredCenter <= 0) {
      return source;
    }

    if (item.priceValueBdt < filteredCenter * 0.75) {
      source.suspicious = true;
      validationFlags.push(
        `${item.domain} is unusually low (${formatBdt(item.priceValueBdt)}).`
      );
    } else if (item.priceValueBdt > filteredCenter * 1.35) {
      source.suspicious = true;
      validationFlags.push(
        `${item.domain} is unusually high (${formatBdt(item.priceValueBdt)}).`
      );
    }

    return source;
  });

  const usableForSummary = numericPrices.filter(
    (value) =>
      filteredCenter <= 0 ||
      (value >= filteredCenter * 0.55 && value <= filteredCenter * 1.9)
  );

  const lowest = usableForSummary.length > 0 ? Math.min(...usableForSummary) : null;
  const highest =
    usableForSummary.length > 0 ? Math.max(...usableForSummary) : null;
  const average =
    usableForSummary.length > 0 ? Math.round(mean(usableForSummary)) : null;

  return {
    sources,
    summary: {
      lowest_price: formatBdt(lowest),
      highest_price: formatBdt(highest),
      average_price: formatBdt(average),
      total_sources: sources.length,
    },
    validationFlags: [...new Set(validationFlags)],
  };
}

export function fallbackAnalysis(
  productName: string,
  sources: PriceSource[],
  validationFlags: string[]
): {
  bestDeal: string;
  marketInsight: string;
  recommendation: string;
  riskFlags: string[];
} {
  const priced = sources.filter((source) => source.price !== "Not Found");

  const best = priced[0];
  const bestDeal = best
    ? `${best.domain} at ${best.price}`
    : `No confirmed price found for ${productName}`;

  const marketInsight =
    priced.length >= 3
      ? `Market has ${priced.length} valid listings. Price spread suggests normal variation across sellers, import channels, and stock conditions.`
      : `Limited listings found. Treat this result as estimated until more stores are discovered.`;

  const recommendation = best
    ? `Use ${best.price} as a lower benchmark and position your selling price slightly above if warranty/service support is stronger.`
    : `Retry search with a more specific model name to improve extraction quality.`;

  return {
    bestDeal,
    marketInsight,
    recommendation,
    riskFlags: validationFlags,
  };
}

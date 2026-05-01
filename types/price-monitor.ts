export type PriceDiscoveryRequest = {
  productName: string;
  country?: string;
};

export type PriceSource = {
  domain: string;
  price: string;
  availability: string;
  url: string;
  originalPrice?: string;
  discount?: string;
  suspicious?: boolean;
  estimated?: boolean;
};

export type PriceSummary = {
  lowest_price: string;
  highest_price: string;
  average_price: string;
  total_sources: number;
};

export type PriceAnalysis = {
  best_deal: string;
  market_insight: string;
  risk_flags: string[];
  recommendation: string;
};

export type PipelineStageStatus = "ok" | "warning" | "error";

export type PipelineDiagnostics = {
  discovery: {
    status: PipelineStageStatus;
    message: string;
    general_query: string;
    general_results: number;
    candidate_domains: number;
    product_pages: number;
    browser_path?: string;
  };
  scraping: {
    status: PipelineStageStatus;
    message: string;
    attempted_urls: number;
    extracted_prices: number;
  };
  analysis: {
    status: PipelineStageStatus;
    message: string;
    model: string;
    used_fallback: boolean;
  };
};

export type PriceDiscoveryResponse = {
  product: string;
  sources: PriceSource[];
  summary: PriceSummary;
  analysis: PriceAnalysis;
  diagnostics?: PipelineDiagnostics;
};

export type DiscoveredProductUrl = {
  domain: string;
  url: string;
  title: string;
};

export type ScrapedProductSignal = {
  domain: string;
  url: string;
  productName: string;
  availability: string;
  rawPrice: string | null;
  currency: string | null;
  priceValueBdt: number | null;
  listPriceValueBdt: number | null;
  discountAmountBdt: number | null;
  estimated: boolean;
};

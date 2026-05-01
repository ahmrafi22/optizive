import { existsSync } from "node:fs";
import puppeteer, { type Page } from "puppeteer-core";
import type { DiscoveredProductUrl } from "@/types/price-monitor";

type SearchResult = {
  title: string;
  url: string;
};

type SearchCapture = {
  results: SearchResult[];
  pageTextSample: string;
};

export type DiscoveryDiagnostics = {
  status: "ok" | "warning";
  message: string;
  general_query: string;
  general_results: number;
  candidate_domains: number;
  product_pages: number;
  browser_path: string;
};

export type DiscoveryResult = {
  targets: DiscoveredProductUrl[];
  diagnostics: DiscoveryDiagnostics;
};

const SEARCH_ENGINE_BLOCKLIST = new Set([
  "google.com",
  "www.google.com",
  "duckduckgo.com",
  "www.duckduckgo.com",
  "bing.com",
  "www.bing.com",
  "youtube.com",
  "www.youtube.com",
  "facebook.com",
  "www.facebook.com",
  "wikipedia.org",
  "www.wikipedia.org",
]);

function resolveBrowserExecutablePath(): string {
  const fromEnv = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (fromEnv && existsSync(fromEnv)) {
    return fromEnv;
  }

  const candidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/google-chrome-stable",
    "/usr/bin/chromium-browser",
    "/usr/bin/chromium",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  ];

  const matched = candidates.find((candidate) => existsSync(candidate));
  if (matched) {
    return matched;
  }

  throw new Error(
    "No local browser found. Set PUPPETEER_EXECUTABLE_PATH to your Chrome/Edge binary."
  );
}

function sanitizeUrl(rawUrl: string): string | null {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

function unwrapSearchRedirect(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    const target = parsed.searchParams.get("uddg") ?? parsed.searchParams.get("u");
    if (!target) {
      return rawUrl;
    }
    return decodeURIComponent(target);
  } catch {
    return rawUrl;
  }
}

function normalizeDomain(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
}

function looksLikeProductPage(url: string, title: string, productName: string): boolean {
  const urlObject = new URL(url);
  const path = urlObject.pathname.toLowerCase();
  const full = `${title} ${path}`.toLowerCase();

  if (
    /(category|categories|blog|article|news|help|support|contact|login|signup|account|wishlist|cart|checkout|about)/.test(
      path
    )
  ) {
    return false;
  }

  const productUrlSignals = /(product|products|item|shop|buy|p\/|dp\/|sku|model|details)/;
  if (productUrlSignals.test(path)) {
    return true;
  }

  const tokens = tokenize(productName);
  const matchedTokens = tokens.filter((token) => full.includes(token)).length;
  return matchedTokens >= Math.min(2, tokens.length);
}

async function collectSearchResults(
  page: Page,
  query: string,
  limit: number
): Promise<SearchCapture> {
  const searchUrls = [
    `https://duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    `https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=web`,
  ];

  let lastPageTextSample = "";

  for (const searchUrl of searchUrls) {
    try {
      await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 45_000 });
      await page.waitForSelector("body", { timeout: 15_000 });

      const capture = await page.evaluate(() => {
        const candidateNodes = Array.from(
          document.querySelectorAll<HTMLAnchorElement>(
            'a[data-testid="result-title-a"], a.result__a, article h2 a, h2 a'
          )
        );

        const fallbackNodes = Array.from(
          document.querySelectorAll<HTMLAnchorElement>("a[href]")
        );

        const nodes = candidateNodes.length > 0 ? candidateNodes : fallbackNodes;

        const links = nodes
          .map((node) => ({
            title: (node.textContent ?? "").trim(),
            url: node.href,
          }))
          .filter((item) => item.url && item.url.startsWith("http"));

        return {
          links,
          pageTextSample: (document.body?.innerText ?? "")
            .replace(/\s+/g, " ")
            .slice(0, 600),
        };
      });

      lastPageTextSample = capture.pageTextSample;

      const unique = new Map<string, SearchResult>();

      for (const item of capture.links) {
        const unwrappedUrl = unwrapSearchRedirect(item.url);
        const safe = sanitizeUrl(unwrappedUrl);
        if (!safe || unique.has(safe)) {
          continue;
        }

        unique.set(safe, {
          title: item.title || "Untitled",
          url: safe,
        });

        if (unique.size >= limit) {
          break;
        }
      }

      if (unique.size > 0) {
        return {
          results: [...unique.values()],
          pageTextSample: lastPageTextSample,
        };
      }
    } catch {
      continue;
    }
  }

  return {
    results: [],
    pageTextSample: lastPageTextSample,
  };
}

function guessEmptyResultReason(pageTextSample: string): string {
  const lower = pageTextSample.toLowerCase();

  if (/(captcha|verify you are human|cloudflare|access denied|unusual traffic)/.test(lower)) {
    return "Search engine blocked automation (captcha/challenge).";
  }

  if (/(javascript|enable js|enable javascript)/.test(lower)) {
    return "Search page requires JavaScript mode not returned in headless response.";
  }

  return "Search returned zero links for query. Try brand + exact model + variant.";
}

export async function discoverProductUrls(
  productName: string,
  country: string
): Promise<DiscoveryResult> {
  const executablePath = resolveBrowserExecutablePath();
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    );
    await page.setViewport({ width: 1366, height: 900 });

    const generalQuery = `${productName} price ${country}`;
    const generalCapture = await collectSearchResults(page, generalQuery, 40);
    const generalResults = generalCapture.results;

    const candidateDomains = new Map<string, string>();
    for (const result of generalResults) {
      const domain = normalizeDomain(result.url);
      if (!domain || SEARCH_ENGINE_BLOCKLIST.has(domain)) {
        continue;
      }
      if (!candidateDomains.has(domain)) {
        candidateDomains.set(domain, result.url);
      }
      if (candidateDomains.size >= 10) {
        break;
      }
    }

    const productPages: DiscoveredProductUrl[] = [];

    for (const domain of candidateDomains.keys()) {
      const siteQuery = `site:${domain} ${productName}`;
      const siteCapture = await collectSearchResults(page, siteQuery, 20);
      const siteResults = siteCapture.results;

      for (const item of siteResults) {
        const normalizedDomain = normalizeDomain(item.url);
        if (!normalizedDomain || normalizedDomain !== domain) {
          continue;
        }

        if (!looksLikeProductPage(item.url, item.title, productName)) {
          continue;
        }

        productPages.push({
          domain,
          title: item.title,
          url: item.url,
        });

        if (productPages.length >= 20) {
          break;
        }
      }

      if (productPages.length >= 20) {
        break;
      }
    }

    const uniqueByUrl = new Map<string, DiscoveredProductUrl>();
    for (const pageResult of productPages) {
      if (!uniqueByUrl.has(pageResult.url)) {
        uniqueByUrl.set(pageResult.url, pageResult);
      }
    }

    const discoveryTargets = [...uniqueByUrl.values()];

    let status: "ok" | "warning" = "ok";
    let message = "Discovery completed.";

    if (generalResults.length === 0) {
      status = "warning";
      message = guessEmptyResultReason(generalCapture.pageTextSample);
    } else if (candidateDomains.size === 0) {
      status = "warning";
      message = "Search produced links, but no valid external domains detected.";
    } else if (discoveryTargets.length === 0) {
      status = "warning";
      message =
        "Domains found, but no direct product pages matched filters. Use more specific model keywords.";
    }

    return {
      targets: discoveryTargets,
      diagnostics: {
        status,
        message,
        general_query: generalQuery,
        general_results: generalResults.length,
        candidate_domains: candidateDomains.size,
        product_pages: discoveryTargets.length,
        browser_path: executablePath,
      },
    };
  } finally {
    await browser.close();
  }
}

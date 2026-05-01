import type {
  PriceAnalysis,
  PriceSource,
  PriceSummary,
} from "@/types/price-monitor";
import { fallbackAnalysis } from "@/lib/price-monitor/utils";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const NEMOTRON_MODEL = "nvidia/nemotron-3-super-120b-a12b:free";

export type AnalysisGenerationResult = {
  analysis: PriceAnalysis;
  usedFallback: boolean;
  message: string;
  model: string;
};

type LlmPriceAnalysis = {
  best_deal?: string;
  market_insight?: string;
  risk_flags?: string[];
  recommendation?: string;
};

function extractJsonObject(text: string): LlmPriceAnalysis | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() ?? text.trim();

  const direct = candidate.match(/\{[\s\S]*\}/);
  if (!direct) {
    return null;
  }

  try {
    return JSON.parse(direct[0]) as LlmPriceAnalysis;
  } catch {
    return null;
  }
}

function normalizeAnalysis(
  productName: string,
  parsed: LlmPriceAnalysis | null,
  fallback: ReturnType<typeof fallbackAnalysis>
): PriceAnalysis {
  const bestDeal = parsed?.best_deal?.trim() || fallback.bestDeal;
  const marketInsight = parsed?.market_insight?.trim() || fallback.marketInsight;
  const recommendation =
    parsed?.recommendation?.trim() || fallback.recommendation;
  const riskFlags =
    parsed?.risk_flags?.filter((item): item is string => Boolean(item)) ??
    fallback.riskFlags;

  return {
    best_deal: bestDeal || `No actionable deal found for ${productName}`,
    market_insight: marketInsight,
    recommendation,
    risk_flags: riskFlags,
  };
}

export async function generatePriceAnalysis(input: {
  productName: string;
  sources: PriceSource[];
  summary: PriceSummary;
  validationFlags: string[];
  country: string;
}): Promise<AnalysisGenerationResult> {
  const fallback = fallbackAnalysis(
    input.productName,
    input.sources,
    input.validationFlags
  );

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      analysis: normalizeAnalysis(input.productName, null, fallback),
      usedFallback: true,
      message: "OPENROUTER_API_KEY missing. Using heuristic fallback analysis.",
      model: NEMOTRON_MODEL,
    };
  }

  const requestPayload = {
    model: NEMOTRON_MODEL,
    temperature: 0.15,
    max_tokens: 500,
    messages: [
      {
        role: "system",
        content:
          "You are a market pricing analyst. Return ONLY valid JSON with keys: best_deal, market_insight, risk_flags (array), recommendation. Keep risk_flags concise.",
      },
      {
        role: "user",
        content: JSON.stringify(
          {
            product: input.productName,
            country: input.country,
            summary: input.summary,
            sources: input.sources,
            validationFlags: input.validationFlags,
            instructions: [
              "Identify the best deal.",
              "Explain why prices vary in realistic terms.",
              "Call out suspicious listings or missing info.",
              "Recommend where a seller should position their price for better profit.",
              "If confidence is low, mention that estimates were used.",
            ],
          },
          null,
          2
        ),
      },
    ],
  };

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXTAUTH_URL ?? "http://localhost:3000",
        "X-Title": "Optizive Price Monitor",
      },
      body: JSON.stringify(requestPayload),
    });

    if (!response.ok) {
      return {
        analysis: normalizeAnalysis(input.productName, null, fallback),
        usedFallback: true,
        message: `OpenRouter request failed (${response.status}). Using fallback analysis.`,
        model: NEMOTRON_MODEL,
      };
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return {
        analysis: normalizeAnalysis(input.productName, null, fallback),
        usedFallback: true,
        message: "OpenRouter returned empty content. Using fallback analysis.",
        model: NEMOTRON_MODEL,
      };
    }

    const parsed = extractJsonObject(content);
    if (!parsed) {
      return {
        analysis: normalizeAnalysis(input.productName, null, fallback),
        usedFallback: true,
        message: "LLM output invalid JSON. Using fallback analysis.",
        model: NEMOTRON_MODEL,
      };
    }

    return {
      analysis: normalizeAnalysis(input.productName, parsed, fallback),
      usedFallback: false,
      message: "OpenRouter analysis completed.",
      model: NEMOTRON_MODEL,
    };
  } catch {
    return {
      analysis: normalizeAnalysis(input.productName, null, fallback),
      usedFallback: true,
      message: "OpenRouter call crashed. Using fallback analysis.",
      model: NEMOTRON_MODEL,
    };
  }
}

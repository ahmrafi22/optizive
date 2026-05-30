"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import type { Category, StockUnit, BuyingPriority } from "@/prisma/generated/prisma/client";

const MAX_SEED_ITEMS = 3;
const DEFAULT_PRODUCT_LIMIT = 10;
const RECOMMENDATION_LIMIT = 10;
const AI_CANDIDATE_LIMIT = 20;

export interface SmartBasketProductSummary {
  id: string;
  name: string;
  category: Category | null;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: StockUnit;
  imageLink: string | null;
  isActive: boolean;
  expiryDate: string | null;
  margin: number;
}

export interface SmartBasketListItem {
  id: string;
  publicId: string;
  title: string;
  description: string | null;
  isPublic: boolean;
  baseTotal: number;
  customTotal: number | null;
  createdAt: string;
  items: Array<Pick<SmartBasketProductSummary, "id" | "name" | "category" | "sellingPrice" | "imageLink">>;
}

export interface PublicSmartBasketListItem extends SmartBasketListItem {
  ownerName: string;
  ownerBusinessName: string | null;
}

export interface SmartBasketSuggestionItem {
  id: string;
  name: string;
  category: Category | null;
  sellingPrice: number;
  imageLink: string | null;
  unit: StockUnit;
  quantity: number;
  reason: string;
  source: "RULE" | "AI";
  score: number;
  matchPercent: number;
}

export interface SmartBasketSuggestionsResponse {
  rule: SmartBasketSuggestionItem[];
  ai: SmartBasketSuggestionItem[];
}

export interface CreateSmartBasketPayload {
  title: string;
  description?: string | null;
  productIds: string[];
  isPublic: boolean;
  customTotal?: number | null;
  saveAsBundle?: boolean;
}

export interface ProductSearchResponse {
  items: SmartBasketProductSummary[];
  totalCount: number;
}

function buildSearchWhere(search: string) {
  if (!search) return undefined;
  return {
    OR: [
      { name: { contains: search, mode: "insensitive" as const } },
      { description: { contains: search, mode: "insensitive" as const } },
      { sku: { contains: search, mode: "insensitive" as const } },
      { barcode: { contains: search, mode: "insensitive" as const } },
    ],
  };
}

function toProductSummary(product: {
  id: string;
  name: string;
  category: Category | null;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  unit: StockUnit;
  imageLink: string | null;
  isActive: boolean;
  expiryDate: Date | null;
}): SmartBasketProductSummary {
  const marginRaw = product.sellingPrice - product.costPrice;
  const margin = Number.isFinite(marginRaw) ? Number(marginRaw.toFixed(2)) : 0;

  return {
    id: product.id,
    name: product.name,
    category: product.category ?? null,
    sellingPrice: product.sellingPrice,
    costPrice: product.costPrice,
    quantity: product.quantity,
    unit: product.unit,
    imageLink: product.imageLink ?? null,
    isActive: product.isActive,
    expiryDate: product.expiryDate ? product.expiryDate.toISOString() : null,
    margin,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function normalizeMargin(product: SmartBasketProductSummary) {
  if (product.sellingPrice <= 0) return 0;
  return clamp((product.sellingPrice - product.costPrice) / product.sellingPrice, 0, 1);
}

function normalizeStock(product: SmartBasketProductSummary) {
  if (product.quantity <= 0) return 0;
  return clamp(product.quantity / 20, 0, 1);
}

function getPricePreferenceScore(priority: BuyingPriority | null | undefined, product: SmartBasketProductSummary, maxPrice: number) {
  if (!priority || maxPrice <= 0) return 0;
  const priceNorm = clamp(product.sellingPrice / maxPrice, 0, 1);

  switch (priority) {
    case "CHEAP":
      return (1 - priceNorm) * 0.9;
    case "QUALITY":
      return priceNorm * 0.6;
    case "CONSISTENCY":
    case "RELIABILITY":
      return normalizeStock(product) * 0.5;
    case "FAST":
      return normalizeStock(product) * 0.4;
    default:
      return 0;
  }
}

function getCategoryPromptHint(category: Category | null) {
  if (!category) return "Focus on complementary use and value.";
  const hints: Partial<Record<Category, string>> = {
    GROCERIES: "Focus on pantry staples used together.",
    FMCG: "Focus on repeat-buy add-ons and value packs.",
    FRESH_PRODUCE: "Focus on meal pairings and freshness.",
    AGRO_PRODUCTS: "Focus on seasonal pairings and restock value.",
    FISHERY_SEAFOOD: "Focus on sides, sauces, and freshness.",
    MEAT_POULTRY: "Focus on seasonings, sides, and storage.",
    DAIRY: "Focus on breakfast pairings and staples.",
    ELECTRONICS: "Focus on compatible accessories and protection.",
    MOBILE_ACCESSORIES: "Focus on protection, charging, and add-ons.",
    CLOTHING: "Focus on matching essentials and care items.",
    TEXTILES_APPAREL: "Focus on complementary fabrics and basics.",
    FOOTWEAR: "Focus on care, accessories, and pairings.",
    BEAUTY_PERSONAL_CARE: "Focus on routine bundles and refills.",
    HOME_APPLIANCE: "Focus on add-ons, filters, and essentials.",
    FURNITURE: "Focus on matching accessories and care.",
    HARDWARE: "Focus on supporting tools and consumables.",
    CONSTRUCTION_MATERIALS: "Focus on supporting materials and tools.",
    AUTO_PARTS: "Focus on compatibility and maintenance kits.",
    PHARMACY: "Avoid medical claims; focus on care bundles.",
    STATIONERY: "Focus on office pairings and refills.",
    OFFICE_SUPPLIES: "Focus on restock essentials and bundles.",
    PACKAGING: "Focus on sizes, tape, and labels.",
    CHEMICALS: "Focus on compatible safety and handling items.",
    PLASTICS: "Focus on compatible sizes and use cases.",
    RESTAURANT_SUPPLY: "Focus on prep add-ons and refills.",
    HOSPITALITY_SUPPLY: "Focus on amenities and refills.",
  };
  return hints[category] ?? "Focus on complementary use and value.";
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as any;
  } catch {
    const repaired = repairTruncatedJson(text);
    if (repaired) {
      try {
        return JSON.parse(repaired) as any;
      } catch {
        return null;
      }
    }
    return null;
  }
}

function repairTruncatedJson(text: string): string | null {
  const braceStart = text.indexOf("{");
  const bracketStart = text.indexOf("[");
  let start = -1;
  if (braceStart !== -1 && bracketStart !== -1) {
    start = Math.min(braceStart, bracketStart);
  } else {
    start = Math.max(braceStart, bracketStart);
  }
  if (start === -1) return null;

  let slice = text.slice(start);
  const stack: Array<"{" | "["> = [];
  let inString = false;
  let escaping = false;
  for (const ch of slice) {
    if (inString) {
      if (escaping) { escaping = false; continue; }
      if (ch === "\\") { escaping = true; continue; }
      if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === "{") stack.push("{");
    if (ch === "[") stack.push("[");
    if (ch === "}") {
      if (stack[stack.length - 1] === "{") stack.pop();
    }
    if (ch === "]") {
      if (stack[stack.length - 1] === "[") stack.pop();
    }
  }
  if (inString) slice += '"';
  while (stack.length > 0) {
    const last = stack.pop();
    slice += last === "{" ? "}" : "]";
  }
  slice = slice.replace(/,(\s*[}\]])/g, "$1");
  return slice;
}

function extractOpenRouterContent(message: any): string {
  if (!message) return "";
  const content = message.content;
  if (!content) return "";
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        if (typeof part?.text?.value === "string") return part.text.value;
        if (typeof part?.content === "string") return part.content;
        return "";
      })
      .join("")
      .trim();
  }
  if (typeof content === "object") {
    return JSON.stringify(content);
  }
  return "";
}

function extractJsonObject(text: string): string | null {
  if (!text) return null;
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (ch === "\\") {
        escaping = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{") {
      depth += 1;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractJsonArray(text: string): string | null {
  if (!text) return null;
  const start = text.indexOf("[");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaping = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaping) {
        escaping = false;
        continue;
      }
      if (ch === "\\") {
        escaping = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "[") {
      depth += 1;
    }

    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function extractJsonSnippet(text: string): string | null {
  if (!text) return null;

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const object = extractJsonObject(text);
  if (object) return object;

  const array = extractJsonArray(text);
  if (array) return array;

  const braceIndex = text.indexOf("{");
  const bracketIndex = text.indexOf("[");
  let start = -1;
  if (braceIndex !== -1 && bracketIndex !== -1) {
    start = Math.min(braceIndex, bracketIndex);
  } else {
    start = Math.max(braceIndex, bracketIndex);
  }

  return start === -1 ? null : text.slice(start);
}

function coercePickList(parsed: any): Array<{ id?: string; reason?: string; matchScore?: number }> | null {
  if (!parsed) return null;
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.picks)) return parsed.picks;
  if (Array.isArray(parsed?.data?.picks)) return parsed.data.picks;
  return null;
}

async function rankWithOpenRouter(
  selected: SmartBasketProductSummary[],
  candidates: SmartBasketSuggestionItem[],
): Promise<SmartBasketSuggestionItem[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const categoryHint = getCategoryPromptHint(selected[0]?.category ?? null);

  const prompt = {
    focus: categoryHint,
    selected: selected.map((item) => ({
      name: item.name,
      category: item.category ?? "OTHER",
      price: Math.round(item.sellingPrice),
    })),
    candidates: candidates.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category ?? "OTHER",
      price: Math.round(item.sellingPrice),
      matchPercent: item.matchPercent,
    })),
    outputSchema: {
      picks: [{ id: "", reason: "", matchScore: 0 }],
    },
    instructions: [
      "Return JSON only using outputSchema.",
      "Pick up to 10 candidates.",
      "matchScore must be 0-100.",
      "reason must be <= 8 words.",
      "No extra keys, no markdown.",
    ],
  };

  console.log("[SmartBasket AI] Request", JSON.stringify({ model, prompt }));

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      max_tokens: 2000,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a retail basket pairing assistant. Return a JSON object only. No reasoning, no markdown.",
        },
        {
          role: "user",
          content: JSON.stringify(prompt),
        },
      ],
    }),
  });

  if (!response.ok) {
    console.warn("[SmartBasket AI] Error", await response.text());
    return [];
  }

  const data = (await response.json()) as any;
  console.log("[SmartBasket AI] Raw", JSON.stringify(data));

  if (data?.error) {
    console.warn("[SmartBasket AI] Error payload", JSON.stringify(data.error));
    return [];
  }

  if (data?.choices?.[0]?.finish_reason === "length") {
    console.warn("[SmartBasket AI] Truncated response");
  }

  const message = data?.choices?.[0]?.message ?? data?.choices?.[0]?.delta ?? null;
  const content = extractOpenRouterContent(message);
  console.log("[SmartBasket AI] Response", content);

  const fallbackText = typeof message?.reasoning === "string" ? message.reasoning : "";

  if (!content) {
    if (!fallbackText) {
      console.warn("[SmartBasket AI] Empty content", JSON.stringify(data?.choices?.[0] ?? data));
      return [];
    }
  }
  const extractedJson = extractJsonSnippet(content) ?? content;
  console.log("[SmartBasket AI] JSON", extractedJson);

  const parsed = safeJsonParse(extractedJson);
  let picks = coercePickList(parsed);

  if (!picks && fallbackText) {
    const fallbackJson = extractJsonSnippet(fallbackText) ?? fallbackText;
    const fallbackParsed = safeJsonParse(fallbackJson);
    picks = coercePickList(fallbackParsed);
  }

  if (!picks) return [];

  const byId = new Map(candidates.map((item) => [item.id, item]));
  const aiResults: SmartBasketSuggestionItem[] = [];

  picks.forEach((pick: { id?: string; reason?: string; matchScore?: number }) => {
    if (!pick?.id) return;
    const match = byId.get(pick.id);
    if (!match) return;
    const rawScore = typeof pick.matchScore === "number" ? pick.matchScore : Number(pick.matchScore);
    const aiScore = Number.isFinite(rawScore) ? clamp(Math.round(rawScore), 0, 100) : null;
    aiResults.push({
      ...match,
      reason: typeof pick.reason === "string" && pick.reason.trim() ? pick.reason.trim() : match.reason,
      source: "AI",
      matchPercent: aiScore ?? match.matchPercent,
    });
  });

  return aiResults.slice(0, RECOMMENDATION_LIMIT);
}

export async function listRecentProducts(limit: number = DEFAULT_PRODUCT_LIMIT): Promise<SmartBasketProductSummary[] | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const items = await prisma.product.findMany({
    where: { ownerId: userId, isActive: true },
    orderBy: { updatedAt: "desc" },
    take: Math.min(limit, 20),
  });

  return items.map(toProductSummary);
}

export async function searchProducts(
  search: string,
  category?: Category | "ALL",
  limit: number = DEFAULT_PRODUCT_LIMIT,
  offset: number = 0,
): Promise<ProductSearchResponse | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const trimmed = search.trim();
  const where: any = {
    ownerId: userId,
    isActive: true,
    ...(trimmed ? buildSearchWhere(trimmed) : {}),
    ...(category && category !== "ALL" ? { category } : {}),
  };

  const [items, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      take: Math.min(limit, 50),
      skip: Math.max(offset, 0),
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items: items.map(toProductSummary),
    totalCount,
  };
}

export async function getProductById(productId: string): Promise<SmartBasketProductSummary | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const product = await prisma.product.findFirst({
    where: { id: productId, ownerId: userId, isActive: true },
  });

  if (!product) return null;
  return toProductSummary(product);
}

export async function listSmartBaskets(): Promise<SmartBasketListItem[] | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const baskets = await prisma.smartBasket.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: true },
        orderBy: { position: "asc" },
      },
    },
    take: 20,
  });

  return baskets.map((basket) => ({
    id: basket.id,
    publicId: basket.publicId,
    title: basket.title,
    description: basket.description ?? null,
    isPublic: basket.isPublic,
    baseTotal: basket.baseTotal,
    customTotal: basket.customTotal ?? null,
    createdAt: basket.createdAt.toISOString(),
    items: basket.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      category: item.product.category ?? null,
      sellingPrice: item.product.sellingPrice,
      imageLink: item.product.imageLink ?? null,
    })),
  }));
}

export async function listPublicSmartBaskets(): Promise<PublicSmartBasketListItem[] | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const baskets = await prisma.smartBasket.findMany({
    where: { isPublic: true, ownerId: { not: userId } },
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      items: {
        include: { product: true },
        orderBy: { position: "asc" },
      },
    },
    take: 20,
  });

  return baskets.map((basket) => ({
    id: basket.id,
    publicId: basket.publicId,
    title: basket.title,
    description: basket.description ?? null,
    isPublic: basket.isPublic,
    baseTotal: basket.baseTotal,
    customTotal: basket.customTotal ?? null,
    createdAt: basket.createdAt.toISOString(),
    ownerName: basket.owner.name,
    ownerBusinessName: basket.owner.businessName ?? null,
    items: basket.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      category: item.product.category ?? null,
      sellingPrice: item.product.sellingPrice,
      imageLink: item.product.imageLink ?? null,
    })),
  }));
}

export async function getSmartBasket(basketId: string): Promise<SmartBasketListItem | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const basket = await prisma.smartBasket.findFirst({
    where: { id: basketId, ownerId: userId },
    include: {
      items: {
        include: { product: true },
        orderBy: { position: "asc" },
      },
    },
  });

  if (!basket) return null;

  return {
    id: basket.id,
    publicId: basket.publicId,
    title: basket.title,
    description: basket.description ?? null,
    isPublic: basket.isPublic,
    baseTotal: basket.baseTotal,
    customTotal: basket.customTotal ?? null,
    createdAt: basket.createdAt.toISOString(),
    items: basket.items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      category: item.product.category ?? null,
      sellingPrice: item.product.sellingPrice,
      imageLink: item.product.imageLink ?? null,
    })),
  };
}

export async function createSmartBasket(payload: CreateSmartBasketPayload) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, message: "Unauthorized" };

  const title = payload.title?.trim();
  if (!title) return { ok: false, message: "Basket title is required" };

  const uniqueProductIds = Array.from(new Set(payload.productIds || [])).slice(0, MAX_SEED_ITEMS);
  if (uniqueProductIds.length === 0) return { ok: false, message: "Select at least one product" };

  const products = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, ownerId: userId },
  });

  if (products.length !== uniqueProductIds.length) {
    return { ok: false, message: "One or more products are missing" };
  }

  const baseTotal = products.reduce((sum, item) => sum + item.sellingPrice, 0);
  const primaryCategory = products.find((item) => item.category)?.category ?? null;
  const customTotal =
    typeof payload.customTotal === "number" && Number.isFinite(payload.customTotal) && payload.customTotal > 0
      ? payload.customTotal
      : null;

  const created = await prisma.$transaction(async (tx) => {
    let bundleId: string | null = null;

    if (payload.saveAsBundle) {
      const bundle = await tx.bundle.create({
        data: {
          ownerId: userId,
          name: title,
          description: payload.description?.trim() || null,
          discount: 0,
          isActive: true,
          items: {
            create: uniqueProductIds.map((productId) => ({
              productId,
              quantity: 1,
            })),
          },
        },
      });
      bundleId = bundle.id;
    }

    return tx.smartBasket.create({
      data: {
        ownerId: userId,
        title,
        description: payload.description?.trim() || null,
        isPublic: payload.isPublic,
        baseTotal,
        customTotal,
        sourceCategory: primaryCategory,
        bundleId,
        items: {
          create: uniqueProductIds.map((productId, index) => ({
            productId,
            quantity: 1,
            position: index,
            role: "SEED",
          })),
        },
      },
    });
  });

  return { ok: true, id: created.id };
}

const DATASET_WEIGHT = 0.4;
const USER_WEIGHT = 0.6;
const MIN_USER_SALES_FOR_BLEND = 5;

async function getScoredCandidates(productIds: string[]) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const uniqueProductIds = Array.from(new Set(productIds)).slice(0, MAX_SEED_ITEMS);
  if (uniqueProductIds.length === 0) return null;

  const selectedProducts = await prisma.product.findMany({
    where: { id: { in: uniqueProductIds }, ownerId: userId },
  });

  if (selectedProducts.length === 0) return null;

  const selectedSummaries = selectedProducts.map(toProductSummary);
  const selectedCategories = new Set(selectedSummaries.map((item) => item.category).filter(Boolean));

  const saleItems = await prisma.saleItem.findMany({
    where: { productId: { in: uniqueProductIds } },
    select: { saleId: true },
  });
  const saleIds = Array.from(new Set(saleItems.map((item) => item.saleId)));

  const userCoPurchaseCounts = new Map<string, number>();
  const hasEnoughSales = saleIds.length >= MIN_USER_SALES_FOR_BLEND;

  if (hasEnoughSales) {
    const grouped = await prisma.saleItem.groupBy({
      by: ["productId"],
      where: {
        saleId: { in: saleIds },
        productId: { notIn: uniqueProductIds },
      },
      _count: { productId: true },
      orderBy: { _count: { productId: "desc" } },
      take: 40,
    });

    grouped.forEach((row) => {
      userCoPurchaseCounts.set(row.productId, row._count.productId);
    });
  }

  const datasetEdges = await prisma.coPurchaseEdge.findMany({
    where: { productAId: { in: uniqueProductIds } },
    orderBy: { score: "desc" },
    take: 40,
  });

  const datasetCoPurchaseCounts = new Map<string, number>();
  datasetEdges.forEach((edge) => {
    const current = datasetCoPurchaseCounts.get(edge.productBId) ?? 0;
    datasetCoPurchaseCounts.set(edge.productBId, current + edge.frequency);
  });

  const bundleLinks = await prisma.bundleItem.findMany({
    where: { productId: { in: uniqueProductIds } },
    select: { bundleId: true },
  });
  const bundleIds = Array.from(new Set(bundleLinks.map((item) => item.bundleId)));

  const bundleCounts = new Map<string, number>();
  if (bundleIds.length > 0) {
    const bundleItems = await prisma.bundleItem.findMany({
      where: {
        bundleId: { in: bundleIds },
        productId: { notIn: uniqueProductIds },
      },
      select: { productId: true },
    });

    bundleItems.forEach((item) => {
      bundleCounts.set(item.productId, (bundleCounts.get(item.productId) ?? 0) + 1);
    });
  }

  const allCandidateIds = new Set<string>([
    ...userCoPurchaseCounts.keys(),
    ...datasetCoPurchaseCounts.keys(),
    ...bundleCounts.keys(),
  ]);

  const candidateIds = new Set<string>();

  if (hasEnoughSales) {
    for (const id of allCandidateIds) {
      const userScore = userCoPurchaseCounts.get(id) ?? 0;
      const datasetScore = datasetCoPurchaseCounts.get(id) ?? 0;
      const blendedScore = userScore * USER_WEIGHT + datasetScore * DATASET_WEIGHT;
      if (blendedScore > 0) {
        candidateIds.add(id);
      }
    }
  } else {
    for (const id of allCandidateIds) {
      const datasetScore = datasetCoPurchaseCounts.get(id) ?? 0;
      if (datasetScore > 0) {
        candidateIds.add(id);
      }
    }
  }

  if (candidateIds.size < 12 && selectedCategories.size > 0) {
    const affinities = await prisma.categoryAffinity.findMany({
      where: { categoryA: { in: Array.from(selectedCategories) as Category[] } },
      orderBy: { affinityScore: "desc" },
      take: 5,
    });

    const relatedCategories = affinities.map((a) => a.categoryB);

    const fallback = await prisma.product.findMany({
      where: {
        ownerId: userId,
        category: { in: relatedCategories.length > 0 ? relatedCategories : Array.from(selectedCategories) as Category[] },
        id: { notIn: uniqueProductIds },
        isActive: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });
    fallback.forEach((item) => candidateIds.add(item.id));
  }

  if (candidateIds.size === 0) return null;

  const now = new Date();
  const candidates = await prisma.product.findMany({
    where: {
      ownerId: userId,
      id: { in: Array.from(candidateIds) },
      isActive: true,
      quantity: { gt: 0 },
      OR: [{ expiryDate: null }, { expiryDate: { gt: now } }],
    },
  });

  if (candidates.length === 0) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { buyingPriority: true },
  });

  const summaries = candidates.map(toProductSummary);
  const maxPrice = summaries.reduce((max, item) => Math.max(max, item.sellingPrice), 0);

  const scoredBase = summaries.map((item) => {
    const userCoPurchase = userCoPurchaseCounts.get(item.id) ?? 0;
    const datasetCoPurchase = datasetCoPurchaseCounts.get(item.id) ?? 0;
    const coPurchase = hasEnoughSales
      ? userCoPurchase * USER_WEIGHT + datasetCoPurchase * DATASET_WEIGHT
      : datasetCoPurchase;
    const bundleCount = bundleCounts.get(item.id) ?? 0;
    const sameCategory = item.category && selectedCategories.has(item.category) ? 1 : 0;
    const expiryPenalty = item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
      ? -0.6
      : 0;

    const score =
      coPurchase * 3 +
      bundleCount * 2 +
      sameCategory * 1.2 +
      normalizeMargin(item) * 1.1 +
      normalizeStock(item) * 0.7 +
      getPricePreferenceScore(user?.buyingPriority, item, maxPrice) +
      expiryPenalty;

    const reasons: string[] = [];
    if (coPurchase > 0) reasons.push("Frequently bought together");
    if (bundleCount > 0) reasons.push("Strong bundle match");
    if (sameCategory) reasons.push("Same category fit");
    if (normalizeMargin(item) > 0.25) reasons.push("Great margin value");

    return {
      id: item.id,
      name: item.name,
      category: item.category ?? null,
      sellingPrice: item.sellingPrice,
      imageLink: item.imageLink ?? null,
      unit: item.unit,
      quantity: item.quantity,
      reason: reasons.slice(0, 2).join(" ") || "High match score",
      source: "RULE" as const,
      score,
      matchPercent: 0,
    };
  });

  const maxScore = scoredBase.reduce((max, item) => Math.max(max, item.score), 0);
  const scored = scoredBase.map((item) => ({
    ...item,
    matchPercent: maxScore > 0 ? Math.round(clamp(item.score / maxScore, 0, 1) * 100) : 0,
  }));

  return { scored, selectedSummaries };
}

export async function getSmartBasketRuleRecommendations(productIds: string[]): Promise<SmartBasketSuggestionItem[]> {
  const result = await getScoredCandidates(productIds);
  if (!result) return [];
  const { scored } = result;
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, RECOMMENDATION_LIMIT);
}

export async function getSmartBasketAiRecommendations(productIds: string[]): Promise<SmartBasketSuggestionItem[]> {
  const result = await getScoredCandidates(productIds);
  if (!result) return [];
  const { scored, selectedSummaries } = result;
  const aiCandidates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_CANDIDATE_LIMIT);
  return rankWithOpenRouter(selectedSummaries, aiCandidates);
}

export async function getSmartBasketRecommendations(productIds: string[]): Promise<SmartBasketSuggestionsResponse | null> {
  const result = await getScoredCandidates(productIds);
  if (!result) return { rule: [], ai: [] };
  const { scored, selectedSummaries } = result;
  const rule = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, RECOMMENDATION_LIMIT);
  const aiCandidates = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_CANDIDATE_LIMIT);
  const ai = await rankWithOpenRouter(selectedSummaries, aiCandidates);
  return { rule, ai };
}

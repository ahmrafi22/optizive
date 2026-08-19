import { getDemoStore } from "./demo-store";
import { DEMO_USER_ID } from "@/lib/demo-constants";
import type {
  SmartBasketProductSummary,
  SmartBasketListItem,
  PublicSmartBasketListItem,
  SmartBasketDetail,
  SmartBasketSuggestionItem,
  SmartBasketSuggestionsResponse,
  CreateSmartBasketPayload,
  ProductSearchResponse,
} from "@/backend/smart-basket/smart-basket";

const MAX_SEED_ITEMS = 3;
const DEFAULT_PRODUCT_LIMIT = 10;
const RECOMMENDATION_LIMIT = 10;
const AI_CANDIDATE_LIMIT = 20;

function toProductSummary(product: any): SmartBasketProductSummary {
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

function basketToListItem(basket: any): SmartBasketListItem {
  const store = getDemoStore();
  return {
    id: basket.id,
    publicId: `pub-${basket.id}`,
    title: basket.name,
    description: basket.description ?? null,
    isPublic: basket.status === "PUBLIC",
    baseTotal: basket.totalCost,
    customTotal: null,
    createdAt: basket.createdAt.toISOString(),
    items: (basket.items ?? []).map((it: any) => {
      const p = store.products.find((x) => x.id === it.productId);
      return {
        id: p?.id ?? it.productId,
        name: p?.name ?? "Unknown product",
        category: p?.category ?? null,
        sellingPrice: p?.sellingPrice ?? it.unitPrice,
        imageLink: p?.imageLink ?? null,
      };
    }),
  };
}

function basketToPublicListItem(basket: any): PublicSmartBasketListItem {
  const store = getDemoStore();
  const owner = store.users.find((u) => u.id === basket.ownerId);
  return {
    ...basketToListItem(basket),
    ownerName: owner?.name ?? "Unknown",
    ownerBusinessName: owner?.businessName ?? null,
  };
}

function basketToDetail(basket: any): SmartBasketDetail {
  const store = getDemoStore();
  const owner = store.users.find((u) => u.id === basket.ownerId);
  const sourceCategory =
    basket.suggestedBy && "category" in basket.suggestedBy
      ? (basket.suggestedBy.category as any)
      : (basket.sourceCategory ?? null);
  return {
    id: basket.id,
    publicId: `pub-${basket.id}`,
    title: basket.name,
    description: basket.description ?? null,
    isPublic: basket.status === "PUBLIC",
    baseTotal: basket.totalCost,
    customTotal: null,
    sourceCategory,
    createdAt: basket.createdAt.toISOString(),
    updatedAt: basket.updatedAt.toISOString(),
    ownerId: owner?.id ?? "",
    ownerName: owner?.name ?? "Unknown",
    ownerBusinessName: owner?.businessName ?? null,
    items: (basket.items ?? []).map((it: any) => {
      const p = store.products.find((x) => x.id === it.productId);
      return {
        id: it.id,
        productId: it.productId,
        name: p?.name ?? "Unknown product",
        category: p?.category ?? null,
        sellingPrice: p?.sellingPrice ?? it.unitPrice,
        imageLink: p?.imageLink ?? null,
        quantity: it.quantity,
        unit: p?.unit ?? "UNIT",
        role: it.role ?? "SEED",
        reason: it.reason ?? null,
      };
    }),
  };
}

export function demoListRecentProducts(limit: number = DEFAULT_PRODUCT_LIMIT): SmartBasketProductSummary[] | null {
  return getDemoStore()
    .products.filter((p) => p.ownerId === DEMO_USER_ID && p.isActive)
    .slice()
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, Math.min(limit, 20))
    .map(toProductSummary);
}

export function demoSearchProducts(
  search: string,
  category?: string | "ALL",
  limit: number = DEFAULT_PRODUCT_LIMIT,
  offset: number = 0,
): ProductSearchResponse | null {
  const q = search.trim().toLowerCase();
  let products = getDemoStore().products.filter(
    (p) => p.ownerId === DEMO_USER_ID && p.isActive,
  );
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.sku ?? "").toLowerCase().includes(q) ||
        (p.barcode ?? "").toLowerCase().includes(q),
    );
  }
  if (category && category !== "ALL") {
    products = products.filter((p) => p.category === category);
  }
  products.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  const totalCount = products.length;
  return {
    items: products.slice(Math.max(offset, 0), Math.max(offset, 0) + Math.min(limit, 50)).map(toProductSummary),
    totalCount,
  };
}

export function demoGetProductById(productId: string): SmartBasketProductSummary | null {
  const p = getDemoStore().products.find(
    (x) => x.id === productId && x.ownerId === DEMO_USER_ID && x.isActive,
  );
  return p ? toProductSummary(p) : null;
}

export function demoListSmartBaskets(): SmartBasketListItem[] | null {
  return getDemoStore()
    .baskets.filter((b) => b.ownerId === DEMO_USER_ID)
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
    .map(basketToListItem);
}

export function demoListPublicSmartBaskets(): PublicSmartBasketListItem[] | null {
  return getDemoStore()
    .baskets.filter((b) => b.ownerId !== DEMO_USER_ID && b.status === "PUBLIC")
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 20)
    .map(basketToPublicListItem);
}

export function demoGetSmartBasket(basketId: string): SmartBasketListItem | null {
  const basket = getDemoStore().baskets.find(
    (b) => b.id === basketId && b.ownerId === DEMO_USER_ID,
  );
  return basket ? basketToListItem(basket) : null;
}

export function demoGetSmartBasketDetail(basketId: string): SmartBasketDetail | null {
  const store = getDemoStore();
  const basket = store.baskets.find(
    (b) => b.id === basketId && (b.ownerId === DEMO_USER_ID || b.status === "PUBLIC"),
  );
  return basket ? basketToDetail(basket) : null;
}

export function demoCreateSmartBasket(payload: CreateSmartBasketPayload) {
  const store = getDemoStore();
  const title = payload.title?.trim();
  if (!title) return { ok: false, message: "Basket title is required" };

  const uniqueProductIds = Array.from(new Set(payload.productIds || [])).slice(0, MAX_SEED_ITEMS);
  if (uniqueProductIds.length === 0) return { ok: false, message: "Select at least one product" };

  const products = store.products.filter(
    (p) => uniqueProductIds.includes(p.id) && p.ownerId === DEMO_USER_ID,
  );
  if (products.length !== uniqueProductIds.length) {
    return { ok: false, message: "One or more products are missing" };
  }

  const baseTotal = products.reduce((sum, item) => sum + item.sellingPrice, 0);
  const primaryCategory = products.find((item) => item.category)?.category ?? null;
  const customTotal =
    typeof payload.customTotal === "number" && Number.isFinite(payload.customTotal) && payload.customTotal > 0
      ? payload.customTotal
      : null;

  const now = new Date();
  const basket = {
    id: `demo-basket-${store.baskets.length + 1}`,
    createdAt: now,
    updatedAt: now,
    ownerId: DEMO_USER_ID,
    name: title,
    description: payload.description?.trim() || null,
    status: payload.isPublic ? ("PUBLIC" as const) : ("ACTIVE" as const),
    totalCost: customTotal ?? baseTotal,
    sourceCategory: primaryCategory,
    items: uniqueProductIds.map((productId, index) => ({
      id: `demo-basket-item-${store.baskets.length + 1}-${index + 1}`,
      productId,
      quantity: 1,
      unitPrice: store.products.find((p) => p.id === productId)?.sellingPrice ?? 0,
      subtotal: store.products.find((p) => p.id === productId)?.sellingPrice ?? 0,
      isChecked: false,
      role: "SEED",
      reason: null,
    })),
    lastPurchasedAt: null,
    recommendedOn: null,
    suggestedBy: null,
  };
  store.baskets.push(basket);
  return { ok: true, id: basket.id };
}

function getScoredCandidates(productIds: string[]) {
  const store = getDemoStore();
  const uniqueProductIds = Array.from(new Set(productIds)).slice(0, MAX_SEED_ITEMS);
  if (uniqueProductIds.length === 0) return null;

  const selectedProducts = store.products.filter(
    (p) => uniqueProductIds.includes(p.id) && p.ownerId === DEMO_USER_ID,
  );
  if (selectedProducts.length === 0) return null;

  const selectedSummaries = selectedProducts.map(toProductSummary);
  const selectedCategories = new Set(
    selectedSummaries.map((item) => item.category).filter(Boolean) as string[],
  );

  const saleIds = new Set<string>();
  store.saleItems.forEach((si) => {
    if (uniqueProductIds.includes(si.productId)) saleIds.add(si.saleId);
  });

  const userCoPurchaseCounts = new Map<string, number>();
  const hasEnoughSales = saleIds.size >= 5;
  if (hasEnoughSales) {
    store.saleItems.forEach((si) => {
      if (!saleIds.has(si.saleId) || uniqueProductIds.includes(si.productId)) return;
      userCoPurchaseCounts.set(si.productId, (userCoPurchaseCounts.get(si.productId) ?? 0) + 1);
    });
  }

  const allCandidateIds = new Set<string>(userCoPurchaseCounts.keys());

  const candidateIds = new Set<string>();
  if (hasEnoughSales) {
    for (const id of allCandidateIds) {
      if ((userCoPurchaseCounts.get(id) ?? 0) > 0) candidateIds.add(id);
    }
  }

  if (candidateIds.size < 12 && selectedCategories.size > 0) {
    store.products.forEach((p) => {
      if (
        p.ownerId === DEMO_USER_ID &&
        p.isActive &&
        !uniqueProductIds.includes(p.id) &&
        p.category &&
        selectedCategories.has(p.category)
      ) {
        candidateIds.add(p.id);
      }
    });
  }

  if (candidateIds.size === 0) return null;

  const now = new Date();
  const candidates = store.products.filter(
    (p) =>
      p.ownerId === DEMO_USER_ID &&
      candidateIds.has(p.id) &&
      p.isActive &&
      p.quantity > 0 &&
      (!p.expiryDate || p.expiryDate > now),
  );
  if (candidates.length === 0) return null;

  const user = store.users.find((u) => u.id === DEMO_USER_ID);
  const summaries = candidates.map(toProductSummary);
  const maxPrice = summaries.reduce((max, item) => Math.max(max, item.sellingPrice), 0);

  const scoredBase = summaries.map((item) => {
    const userCoPurchase = userCoPurchaseCounts.get(item.id) ?? 0;
    const coPurchase = hasEnoughSales ? userCoPurchase : 0;
    const sameCategory = item.category && selectedCategories.has(item.category) ? 1 : 0;
    const expiryPenalty =
      item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
        ? -0.6
        : 0;

    const priceNorm = maxPrice > 0 ? clamp(item.sellingPrice / maxPrice, 0, 1) : 0;
    const priceScore =
      user?.buyingPriority === "CHEAP"
        ? (1 - priceNorm) * 0.9
        : user?.buyingPriority === "QUALITY"
          ? priceNorm * 0.6
          : 0;

    const score =
      coPurchase * 3 +
      sameCategory * 1.2 +
      normalizeMargin(item) * 1.1 +
      normalizeStock(item) * 0.7 +
      priceScore +
      expiryPenalty;

    const reasons: string[] = [];
    if (coPurchase > 0) reasons.push("Frequently bought together");
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

export function demoGetSmartBasketRuleRecommendations(productIds: string[]): SmartBasketSuggestionItem[] {
  const result = getScoredCandidates(productIds);
  if (!result) return [];
  return result.scored
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, RECOMMENDATION_LIMIT) as SmartBasketSuggestionItem[];
}

export function demoGetSmartBasketAiRecommendations(productIds: string[]): SmartBasketSuggestionItem[] {
  const result = getScoredCandidates(productIds);
  if (!result) return [];
  return result.scored
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, AI_CANDIDATE_LIMIT)
    .map((item: any) => ({ ...item, source: "AI" as const })) as SmartBasketSuggestionItem[];
}

export function demoGetSmartBasketRecommendations(productIds: string[]): SmartBasketSuggestionsResponse | null {
  const result = getScoredCandidates(productIds);
  if (!result) return { rule: [], ai: [] };
  const rule = result.scored
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, RECOMMENDATION_LIMIT) as SmartBasketSuggestionItem[];
  const ai = result.scored
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, AI_CANDIDATE_LIMIT)
    .map((item: any) => ({ ...item, source: "AI" as const })) as SmartBasketSuggestionItem[];
  return { rule, ai };
}
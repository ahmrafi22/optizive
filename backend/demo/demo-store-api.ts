import { getDemoStore } from "./demo-store";
import { DEMO_BUSINESS_SLUG } from "@/lib/demo-constants";
import type { AuthStore } from "@/backend/store/api-auth";

export function demoVerifyStoreApiKey(
  businessSlug: string,
  branchSlug: string,
  apiKey: string | null,
): { store: AuthStore | null; error: string | null } {
  if (!apiKey) return { store: null, error: "Missing x-api-key header" };

  const store = getDemoStore();
  const user = store.users.find((u) => u.businessSlug === businessSlug);
  if (!user) return { store: null, error: "Business not found" };

  const branch = store.stores.find((s) => s.ownerId === user.id && s.slug === branchSlug);
  if (!branch) return { store: null, error: "Branch not found" };
  if (!branch.isActive) return { store: null, error: "Branch is not active" };
  if (branch.apiKey !== apiKey) return { store: null, error: "Invalid API key" };

  return {
    store: {
      id: branch.id,
      ownerId: user.id,
      name: branch.name,
      slug: branch.slug,
      businessSlug,
    },
    error: null,
  };
}

export function demoResolveStore(
  businessSlug: string,
  branchSlug: string,
): { ownerId: string; storeId: string; isActive: boolean } | null {
  const store = getDemoStore();
  const user = store.users.find((u) => u.businessSlug === businessSlug);
  if (!user) return null;
  const branch = store.stores.find((s) => s.ownerId === user.id && s.slug === branchSlug);
  if (!branch) return null;
  return { ownerId: user.id, storeId: branch.id, isActive: branch.isActive };
}

export function demoLogApiHit(
  storeId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  ip: string | null,
): void {
  const store = getDemoStore();
  store.apiLogs.push({
    id: `demo-api-log-${store.apiLogs.length + 1}`,
    createdAt: new Date(),
    storeId,
    endpoint,
    method,
    statusCode,
    ip,
  });
}

export function demoPriceCompareSave(input: {
  productName: string;
  category?: string | null;
  info?: string | null;
  city?: string | null;
  country?: string;
  data: unknown;
}): { id: string; createdAt: Date } {
  const store = getDemoStore();
  const id = `demo-price-${store.priceCompare.length + 1}`;
  store.priceCompare.unshift({
    id,
    createdAt: new Date(),
    userId: "demo-user",
    productName: input.productName,
    category: input.category ?? null,
    info: input.info ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    data: input.data as any,
  });
  return { id, createdAt: store.priceCompare[0].createdAt };
}

export function demoPriceCompareList() {
  return getDemoStore()
    .priceCompare.filter((p) => p.userId === "demo-user")
    .slice()
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((p) => ({
      id: p.id,
      productName: p.productName,
      category: p.category,
      country: p.country,
      createdAt: p.createdAt,
    }));
}

export function demoPriceCompareGet(id: string) {
  const p = getDemoStore().priceCompare.find(
    (x) => x.id === id && x.userId === "demo-user",
  );
  return p ?? null;
}
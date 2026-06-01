import prisma from "@/lib/prisma";

export interface AuthStore {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  businessSlug: string;
}

export async function verifyStoreApiKey(
  businessSlug: string,
  branchSlug: string,
  apiKey: string | null
): Promise<{ store: AuthStore | null; error: string | null }> {
  if (!apiKey) {
    return { store: null, error: "Missing x-api-key header" };
  }

  const user = await prisma.user.findUnique({
    where: { businessSlug },
    select: { id: true },
  });

  if (!user) {
    return { store: null, error: "Business not found" };
  }

  const store = await prisma.store.findFirst({
    where: { ownerId: user.id, slug: branchSlug },
    select: { id: true, ownerId: true, name: true, slug: true, apiKey: true, isActive: true },
  });

  if (!store) {
    return { store: null, error: "Branch not found" };
  }

  if (!store.isActive) {
    return { store: null, error: "Branch is not active" };
  }

  if (store.apiKey !== apiKey) {
    return { store: null, error: "Invalid API key" };
  }

  return {
    store: { id: store.id, ownerId: store.ownerId, name: store.name, slug: store.slug, businessSlug },
    error: null,
  };
}

export async function resolveStore(
  businessSlug: string,
  branchSlug: string
): Promise<{ ownerId: string; storeId: string; isActive: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { businessSlug },
    select: { id: true },
  });
  if (!user) return null;

  const store = await prisma.store.findFirst({
    where: { ownerId: user.id, slug: branchSlug },
    select: { id: true, isActive: true },
  });
  if (!store) return null;

  return { ownerId: user.id, storeId: store.id, isActive: store.isActive };
}

export async function logApiHit(
  storeId: string,
  endpoint: string,
  method: string,
  statusCode: number,
  ip: string | null
) {
  await prisma.apiLog.create({
    data: { storeId, endpoint, method, statusCode, ip },
  });
}

export function jsonOk(data: any, status = 200): Response {
  return new Response(JSON.stringify({ success: true, data }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(error: string, status = 400): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

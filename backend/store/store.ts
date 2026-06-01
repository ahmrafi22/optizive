"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

function generateApiKey(): string {
  return `sk_${crypto.randomBytes(24).toString("hex")}`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

export interface StoreInfo {
  id: string;
  name: string;
  slug: string;
  apiKey: string;
  isActive: boolean;
  termsAccepted: boolean;
  createdAt: string;
}

export interface ApiHit {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  createdAt: string;
}

export interface StoreStats {
  totalStores: number;
  activeStores: number;
  totalApiHits: number;
  errorHits: number;
  recentHits: ApiHit[];
  stores: StoreInfo[];
  businessSlug: string | null;
}

export async function getUserStores(): Promise<StoreStats | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [stores, user] = await Promise.all([
    prisma.store.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        apiLogs: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    }),
    prisma.user.findUnique({ where: { id: userId }, select: { businessSlug: true } }),
  ]);

  const [totalApiHits, errorHits] = await Promise.all([
    prisma.apiLog.count({ where: { store: { ownerId: userId } } }),
    prisma.apiLog.count({ where: { store: { ownerId: userId }, statusCode: { gte: 400 } } }),
  ]);

  return {
    totalStores: stores.length,
    activeStores: stores.filter((s) => s.isActive).length,
    totalApiHits,
    errorHits,
    businessSlug: user?.businessSlug || null,
    recentHits: stores.flatMap((s) =>
      s.apiLogs.map((l) => ({
        id: l.id,
        endpoint: l.endpoint,
        method: l.method,
        statusCode: l.statusCode,
        createdAt: l.createdAt.toISOString(),
      }))
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10),
    stores: stores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      apiKey: s.apiKey,
      isActive: s.isActive,
      termsAccepted: s.termsAccepted,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}

async function setBusinessSlug(userId: string, name: string): Promise<string> {
  let slug = slugify(name);
  if (!slug) slug = "my-business";
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({ where: { businessSlug: slug } });
    if (!existing || existing.id === userId) break;
    slug = `${slugify(name)}-${crypto.randomBytes(2).toString("hex")}`;
    attempts++;
  }
  await prisma.user.update({ where: { id: userId }, data: { businessSlug: slug } });
  return slug;
}

export async function ensureMainStore(): Promise<StoreStats | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [user, storeCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { businessSlug: true, businessName: true, name: true } }),
    prisma.store.count({ where: { ownerId: userId } }),
  ]);

  if (!user?.businessSlug) {
    const fallback = user?.businessName || user?.name || "my-business";
    await setBusinessSlug(userId, fallback);
  }

  if (storeCount === 0) {
    const name = user?.businessName || user?.name || "My Store";
    let slug = slugify(name);
    if (!slug) slug = "my-store";
    const existing = await prisma.store.findFirst({ where: { ownerId: userId, slug } });
    if (existing) slug = `${slug}-main`;
    let apiKey = generateApiKey();
    let keyExists = await prisma.store.findUnique({ where: { apiKey } });
    while (keyExists) { apiKey = generateApiKey(); keyExists = await prisma.store.findUnique({ where: { apiKey } }); }
    await prisma.store.create({ data: { ownerId: userId, name, slug, apiKey } });
  }

  return getUserStores();
}

export async function createStore(name: string): Promise<{ success: boolean; error?: string; store?: StoreInfo }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  if (!name || name.trim().length < 2) {
    return { success: false, error: "Branch name must be at least 2 characters" };
  }

  let slug = slugify(name);
  if (!slug) return { success: false, error: "Invalid branch name" };

  const existing = await prisma.store.findFirst({ where: { ownerId: userId, slug } });
  if (existing) {
    slug = `${slug}-${crypto.randomBytes(2).toString("hex")}`;
  }

  let apiKey = generateApiKey();
  let keyExists = await prisma.store.findUnique({ where: { apiKey } });
  while (keyExists) {
    apiKey = generateApiKey();
    keyExists = await prisma.store.findUnique({ where: { apiKey } });
  }

  const store = await prisma.store.create({
    data: {
      ownerId: userId,
      name: name.trim(),
      slug,
      apiKey,
    },
  });

  return {
    success: true,
    store: {
      id: store.id,
      name: store.name,
      slug: store.slug,
      apiKey: store.apiKey,
      isActive: store.isActive,
      termsAccepted: store.termsAccepted,
      createdAt: store.createdAt.toISOString(),
    },
  };
}

export async function updateBusinessSlug(newSlug: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const slug = slugify(newSlug);
  if (!slug || slug.length < 2) return { success: false, error: "Slug must be at least 2 characters" };

  const existing = await prisma.user.findUnique({ where: { businessSlug: slug } });
  if (existing && existing.id !== userId) {
    return { success: false, error: "This business slug is already taken" };
  }

  await prisma.user.update({ where: { id: userId }, data: { businessSlug: slug } });
  return { success: true };
}

export async function acceptTerms(storeId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) return { success: false, error: "Store not found" };

  await prisma.store.update({
    where: { id: storeId },
    data: { termsAccepted: true, isActive: true },
  });

  return { success: true };
}

export async function toggleStoreStatus(storeId: string, isActive: boolean): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) return { success: false, error: "Store not found" };

  if (isActive && !store.termsAccepted) {
    return { success: false, error: "Terms must be accepted first" };
  }

  await prisma.store.update({ where: { id: storeId }, data: { isActive } });
  return { success: true };
}

export async function regenerateApiKey(storeId: string): Promise<{ success: boolean; error?: string; apiKey?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) return { success: false, error: "Store not found" };

  let apiKey = generateApiKey();
  let keyExists = await prisma.store.findUnique({ where: { apiKey } });
  while (keyExists) {
    apiKey = generateApiKey();
    keyExists = await prisma.store.findUnique({ where: { apiKey } });
  }

  await prisma.store.update({ where: { id: storeId }, data: { apiKey } });
  return { success: true, apiKey };
}

export async function deleteStore(storeId: string): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  const store = await prisma.store.findFirst({ where: { id: storeId, ownerId: userId } });
  if (!store) return { success: false, error: "Store not found" };

  await prisma.store.delete({ where: { id: storeId } });
  return { success: true };
}

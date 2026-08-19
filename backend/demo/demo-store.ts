import { readFileSync } from "fs";
import { join } from "path";
import { DEMO_USER_ID } from "@/lib/demo-constants";

// ---------------------------------------------------------------------------
// Relative date tokens: "T-3d", "T+7d", "T-5h", "T-3d-5h"
// ---------------------------------------------------------------------------

const TOKEN_RE = /^T([+-]?\d+)d([+-]?\d+)h$|^T([+-]?\d+)d$|^T([+-]?\d+)h$/;

function resolveToken(value: string): Date | null {
  const m = TOKEN_RE.exec(value);
  if (!m) return null;
  const days = m[1] ? parseInt(m[1], 10) : m[3] ? parseInt(m[3], 10) : 0;
  const hours = m[2] ? parseInt(m[2], 10) : m[4] ? parseInt(m[4], 10) : 0;
  return new Date(Date.now() + days * 86400000 + hours * 3600000);
}

function materializeDates(node: unknown): unknown {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = materializeDates(node[i]);
    return node;
  }
  if (node && typeof node === "object") {
    for (const key of Object.keys(node as Record<string, unknown>)) {
      (node as Record<string, unknown>)[key] = materializeDates(
        (node as Record<string, unknown>)[key],
      );
    }
    return node;
  }
  if (typeof node === "string") {
    const resolved = resolveToken(node);
    return resolved ?? node;
  }
  return node;
}

// ---------------------------------------------------------------------------
// Demo data store (in-memory, seeded from data/demo/*.json)
// ---------------------------------------------------------------------------

export interface DemoData {
  users: any[];
  products: any[];
  sales: any[];
  saleItems: any[];
  chats: any[];
  baskets: any[];
  procurement: any[];
  posts: any[];
  tags: any[];
  ratings: any[];
  stores: any[];
  apiLogs: any[];
  priceCompare: any[];
}

let state: DemoData | null = null;

function loadFile(name: string): any[] {
  const path = join(process.cwd(), "data", "demo", name);
  const raw = readFileSync(path, "utf-8");
  return materializeDates(JSON.parse(raw)) as any[];
}

export function getDemoStore(): DemoData {
  if (state) return state;
  state = {
    users: loadFile("users.json"),
    products: loadFile("products.json"),
    sales: loadFile("sales.json"),
    saleItems: loadFile("sale-items.json"),
    chats: loadFile("chats.json"),
    baskets: loadFile("smart-baskets.json"),
    procurement: loadFile("procurement.json"),
    posts: loadFile("posts.json"),
    tags: loadFile("tags.json"),
    ratings: loadFile("ratings.json"),
    stores: loadFile("stores.json"),
    apiLogs: loadFile("api-logs.json"),
    priceCompare: loadFile("price-compare.json"),
  };
  return state;
}

export function isDemoUserId(userId: string | null | undefined): boolean {
  return !!userId && userId === DEMO_USER_ID;
}

export function demoUser(): any {
  return getDemoStore().users.find((u) => u.id === DEMO_USER_ID) ?? null;
}

export function demoProductById(id: string): any {
  return getDemoStore().products.find((p) => p.id === id) ?? null;
}

export function demoUserById(id: string): any {
  return getDemoStore().users.find((u) => u.id === id) ?? null;
}

export function demoStoreIdForOwner(ownerId: string): string {
  return getDemoStore().stores.find((s) => s.ownerId === ownerId && s.isActive)?.id
    ?? getDemoStore().stores.find((s) => s.ownerId === ownerId)?.id
    ?? "demo-store-1";
}

export function nextId(prefix: string, seq: { n: number }): string {
  seq.n += 1;
  return `${prefix}${String(seq.n).padStart(4, "0")}`;
}

export function isDemoBusinessSlug(slug: string): boolean {
  return getDemoStore().users.some(
    (u) => u.businessSlug === slug || u.id === slug,
  );
}
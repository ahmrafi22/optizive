"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export interface AdminStats {
  totalUsers: number;
  totalOnboarded: number;
  totalBanned: number;
  totalSuppliers: number;
  totalStoreOwners: number;
  totalRevenue: number;
  totalSales: number;
  totalProducts: number;
  lowStockProducts: number;
  activeUsers: number;
}

export interface AdminDashboardUser {
  id: string;
  name: string;
  email: string | null;
  businessName: string | null;
  role: string;
  isVerified: boolean;
  banned: boolean;
  avgRating: number;
  totalTransactions: number;
  createdAt: string;
}

export interface AdminRecentSale {
  id: string;
  invoiceNumber: string;
  owner: { name: string; businessName: string | null } | null;
  finalAmount: number;
  createdAt: string;
  itemCount: number;
}

export async function checkAdminAuth() {
  const session = await auth();
  if (!session?.user) redirect("/services/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  });
  if (!user || user.role !== "ADMIN" || user.banned) redirect("/services/login");
  return session;
}

export async function getAdminDashboardData() {
  await checkAdminAuth();

  const [userStats] = await prisma.$queryRaw<Array<{
    totalUsers: number; totalOnboarded: number; totalBanned: number;
    totalSuppliers: number; totalStoreOwners: number; activeUsers: number;
  }>>`
    SELECT
      COUNT(*)::int as "totalUsers",
      COUNT(*) FILTER (WHERE onboarded = true)::int as "totalOnboarded",
      COUNT(*) FILTER (WHERE banned = true)::int as "totalBanned",
      COUNT(*) FILTER (WHERE role = 'SUPPLIER' OR role = 'BOTH')::int as "totalSuppliers",
      COUNT(*) FILTER (WHERE role = 'STORE_OWNER' OR role = 'BOTH')::int as "totalStoreOwners",
      COUNT(*) FILTER (WHERE "lastActiveAt" >= NOW() - INTERVAL '7 days')::int as "activeUsers"
    FROM "User"
  `;

  const [salesStats] = await prisma.$queryRaw<Array<{
    totalRevenue: number; totalSales: number;
  }>>`
    SELECT
      COALESCE(SUM("finalAmount"), 0) as "totalRevenue",
      COUNT(*)::int as "totalSales"
    FROM "Sale"
  `;

  const [productStats] = await prisma.$queryRaw<Array<{
    totalProducts: number; lowStockProducts: number;
  }>>`
    SELECT
      COUNT(*)::int as "totalProducts",
      COUNT(*) FILTER (WHERE "isActive" = true AND "minStock" IS NOT NULL AND "quantity" > 0 AND "quantity" <= "minStock")::int as "lowStockProducts"
    FROM "Product"
  `;

  return {
    stats: {
      totalUsers: Number(userStats?.totalUsers || 0),
      totalOnboarded: Number(userStats?.totalOnboarded || 0),
      totalBanned: Number(userStats?.totalBanned || 0),
      totalSuppliers: Number(userStats?.totalSuppliers || 0),
      totalStoreOwners: Number(userStats?.totalStoreOwners || 0),
      activeUsers: Number(userStats?.activeUsers || 0),
      totalRevenue: Number(salesStats?.totalRevenue || 0),
      totalSales: Number(salesStats?.totalSales || 0),
      totalProducts: Number(productStats?.totalProducts || 0),
      lowStockProducts: Number(productStats?.lowStockProducts || 0),
    } satisfies AdminStats,
  };
}

export async function getAdminUsers() {
  await checkAdminAuth();
  const users = await prisma.user.findMany({
    where: { role: { not: "ADMIN" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      businessName: true,
      role: true,
      isVerified: true,
      banned: true,
      avgRating: true,
      totalTransactions: true,
      createdAt: true,
    },
  });
  return users.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
  })) satisfies AdminDashboardUser[];
}

export async function getAdminRecentSales() {
  await checkAdminAuth();
  const sales = await prisma.sale.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: {
      owner: { select: { name: true, businessName: true } },
      items: { select: { id: true } },
    },
  });
  return sales.map((s) => ({
    id: s.id,
    invoiceNumber: s.invoiceNumber,
    owner: s.owner,
    finalAmount: s.finalAmount,
    createdAt: s.createdAt.toISOString(),
    itemCount: s.items.length,
  })) satisfies AdminRecentSale[];
}

export async function toggleUserBan(userId: string, ban: boolean) {
  await checkAdminAuth();
  await prisma.user.update({
    where: { id: userId },
    data: { banned: ban },
  });
  return { success: true, banned: ban };
}

export async function toggleUserVerification(userId: string, verified: boolean) {
  await checkAdminAuth();
  await prisma.user.update({
    where: { id: userId },
    data: { isVerified: verified },
  });
  return { success: true, isVerified: verified };
}

export async function getAdminUserDetail(userId: string) {
  await checkAdminAuth();
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, phone: true, username: true,
      businessName: true, businessSlug: true, role: true, businessType: true,
      businessSize: true, district: true, area: true, primaryCategory: true,
      subCategories: true, isVerified: true, banned: true, onboarded: true,
      avgRating: true, totalTransactions: true, yearsInBusiness: true,
      isActive: true, lastActiveAt: true, createdAt: true,
    },
  });
  if (!user) return null;
  return {
    ...user,
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}

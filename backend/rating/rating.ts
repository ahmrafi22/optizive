"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import type {
  UserRole, BusinessType, BusinessSize, Category,
  PricingType, DeliveryTime, DistancePreference,
  NegotiationPreference, BuyingPriority, ServiceArea,
  DeliveryMethod, SupplierTag,
} from "@/prisma/generated/prisma/client";

export interface PublicProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  profileImage: string | null;
  businessName: string | null;
  role: UserRole;
  businessType: BusinessType | null;
  businessSize: BusinessSize | null;
  district: string | null;
  area: string | null;
  primaryCategory: Category | null;
  subCategories: string[];
  isVerified: boolean;
  yearsInBusiness: number | null;
  avgRating: number;
  totalTransactions: number;
  businessRegistrationId: string | null;
  paymentTerms: string | null;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  isActive: boolean;
  lastActiveAt: string | null;
  createdAt: string;
  monthlyPurchaseRange: string | null;
  pricingPreference: PricingType | null;
  negotiationPreference: NegotiationPreference | null;
  maxDeliveryTime: DeliveryTime | null;
  preferredDistance: DistancePreference | null;
  buyingPriority: BuyingPriority | null;
  restockFrequency: string | null;
  serviceArea: ServiceArea | null;
  serviceRadiusKm: number | null;
  deliveryMethod: DeliveryMethod | null;
  deliveryTimeRange: DeliveryTime | null;
  pricingType: PricingType | null;
  bulkDiscountAvailable: boolean | null;
  orderCapacity: BusinessSize | null;
  supplierTags: SupplierTag[];
  totalRatings: number;
  ratingBreakdown: Record<number, number>;
}

export interface RatingDetail {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  rater: {
    id: string;
    name: string;
    businessName: string | null;
    profileImage: string | null;
  };
}

export async function getPublicProfile(userId: string): Promise<PublicProfile | null> {
  const [user, ratings, salesCount, purchasesCount] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.rating.findMany({
      where: { rateeId: userId },
      select: { score: true },
    }),
    prisma.sale.count({ where: { ownerId: userId } }),
    prisma.sale.count({ where: { buyerId: userId } }),
  ]);
  if (!user) return null;

  const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    breakdown[r.score] = (breakdown[r.score] || 0) + 1;
  }

  const { password, updatedAt, ...rest } = user;
  return {
    ...rest,
    profileImage: user.profileImage,
    createdAt: user.createdAt.toISOString(),
    lastActiveAt: user.lastActiveAt?.toISOString() ?? null,
    totalRatings: ratings.length,
    ratingBreakdown: breakdown,
    totalTransactions: salesCount + purchasesCount,
  } as unknown as PublicProfile;
}

export async function getUserRatings(userId: string): Promise<RatingDetail[]> {
  const ratings = await prisma.rating.findMany({
    where: { rateeId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      rater: {
        select: { id: true, name: true, businessName: true, profileImage: true },
      },
    },
  });

  return ratings.map((r) => ({
    id: r.id,
    score: r.score,
    comment: r.comment,
    createdAt: r.createdAt.toISOString(),
    rater: {
      id: r.rater.id,
      name: r.rater.name,
      businessName: r.rater.businessName,
      profileImage: r.rater.profileImage,
    },
  }));
}

export async function submitRating(input: {
  rateeId: string;
  score: number;
  comment?: string;
}): Promise<{ ok: boolean; message?: string }> {
  const session = await auth();
  const raterId = session?.user?.id;
  if (!raterId) return { ok: false, message: "Unauthorized" };

  if (raterId === input.rateeId) return { ok: false, message: "Cannot rate yourself" };

  const score = Math.round(input.score);
  if (score < 1 || score > 5) return { ok: false, message: "Score must be 1-5" };

  const ratee = await prisma.user.findUnique({ where: { id: input.rateeId } });
  if (!ratee) return { ok: false, message: "User not found" };

  await prisma.rating.upsert({
    where: {
      raterId_rateeId: { raterId, rateeId: input.rateeId },
    },
    create: {
      raterId,
      rateeId: input.rateeId,
      score,
      comment: input.comment?.trim() || null,
    },
    update: {
      score,
      comment: input.comment?.trim() || null,
    },
  });

  const agg = await prisma.rating.aggregate({
    where: { rateeId: input.rateeId },
    _avg: { score: true },
    _count: { score: true },
  });

  await prisma.user.update({
    where: { id: input.rateeId },
    data: {
      avgRating: agg._avg.score ?? 0,
    },
  });

  return { ok: true };
}

export async function hasRatedUser(rateeId: string): Promise<boolean> {
  const session = await auth();
  const raterId = session?.user?.id;
  if (!raterId) return false;

  const rating = await prisma.rating.findUnique({
    where: { raterId_rateeId: { raterId, rateeId } },
    select: { id: true },
  });

  return !!rating;
}

export async function getMyRating(rateeId: string): Promise<{ score: number; comment: string | null } | null> {
  const session = await auth();
  const raterId = session?.user?.id;
  if (!raterId) return null;

  const rating = await prisma.rating.findUnique({
    where: { raterId_rateeId: { raterId, rateeId } },
    select: { score: true, comment: true },
  });

  return rating;
}

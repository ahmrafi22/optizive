"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/backend/auth/auth";
import {
  type BusinessSize,
  type BusinessType,
  type BuyingPriority,
  type Category,
  type DeliveryMethod,
  type DeliveryTime,
  type DistancePreference,
  type NegotiationPreference,
  type PricingType,
  type ServiceArea,
  type SupplierTag,
  type UserRole,
} from "@/prisma/generated/prisma/client";

type OnboardingPayload = {
  name: string;
  role: UserRole;
  phone?: string;
  businessName?: string;
  businessType?: BusinessType;
  businessSize?: BusinessSize;
  district?: string;
  area?: string;
  primaryCategory?: Category;
  subCategories?: string[];
  monthlyPurchaseRange?: string;
  pricingPreference?: PricingType;
  negotiationPreference?: NegotiationPreference;
  maxDeliveryTime?: DeliveryTime;
  preferredDistance?: DistancePreference;
  buyingPriority?: BuyingPriority;
  restockFrequency?: string;
  serviceArea?: ServiceArea;
  serviceRadiusKm?: number;
  deliveryMethod?: DeliveryMethod;
  deliveryTimeRange?: DeliveryTime;
  pricingType?: PricingType;
  bulkDiscountAvailable?: boolean;
  orderCapacity?: BusinessSize;
  supplierTags?: SupplierTag[];
};

export async function saveOnboarding(payload: OnboardingPayload) {
  const session = await auth();

  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const name = payload.name.trim();
  if (!name || payload.role === "NONE") {
    return { ok: false, message: "Name and role are required." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name,
      role: payload.role,
      phone: payload.phone?.trim() || null,
      businessName: payload.businessName?.trim() || null,
      businessType: payload.businessType ?? null,
      businessSize: payload.businessSize ?? null,
      district: payload.district?.trim() || null,
      area: payload.area?.trim() || null,
      primaryCategory: payload.primaryCategory ?? null,
      subCategories: payload.subCategories ?? [],
      monthlyPurchaseRange: payload.monthlyPurchaseRange?.trim() || null,
      pricingPreference: payload.pricingPreference ?? null,
      negotiationPreference: payload.negotiationPreference ?? null,
      maxDeliveryTime: payload.maxDeliveryTime ?? null,
      preferredDistance: payload.preferredDistance ?? null,
      buyingPriority: payload.buyingPriority ?? null,
      restockFrequency: payload.restockFrequency?.trim() || null,
      serviceArea: payload.serviceArea ?? null,
      serviceRadiusKm: payload.serviceRadiusKm ?? null,
      deliveryMethod: payload.deliveryMethod ?? null,
      deliveryTimeRange: payload.deliveryTimeRange ?? null,
      pricingType: payload.pricingType ?? null,
      bulkDiscountAvailable: payload.bulkDiscountAvailable ?? null,
      orderCapacity: payload.orderCapacity ?? null,
      supplierTags: payload.supplierTags ?? [],
      onboarded: true,
    },
  });

  return { ok: true };
}

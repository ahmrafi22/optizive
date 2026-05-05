"use server";

import { auth } from "@/backend/auth/auth";
import prisma from "@/lib/prisma";
import { uploadImage, deleteImageByUrl } from "@/lib/cloudinary";
import type { Prisma } from "@/prisma/generated/prisma/client";
import type {
  UserRole,
  BusinessType,
  BusinessSize,
  Category,
  PricingType,
  DeliveryTime,
  DistancePreference,
  NegotiationPreference,
  BuyingPriority,
  ServiceArea,
  DeliveryMethod,
  SupplierTag,
} from "@/prisma/generated/prisma/client";

export interface SerializedUser {
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
}

export type ProfileUpdatePayload = {
  name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
  businessName: string | null;
  businessType: string | null;
  businessSize: string | null;
  district: string | null;
  area: string | null;
  primaryCategory: string | null;
  subCategories: string[];
  yearsInBusiness: number | null;
  businessRegistrationId: string | null;
  paymentTerms: string | null;
  minOrderValue: number | null;
  maxOrderValue: number | null;
  monthlyPurchaseRange: string | null;
  pricingPreference: string | null;
  negotiationPreference: string | null;
  maxDeliveryTime: string | null;
  preferredDistance: string | null;
  buyingPriority: string | null;
  restockFrequency: string | null;
  serviceArea: string | null;
  serviceRadiusKm: number | null;
  deliveryMethod: string | null;
  deliveryTimeRange: string | null;
  pricingType: string | null;
  bulkDiscountAvailable: boolean | null;
  orderCapacity: string | null;
  supplierTags: string[];
};

function toNullableString(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toNullableEnum<T extends string>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? (trimmed as T) : null;
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function toNullableBoolean(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (value === true || value === false) return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

function toStringArray<T extends string = string>(value: unknown): T[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.filter((item): item is T => typeof item === "string");
}

export async function getProfile(): Promise<SerializedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (!dbUser) return null;

  const { updatedAt, password, ...rest } = dbUser;
  return {
    ...rest,
    profileImage: dbUser.profileImage ?? null,
    createdAt: dbUser.createdAt.toISOString(),
    lastActiveAt: dbUser.lastActiveAt?.toISOString() ?? null,
  };
}

export async function updateProfile(payload: ProfileUpdatePayload) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized" };
  }

  const name = toNullableString(payload.name);
  if (!name) {
    return { ok: false, message: "Name is required" };
  }

  const subCategories = toStringArray(payload.subCategories);
  const supplierTags = toStringArray<SupplierTag>(payload.supplierTags);

  const data: Prisma.UserUpdateInput = {
    name,
    phone: toNullableString(payload.phone),
    email: toNullableString(payload.email),
    username: toNullableString(payload.username),
    businessName: toNullableString(payload.businessName),
    businessType: toNullableEnum<BusinessType>(payload.businessType),
    businessSize: toNullableEnum<BusinessSize>(payload.businessSize),
    district: toNullableString(payload.district),
    area: toNullableString(payload.area),
    primaryCategory: toNullableEnum<Category>(payload.primaryCategory),
    subCategories: subCategories ? { set: subCategories } : undefined,
    yearsInBusiness: toNullableNumber(payload.yearsInBusiness),
    businessRegistrationId: toNullableString(payload.businessRegistrationId),
    paymentTerms: toNullableString(payload.paymentTerms),
    minOrderValue: toNullableNumber(payload.minOrderValue),
    maxOrderValue: toNullableNumber(payload.maxOrderValue),
    monthlyPurchaseRange: toNullableString(payload.monthlyPurchaseRange),
    pricingPreference: toNullableEnum<PricingType>(payload.pricingPreference),
    negotiationPreference: toNullableEnum<NegotiationPreference>(payload.negotiationPreference),
    maxDeliveryTime: toNullableEnum<DeliveryTime>(payload.maxDeliveryTime),
    preferredDistance: toNullableEnum<DistancePreference>(payload.preferredDistance),
    buyingPriority: toNullableEnum<BuyingPriority>(payload.buyingPriority),
    restockFrequency: toNullableString(payload.restockFrequency),
    serviceArea: toNullableEnum<ServiceArea>(payload.serviceArea),
    serviceRadiusKm: toNullableNumber(payload.serviceRadiusKm),
    deliveryMethod: toNullableEnum<DeliveryMethod>(payload.deliveryMethod),
    deliveryTimeRange: toNullableEnum<DeliveryTime>(payload.deliveryTimeRange),
    pricingType: toNullableEnum<PricingType>(payload.pricingType),
    bulkDiscountAvailable: toNullableBoolean(payload.bulkDiscountAvailable),
    orderCapacity: toNullableEnum<BusinessSize>(payload.orderCapacity),
    supplierTags: supplierTags ? { set: supplierTags } : undefined,
  };

  await prisma.user.update({
    where: { id: session.user.id },
    data,
  });

  return { ok: true };
}

export async function uploadProfileImage(base64Image: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      try {
        await deleteImageByUrl(user.profileImage);
      } catch {
        // ignore old image delete failure
      }
    }

    const url = await uploadImage(base64Image, "users/profile-images", {
      transformation: [{ width: 400, height: 400, crop: "fill" }],
    });

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: url },
    });

    return { ok: true, url };
  } catch (error) {
    console.error("Image upload failed", error);
    return { ok: false, message: "Unable to upload image" };
  }
}

export async function deleteProfileImage() {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, message: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { profileImage: true },
    });

    if (user?.profileImage) {
      try {
        await deleteImageByUrl(user.profileImage);
      } catch {
        // ignore delete failure
      }
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { profileImage: null },
    });

    return { ok: true };
  } catch (error) {
    console.error("Image delete failed", error);
    return { ok: false, message: "Unable to delete image" };
  }
}

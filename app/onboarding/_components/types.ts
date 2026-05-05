import type {
  BusinessSize,
  BusinessType,
  BuyingPriority,
  Category,
  DeliveryMethod,
  DeliveryTime,
  DistancePreference,
  NegotiationPreference,
  PricingType,
  ServiceArea,
  SupplierTag,
} from "@/prisma/generated/prisma/client";

export type UserRole = "STORE_OWNER" | "SUPPLIER" | "BOTH";
export type TabId = "personal" | "business" | "preferences";
export type SelectValue<T> = T | "";

export type FormState = {
  name: string;
  role: UserRole;
  phone: string;
  businessName: string;
  businessType: SelectValue<BusinessType>;
  businessSize: SelectValue<BusinessSize>;
  district: string;
  area: string;
  primaryCategory: SelectValue<Category>;
  subCategories: string[];
  monthlyPurchaseRange: string;
  pricingPreference: SelectValue<PricingType>;
  negotiationPreference: SelectValue<NegotiationPreference>;
  maxDeliveryTime: SelectValue<DeliveryTime>;
  preferredDistance: SelectValue<DistancePreference>;
  buyingPriority: SelectValue<BuyingPriority>;
  restockFrequency: string;
  serviceArea: SelectValue<ServiceArea>;
  serviceRadiusKm: string;
  deliveryMethod: SelectValue<DeliveryMethod>;
  deliveryTimeRange: SelectValue<DeliveryTime>;
  pricingType: SelectValue<PricingType>;
  bulkDiscountAvailable: string;
  orderCapacity: SelectValue<BusinessSize>;
  supplierTags: SupplierTag[];
};

export type RoleOption = {
  value: UserRole;
  title: string;
  blurb: string;
};

export type SelectOption = {
  value: string;
  label?: string;
  title?: string;
};

import { auth } from '@/backend/auth/auth';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import ProfileView from './_components/profile-view';
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
} from '@/prisma/generated/prisma/client';

interface SerializedUser {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  username: string | null;
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

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!dbUser) {
    redirect('/login');
  }

  // Strip sensitive fields and serialize dates for the client
  const { updatedAt, password, ...rest } = dbUser;

  const user: SerializedUser = {
    ...rest,
    createdAt: dbUser.createdAt.toISOString(),
    lastActiveAt: dbUser.lastActiveAt?.toISOString() ?? null,
  };

  return <ProfileView user={user} />;
}

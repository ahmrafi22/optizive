'use client';

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
import {
  ROLE_LABELS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_SIZE_LABELS,
  CATEGORY_LABELS,
  PRICING_TYPE_LABELS,
  DELIVERY_TIME_LABELS,
  DISTANCE_PREFERENCE_LABELS,
  SERVICE_AREA_LABELS,
  DELIVERY_METHOD_LABELS,
  BUYING_PRIORITY_LABELS,
  NEGOTIATION_PREFERENCE_LABELS,
  MONTHLY_PURCHASE_RANGE_LABELS,
  RESTOCK_FREQUENCY_LABELS,
  SUPPLIER_TAG_LABELS,
  ORDER_CAPACITY_LABELS,
} from './profile-helpers';
import {
  LuMapPin,
  LuPhone,
  LuMail,
  LuBuilding2,
  LuBriefcase,
  LuTrendingUp,
  LuPackage,
  LuClock,
  LuTruck,
  LuShield,
  LuBadgeCheck,
  LuTag,
  LuDollarSign,
  LuActivity,
  LuCalendar,
  LuUser,
  LuCreditCard,
  LuIdCard,
  LuStar,
  LuCheck,
} from 'react-icons/lu';

interface ProfileUser {
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

/* ── Sub-components ── */

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="w-20 h-20 rounded-2xl bg-[color:var(--clr-yellow)] flex items-center justify-center text-[color:var(--clr-charcoal)] text-2xl font-bold flex-shrink-0">
      {initials}
    </div>
  );
}

function Badge({
  children,
  color = 'yellow',
}: {
  children: React.ReactNode;
  color?: 'yellow' | 'teal' | 'green' | 'red' | 'blue';
}) {
  const map = {
    yellow:
      'bg-[rgba(255,244,79,0.15)] text-[#7a6d00] dark:text-[#fff44f] border-[rgba(255,244,79,0.3)]',
    teal:
      'bg-[rgba(78,205,196,0.15)] text-[#0f5c56] dark:text-[#4ecdc4] border-[rgba(78,205,196,0.3)]',
    green:
      'bg-[rgba(74,222,128,0.15)] text-[#16a34a] dark:text-[#4ade80] border-[rgba(74,222,128,0.3)]',
    red: 'bg-[rgba(248,113,113,0.15)] text-[#dc2626] dark:text-[#f87171] border-[rgba(248,113,113,0.3)]',
    blue:
      'bg-[rgba(96,165,250,0.15)] text-[#1d4ed8] dark:text-[#60a5fa] border-[rgba(96,165,250,0.3)]',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${map[color]}`}
    >
      {children}
    </span>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-[color:var(--clr-surface)] border border-[color:var(--clr-border)] text-[color:var(--clr-fg-muted)] hover:border-[color:var(--clr-border-hover)] transition-colors">
      {children}
    </span>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="w-4 h-4 mt-0.5 text-[color:var(--clr-fg-dim)] flex-shrink-0" />
      <div>
        <p className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest">
          {label}
        </p>
        <p className="text-sm font-medium text-[color:var(--clr-fg)] mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] p-6 ${className}`}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[color:var(--clr-yellow)]" />
        </div>
        <h3 className="text-sm font-bold text-[color:var(--clr-fg)] uppercase tracking-wider">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subValue,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] p-5 hover:border-[color:var(--clr-border-hover)] transition-colors">
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-lg bg-[rgba(255,244,79,0.12)] flex items-center justify-center">
          <Icon className="w-4 h-4 text-[color:var(--clr-yellow)]" />
        </div>
        <span className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-[color:var(--clr-fg)]">{value}</p>
      {subValue && <p className="text-xs text-[color:var(--clr-fg-dim)] mt-1">{subValue}</p>}
    </div>
  );
}

function SizeVisualizer({ size }: { size?: BusinessSize | null }) {
  const sizes: { key: BusinessSize; label: string }[] = [
    { key: 'SMALL', label: 'Small' },
    { key: 'MEDIUM', label: 'Medium' },
    { key: 'LARGE', label: 'Large' },
    { key: 'ENTERPRISE', label: 'Enterprise' },
  ];
  const activeIdx = size ? sizes.findIndex((s) => s.key === size) : -1;
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {sizes.map((s, i) => (
          <div
            key={s.key}
            className={`flex-1 h-2.5 rounded-full transition-all duration-500 ${
              i <= activeIdx
                ? 'bg-[color:var(--clr-teal)]'
                : 'bg-[color:var(--clr-border)]'
            } ${
              i === activeIdx
                ? 'ring-2 ring-[color:var(--clr-teal)] ring-offset-2 ring-offset-[color:var(--clr-surface2)]'
                : ''
            }`}
          />
        ))}
      </div>
      <div className="flex justify-between">
        {sizes.map((s, i) => (
          <span
            key={s.key}
            className={`text-[10px] font-semibold uppercase tracking-wider transition-colors ${
              i === activeIdx ? 'text-[color:var(--clr-teal)]' : 'text-[color:var(--clr-fg-dim)]'
            }`}
          >
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function RatingDisplay({ rating, total }: { rating: number; total: number }) {
  const pct = Math.min((rating / 5) * 100, 100);
  return (
    <div className="flex items-center gap-4">
      <div className="text-3xl font-bold text-[color:var(--clr-fg)] tabular-nums">
        {rating.toFixed(1)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="h-2 rounded-full bg-[color:var(--clr-border)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color:var(--clr-yellow)] to-[color:var(--clr-teal)] transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-[color:var(--clr-fg-dim)] mt-1">
          {total.toLocaleString()} rated transactions
        </p>
      </div>
    </div>
  );
}

/* ── Main component ── */

export default function ProfileView({ user }: { user: ProfileUser }) {
  const isBuyer = user.role === 'STORE_OWNER' || user.role === 'BOTH';
  const isSupplier = user.role === 'SUPPLIER' || user.role === 'BOTH';

  const roleLabel = ROLE_LABELS.get(user.role) ?? user.role;
  const businessTypeLabel = user.businessType
    ? (BUSINESS_TYPE_LABELS.get(user.businessType) ?? user.businessType)
    : null;
  const businessSizeLabel = user.businessSize
    ? (BUSINESS_SIZE_LABELS.get(user.businessSize) ?? user.businessSize)
    : null;
  const categoryLabel = user.primaryCategory
    ? (CATEGORY_LABELS.get(user.primaryCategory) ?? user.primaryCategory)
    : null;

  const memberSince = new Date(user.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ═══════ Header ═══════ */}
      <div className="rounded-2xl border border-[color:var(--clr-border)] bg-[color:var(--clr-surface2)] p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar name={user.name} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-[color:var(--clr-fg)]">{user.name}</h1>
              {user.isVerified && (
                <Badge color="green">
                  <LuBadgeCheck className="w-3.5 h-3.5" />
                  Verified
                </Badge>
              )}
              {user.isActive ? (
                <Badge color="green">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] dark:bg-[#4ade80] pulse-dot" />
                  Active
                </Badge>
              ) : (
                <Badge color="red">Inactive</Badge>
              )}
            </div>

            {user.businessName && (
              <p className="text-[color:var(--clr-fg-muted)] font-medium mb-3">
                {user.businessName}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <Badge color="yellow">{roleLabel}</Badge>
              {businessTypeLabel && <Badge color="teal">{businessTypeLabel}</Badge>}
              {categoryLabel && <Badge color="blue">{categoryLabel}</Badge>}
            </div>
          </div>

          {/* Rating block */}
          <div className="md:w-64 shrink-0 mt-4 md:mt-0">
            <RatingDisplay rating={user.avgRating} total={user.totalTransactions} />
          </div>
        </div>

        {/* Business scale */}
        {user.businessSize && (
          <div className="mt-6 pt-6 border-t border-[color:var(--clr-border)]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest">
                Business Scale
              </span>
              <span className="text-xs font-bold text-[color:var(--clr-teal)]">
                {businessSizeLabel}
              </span>
            </div>
            <SizeVisualizer size={user.businessSize} />
          </div>
        )}
      </div>

      {/* ═══════ Stats ═══════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={LuTrendingUp}
          label="Transactions"
          value={user.totalTransactions.toLocaleString()}
        />
        <StatCard icon={LuStar} label="Avg. Rating" value={user.avgRating.toFixed(1)} subValue="out of 5.0" />
        <StatCard
          icon={LuCalendar}
          label="Years in Business"
          value={user.yearsInBusiness?.toString() ?? '—'}
        />
        <StatCard
          icon={LuPackage}
          label="Order Capacity"
          value={
            user.orderCapacity
              ? (ORDER_CAPACITY_LABELS.get(user.orderCapacity) ?? user.orderCapacity)
              : '—'
          }
        />
      </div>

      {/* ═══════ Info Grid ═══════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Business Information" icon={LuBuilding2}>
          <div className="divide-y divide-[color:var(--clr-border)]">
            <InfoRow icon={LuBriefcase} label="Business Name" value={user.businessName} />
            <InfoRow icon={LuBuilding2} label="Business Type" value={businessTypeLabel} />
            <InfoRow icon={LuTrendingUp} label="Business Size" value={businessSizeLabel} />
            <InfoRow icon={LuTag} label="Primary Category" value={categoryLabel} />
            {user.subCategories.length > 0 && (
              <InfoRow
                icon={LuTag}
                label="Sub Categories"
                value={user.subCategories.join(', ')}
              />
            )}
            <InfoRow
              icon={LuMapPin}
              label="Location"
              value={[user.district, user.area].filter(Boolean).join(', ') || undefined}
            />
          </div>
        </SectionCard>

        <SectionCard title="Contact & Identity" icon={LuPhone}>
          <div className="divide-y divide-[color:var(--clr-border)]">
            <InfoRow icon={LuMail} label="Email" value={user.email} />
            <InfoRow icon={LuPhone} label="Phone" value={user.phone} />
            <InfoRow icon={LuUser} label="Username" value={user.username} />
            <InfoRow icon={LuIdCard} label="Registration ID" value={user.businessRegistrationId} />
            <InfoRow icon={LuCalendar} label="Member Since" value={memberSince} />
          </div>
        </SectionCard>
      </div>

      {/* ═══════ Buyer Preferences ═══════ */}
      {isBuyer && (
        <SectionCard title="Buyer Preferences" icon={LuPackage}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="divide-y divide-[color:var(--clr-border)]">
              <InfoRow
                icon={LuDollarSign}
                label="Monthly Purchase Range"
                value={
                  user.monthlyPurchaseRange
                    ? (MONTHLY_PURCHASE_RANGE_LABELS.get(user.monthlyPurchaseRange) ??
                      user.monthlyPurchaseRange)
                    : undefined
                }
              />
              <InfoRow
                icon={LuTag}
                label="Pricing Preference"
                value={
                  user.pricingPreference
                    ? (PRICING_TYPE_LABELS.get(user.pricingPreference) ?? user.pricingPreference)
                    : undefined
                }
              />
              <InfoRow
                icon={LuCheck}
                label="Negotiation"
                value={
                  user.negotiationPreference
                    ? (NEGOTIATION_PREFERENCE_LABELS.get(user.negotiationPreference) ??
                      user.negotiationPreference)
                    : undefined
                }
              />
              <InfoRow
                icon={LuClock}
                label="Max Delivery Time"
                value={
                  user.maxDeliveryTime
                    ? (DELIVERY_TIME_LABELS.get(user.maxDeliveryTime) ?? user.maxDeliveryTime)
                    : undefined
                }
              />
            </div>
            <div className="divide-y divide-[color:var(--clr-border)]">
              <InfoRow
                icon={LuMapPin}
                label="Preferred Distance"
                value={
                  user.preferredDistance
                    ? (DISTANCE_PREFERENCE_LABELS.get(user.preferredDistance) ??
                      user.preferredDistance)
                    : undefined
                }
              />
              <InfoRow
                icon={LuTrendingUp}
                label="Buying Priority"
                value={
                  user.buyingPriority
                    ? (BUYING_PRIORITY_LABELS.get(user.buyingPriority) ?? user.buyingPriority)
                    : undefined
                }
              />
              <InfoRow
                icon={LuCalendar}
                label="Restock Frequency"
                value={
                  user.restockFrequency
                    ? (RESTOCK_FREQUENCY_LABELS.get(user.restockFrequency) ??
                      user.restockFrequency)
                    : undefined
                }
              />
            </div>
          </div>
        </SectionCard>
      )}

      {/* ═══════ Supplier Details ═══════ */}
      {isSupplier && (
        <SectionCard title="Supplier Details" icon={LuTruck}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
            <div className="divide-y divide-[color:var(--clr-border)]">
              <InfoRow
                icon={LuMapPin}
                label="Service Area"
                value={
                  user.serviceArea
                    ? (SERVICE_AREA_LABELS.get(user.serviceArea) ?? user.serviceArea)
                    : undefined
                }
              />
              <InfoRow
                icon={LuActivity}
                label="Service Radius"
                value={user.serviceRadiusKm ? `${user.serviceRadiusKm} km` : undefined}
              />
              <InfoRow
                icon={LuTruck}
                label="Delivery Method"
                value={
                  user.deliveryMethod
                    ? (DELIVERY_METHOD_LABELS.get(user.deliveryMethod) ?? user.deliveryMethod)
                    : undefined
                }
              />
              <InfoRow
                icon={LuClock}
                label="Delivery Time Range"
                value={
                  user.deliveryTimeRange
                    ? (DELIVERY_TIME_LABELS.get(user.deliveryTimeRange) ?? user.deliveryTimeRange)
                    : undefined
                }
              />
            </div>
            <div className="divide-y divide-[color:var(--clr-border)]">
              <InfoRow
                icon={LuDollarSign}
                label="Pricing Type"
                value={
                  user.pricingType
                    ? (PRICING_TYPE_LABELS.get(user.pricingType) ?? user.pricingType)
                    : undefined
                }
              />
              <InfoRow
                icon={LuTag}
                label="Bulk Discount"
                value={
                  user.bulkDiscountAvailable === true
                    ? 'Available'
                    : user.bulkDiscountAvailable === false
                      ? 'Not Available'
                      : undefined
                }
              />
              <InfoRow
                icon={LuPackage}
                label="Order Capacity"
                value={
                  user.orderCapacity
                    ? (ORDER_CAPACITY_LABELS.get(user.orderCapacity) ?? user.orderCapacity)
                    : undefined
                }
              />
            </div>
          </div>
          {user.supplierTags.length > 0 && (
            <div className="mt-5 pt-5 border-t border-[color:var(--clr-border)]">
              <p className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest mb-3">
                Supplier Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {user.supplierTags.map((tag) => (
                  <Tag key={tag}>{SUPPLIER_TAG_LABELS.get(tag) ?? tag}</Tag>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ═══════ Trust & Operations ═══════ */}
      <SectionCard title="Trust & Operations" icon={LuShield}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
          <div className="divide-y divide-[color:var(--clr-border)]">
            <InfoRow icon={LuCreditCard} label="Payment Terms" value={user.paymentTerms} />
            <InfoRow
              icon={LuDollarSign}
              label="Min Order Value"
              value={user.minOrderValue ? `৳${user.minOrderValue.toLocaleString()}` : undefined}
            />
          </div>
          <div className="divide-y divide-[color:var(--clr-border)]">
            <InfoRow
              icon={LuDollarSign}
              label="Max Order Value"
              value={user.maxOrderValue ? `৳${user.maxOrderValue.toLocaleString()}` : undefined}
            />
            <InfoRow
              icon={LuActivity}
              label="Last Active"
              value={
                user.lastActiveAt
                  ? new Date(user.lastActiveAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : undefined
              }
            />
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

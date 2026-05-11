import { GlowCard, InfoRow, IconPill, ProgressBar } from './profile-primitives';
import {
  SERVICE_AREA_LABELS,
  DELIVERY_METHOD_LABELS,
  DELIVERY_TIME_LABELS,
  PRICING_TYPE_LABELS,
  ORDER_CAPACITY_LABELS,
  SUPPLIER_TAG_LABELS,
} from './profile-helpers';
import {
  LuTruck,
  LuMapPin,
  LuActivity,
  LuClock,
  LuDollarSign,
  LuPackage,
  LuZap,
  LuPercent,
  LuShieldCheck,
} from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

const TAG_COLORS: Record<string, 'yellow' | 'teal' | 'green' | 'blue' | 'purple' | 'red'> = {
  FAST_DELIVERY: 'teal',
  BULK_DISCOUNT: 'yellow',
  PREMIUM_QUALITY: 'purple',
  LOW_PRICE: 'green',
  FACTORY_DIRECT: 'blue',
  CASH_ON_DELIVERY: 'green',
  VAT_INVOICE: 'blue',
  HALAL_CERTIFIED: 'green',
  BSTI_CERTIFIED: 'purple',
  EXPORT_READY: 'blue',
  COLD_CHAIN: 'teal',
  SAMPLE_AVAILABLE: 'yellow',
};

export function ProfileSupplierDetails({ user }: { user: SerializedUser }) {
  const deliverySpeedMap: Record<string, number> = {
    SAME_DAY: 100,
    NEXT_DAY: 80,
    TWO_THREE_DAYS: 60,
    WITHIN_WEEK: 40,
    FLEXIBLE: 30,
  };
  const deliverySpeed = user.deliveryTimeRange
    ? deliverySpeedMap[user.deliveryTimeRange] ?? 50
    : 0;

  return (
    <GlowCard title="Supplier Details" icon={LuTruck} glowColor="teal">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="divide-y divide-(--clr-border)">
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
          {user.serviceRadiusKm !== null && user.serviceRadiusKm !== undefined && (
            <div className="py-3">
              <ProgressBar
                label="Coverage Radius"
                value={user.serviceRadiusKm}
                max={200}
                color="#4ecdc4"
              />
            </div>
          )}
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
        <div className="divide-y divide-(--clr-border)">
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
            icon={LuPercent}
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

      {user.deliveryTimeRange && (
        <div className="mt-5 pt-5 border-t border-(--clr-border)">
          <div className="flex items-center gap-2 mb-3">
            <LuZap className="w-4 h-4 text-(--clr-teal)" />
            <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest">
              Delivery Speed Score
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1 h-2.5 rounded-full bg-[rgba(0,0,0,0.1)] dark:bg-(--clr-border) overflow-hidden">
              <div
                className="h-full rounded-full bg-linear-to-r from-(--clr-teal) to-emerald-400 transition-all duration-700"
                style={{ width: `${deliverySpeed}%` }}
              />
            </div>
            <span className="text-xs font-bold text-(--clr-teal) tabular-nums w-10 text-right">
              {deliverySpeed}%
            </span>
          </div>
        </div>
      )}

      {user.supplierTags.length > 0 && (
        <div className="mt-5 pt-5 border-t border-(--clr-border)">
          <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-3">
            Supplier Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {user.supplierTags.map((tag) => (
              <IconPill
                key={tag}
                icon={LuShieldCheck}
                label={SUPPLIER_TAG_LABELS.get(tag) ?? tag}
                color={TAG_COLORS[tag] ?? 'yellow'}
              />
            ))}
          </div>
        </div>
      )}
    </GlowCard>
  );
}

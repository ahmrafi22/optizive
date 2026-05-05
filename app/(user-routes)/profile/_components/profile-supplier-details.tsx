import { SectionCard, InfoRow, Tag } from './profile-primitives';
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
  LuTag,
  LuPackage,
} from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileSupplierDetails({ user }: { user: SerializedUser }) {
  return (
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
        <div className="mt-5 pt-5 border-t border-(--clr-border)">
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
  );
}

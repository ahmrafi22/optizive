import { SectionCard, InfoRow } from './profile-primitives';
import {
  MONTHLY_PURCHASE_RANGE_LABELS,
  PRICING_TYPE_LABELS,
  NEGOTIATION_PREFERENCE_LABELS,
  DELIVERY_TIME_LABELS,
  DISTANCE_PREFERENCE_LABELS,
  BUYING_PRIORITY_LABELS,
  RESTOCK_FREQUENCY_LABELS,
} from './profile-helpers';
import {
  LuPackage,
  LuDollarSign,
  LuTag,
  LuCheck,
  LuClock,
  LuMapPin,
  LuTrendingUp,
  LuCalendar,
} from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileBuyerPreferences({ user }: { user: SerializedUser }) {
  return (
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
  );
}

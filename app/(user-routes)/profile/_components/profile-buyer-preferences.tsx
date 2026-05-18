import { GlowCard, InfoRow, IconPill } from './profile-primitives';
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
  LuZap,
  LuShield,
} from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

const PRIORITY_ORDER = ['CHEAP', 'FAST', 'QUALITY', 'RELIABILITY', 'CONSISTENCY'];

export function ProfileBuyerPreferences({ user }: { user: SerializedUser }) {
  const priorityIdx = user.buyingPriority ? PRIORITY_ORDER.indexOf(user.buyingPriority) : -1;

  return (
    <GlowCard title="Buyer Preferences" icon={LuPackage} glowColor="blue">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
        <div className="divide-y divide-(--clr-border)">
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
        <div className="divide-y divide-(--clr-border)">
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

      {user.buyingPriority && (
        <div className="mt-5 pt-5 border-t border-(--clr-border)">
          <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-3">
            Priority Balance
          </p>
          <div className="space-y-2">
            {PRIORITY_ORDER.map((key, i) => {
              const isActive = i === priorityIdx;
              const pct = isActive ? 85 : i < priorityIdx ? 40 : 15;
              const label = BUYING_PRIORITY_LABELS.get(key) ?? key;
              return (
                <div key={key} className="flex items-center gap-3">
                  <span className={`text-[11px] font-semibold w-20 text-right ${isActive ? 'text-[#d4c000] dark:text-[#fff44f]' : 'text-(--clr-fg-dim)'}`}>
                    {label}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden bg-black/12 dark:bg-white/8">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isActive ? 'bg-[#d4c000] dark:bg-[#fff44f]' : 'bg-black/15 dark:bg-white/8'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {isActive && <LuZap className="w-3.5 h-3.5 text-[#d4c000] dark:text-[#fff44f]" />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-5 pt-5 border-t border-(--clr-border)">
        <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-3">
          Preference Tags
        </p>
        <div className="flex flex-wrap gap-2">
          {user.pricingPreference && (
            <IconPill icon={LuTag} label={PRICING_TYPE_LABELS.get(user.pricingPreference) ?? user.pricingPreference} color="yellow" />
          )}
          {user.negotiationPreference && (
            <IconPill icon={LuShield} label={NEGOTIATION_PREFERENCE_LABELS.get(user.negotiationPreference) ?? user.negotiationPreference} color="teal" />
          )}
          {user.maxDeliveryTime && (
            <IconPill icon={LuClock} label={DELIVERY_TIME_LABELS.get(user.maxDeliveryTime) ?? user.maxDeliveryTime} color="blue" />
          )}
          {user.preferredDistance && (
            <IconPill icon={LuMapPin} label={DISTANCE_PREFERENCE_LABELS.get(user.preferredDistance) ?? user.preferredDistance} color="green" />
          )}
          {!user.pricingPreference && !user.negotiationPreference && !user.maxDeliveryTime && !user.preferredDistance && (
            <span className="text-xs text-(--clr-fg-dim)">No tags set</span>
          )}
        </div>
      </div>
    </GlowCard>
  );
}

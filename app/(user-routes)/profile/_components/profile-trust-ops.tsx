import { GlowCard, InfoRow, CircularProgress, IconPill } from './profile-primitives';
import { LuShield, LuCreditCard, LuDollarSign, LuActivity, LuBadgeCheck, LuTrendingUp } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileTrustOps({ user }: { user: SerializedUser }) {
  const trustScore = Math.min(
    (user.isVerified ? 30 : 0) +
    (user.yearsInBusiness ? Math.min(user.yearsInBusiness * 3, 30) : 0) +
    (user.avgRating * 8),
    100
  );
  const minVal = user.minOrderValue ?? 0;
  const maxVal = user.maxOrderValue ?? 0;
  const rangeMax = Math.max(maxVal, minVal, 500000);
  const minPct = rangeMax > 0 ? (minVal / rangeMax) * 100 : 0;
  const maxPct = rangeMax > 0 ? (maxVal / rangeMax) * 100 : 0;

  return (
    <GlowCard title="Trust & Operations" icon={LuShield} glowColor="green">
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

      <div className="mt-5 pt-5 border-t border-(--clr-border)">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="flex items-center gap-4">
            <CircularProgress value={trustScore} size={64} stroke={5} color="#4ade80">
              <span className="text-[11px] font-bold text-[color:var(--clr-fg)]">{Math.round(trustScore)}</span>
            </CircularProgress>
            <div>
              <p className="text-xs font-bold text-[color:var(--clr-fg)]">Trust Score</p>
              <p className="text-[10px] text-[color:var(--clr-fg-dim)] mt-0.5">
                Based on verification, experience & ratings
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                {user.isVerified && <IconPill icon={LuBadgeCheck} label="Verified" color="green" />}
                {user.avgRating >= 4 && <IconPill icon={LuTrendingUp} label="Top Rated" color="yellow" />}
              </div>
            </div>
          </div>

          {(minVal > 0 || maxVal > 0) && (
            <div className="flex flex-col justify-center">
              <p className="text-[10px] font-semibold text-[color:var(--clr-fg-dim)] uppercase tracking-widest mb-2">
                Order Value Range
              </p>
              <div className="relative h-3 rounded-full bg-[color:var(--clr-border)] overflow-hidden">
                <div
                  className="absolute h-full rounded-full bg-gradient-to-r from-[color:var(--clr-yellow)] to-emerald-400 transition-all duration-700"
                  style={{
                    left: `${minPct}%`,
                    width: `${Math.max(maxPct - minPct, 2)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] font-bold text-[color:var(--clr-fg)] tabular-nums">
                  ৳{minVal.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-[color:var(--clr-fg)] tabular-nums">
                  ৳{maxVal.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </GlowCard>
  );
}

import { SectionCard, InfoRow } from './profile-primitives';
import { LuShield, LuCreditCard, LuDollarSign, LuActivity } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileTrustOps({ user }: { user: SerializedUser }) {
  return (
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
  );
}

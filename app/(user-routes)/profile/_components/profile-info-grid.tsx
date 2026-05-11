import { GlowCard, InfoRow, SizeVisualizer, IconPill } from './profile-primitives';
import {
  BUSINESS_TYPE_LABELS,
  BUSINESS_SIZE_LABELS,
  CATEGORY_LABELS,
} from './profile-helpers';
import {
  LuBuilding2,
  LuBriefcase,
  LuTrendingUp,
  LuTag,
  LuMapPin,
  LuPhone,
  LuMail,
  LuUser,
  LuIdCard,
  LuCalendar,
  LuLayers,
} from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileInfoGrid({ user }: { user: SerializedUser }) {
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <GlowCard title="Business Information" icon={LuBuilding2} glowColor="purple">
        <div className="divide-y divide-(--clr-border)">
          <InfoRow icon={LuBriefcase} label="Business Name" value={user.businessName} />
          <InfoRow icon={LuBuilding2} label="Business Type" value={businessTypeLabel} />
          <InfoRow icon={LuTrendingUp} label="Business Size" value={businessSizeLabel} />
          {user.businessSize && (
            <div className="py-3">
              <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-2">
                Size Progression
              </p>
              <SizeVisualizer size={user.businessSize} />
            </div>
          )}
          <InfoRow icon={LuTag} label="Primary Category" value={categoryLabel} />
          {user.subCategories.length > 0 && (
            <InfoRow
              icon={LuLayers}
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
      </GlowCard>

      <GlowCard title="Contact & Identity" icon={LuPhone} glowColor="blue">
        <div className="divide-y divide-(--clr-border)">
          <InfoRow icon={LuMail} label="Email" value={user.email} />
          <InfoRow icon={LuPhone} label="Phone" value={user.phone} />
          <InfoRow icon={LuUser} label="Username" value={user.username} />
          <InfoRow icon={LuIdCard} label="Registration ID" value={user.businessRegistrationId} />
          <InfoRow icon={LuCalendar} label="Member Since" value={memberSince} />
        </div>
        <div className="mt-5 pt-5 border-t border-(--clr-border)">
          <p className="text-[10px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-3">
            Profile Quick Tags
          </p>
          <div className="flex flex-wrap gap-2">
            {user.email && <IconPill icon={LuMail} label="Email Set" color="blue" />}
            {user.phone && <IconPill icon={LuPhone} label="Phone Set" color="green" />}
            {user.businessRegistrationId && <IconPill icon={LuIdCard} label="Registered" color="purple" />}
            {user.businessName && <IconPill icon={LuBuilding2} label="Biz Name Set" color="yellow" />}
            {!user.email && !user.phone && !user.businessRegistrationId && !user.businessName && (
              <span className="text-xs text-(--clr-fg-dim)">No quick tags yet</span>
            )}
          </div>
        </div>
      </GlowCard>
    </div>
  );
}

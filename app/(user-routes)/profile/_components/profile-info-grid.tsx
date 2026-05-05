import { SectionCard, InfoRow } from './profile-primitives';
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
  );
}

'use client';

import { Badge, RatingDisplay, StatusDot, CircularProgress, IconPill } from './profile-primitives';
import {
  ROLE_LABELS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_SIZE_LABELS,
  CATEGORY_LABELS,
} from './profile-helpers';
import { LuPencil, LuBadgeCheck, LuMapPin, LuBuilding2 } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';

export function ProfileHeader({
  user,
  onEdit,
}: {
  user: SerializedUser;
  onEdit: () => void;
}) {
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

  const profileCompletion = [
    user.businessName,
    user.businessType,
    user.district,
    user.phone,
    user.email,
    user.primaryCategory,
  ].filter(Boolean).length;
  const completionPct = Math.round((profileCompletion / 6) * 100);

  const roleAccentColor = user.role === 'SUPPLIER' ? '#4ecdc4' : user.role === 'STORE_OWNER' ? '#60a5fa' : '#fff44f';

  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface2)">
      <div
        style={{ backgroundImage: `linear-gradient(to right, ${roleAccentColor}, transparent)` }}
      />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-(--clr-yellow)/6 to-transparent pointer-events-none" />

      <div className="relative p-6 pb-4 md:p-8 md:pb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-(--clr-yellow) flex items-center justify-center text-(--clr-charcoal) text-3xl font-bold overflow-hidden ring-4 ring-(--clr-surface) shadow-lg">
              {user.profileImage ? (
                <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-(--clr-surface2) flex items-center justify-center">
              <StatusDot active={user.isActive} />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 ">
              <h1 className="text-2xl font-bold text-(--clr-fg)">{user.name}</h1>
              {user.isVerified && (
                <IconPill icon={LuBadgeCheck} label="Verified" color="green" />
              )}
              <button
                type="button"
                onClick={onEdit}
                className="w-7 h-7 rounded-full bg-(--clr-surface) border border-(--clr-border) flex items-center justify-center text-(--clr-fg-dim) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
                title="Update profile"
              >
                <LuPencil className="w-3.5 h-3.5" />
              </button>
            </div>

            {user.businessName && (
              <div className="flex items-center gap-1.5 text-(--clr-fg-muted) font-medium mb-1">
                <LuBuilding2 className="w-3.5 h-3.5 text-(--clr-fg-dim)" />
                <span>{user.businessName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-(--clr-fg-dim) mb-2">
              <LuMapPin className="w-3.5 h-3.5" />
              <span>{[user.district, user.area].filter(Boolean).join(', ') || 'Location not set'}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 ">
              <Badge color={user.role === 'SUPPLIER' ? 'teal' : user.role === 'STORE_OWNER' ? 'blue' : 'yellow'}>
                {roleLabel}
              </Badge>
              {businessTypeLabel && <Badge color="purple">{businessTypeLabel}</Badge>}
              {businessSizeLabel && <Badge color="teal">{businessSizeLabel}</Badge>}
              {categoryLabel && <Badge color="blue">{categoryLabel}</Badge>}
            </div>

          </div>

          <div className="flex items-center gap-5 shrink-0 mt-2 md:mt-0">
            <div className="text-center">
              <CircularProgress value={completionPct} size={60} stroke={4} circleClassName="stroke-[#4ecdc4] dark:stroke-[#fff44f]">
                <span className="text-[10px] font-bold text-(--clr-fg)">{completionPct}%</span>
              </CircularProgress>
              <p className="text-[9px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mt-1">
                Complete
              </p>
            </div>
            <div className="w-px h-12 bg-(--clr-border)" />
            <div className="min-w-35">
              <RatingDisplay rating={user.avgRating} total={user.totalTransactions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

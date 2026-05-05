'use client';

import { Avatar, Badge, RatingDisplay } from './profile-primitives';
import {
  ROLE_LABELS,
  BUSINESS_TYPE_LABELS,
  BUSINESS_SIZE_LABELS,
  CATEGORY_LABELS,
} from './profile-helpers';
import { LuPencil, LuBadgeCheck } from 'react-icons/lu';
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

  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-[color:var(--clr-surface2)] p-6 md:p-8">
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[color:var(--clr-yellow)]/[0.07] to-transparent pointer-events-none" />
      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <Avatar name={user.name} imageUrl={user.profileImage} />
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-2xl font-bold text-[color:var(--clr-fg)]">{user.name}</h1>
              {user.isVerified && (
                <Badge color="green">
                  <LuBadgeCheck className="w-3.5 h-3.5" />
                  Verified
                </Badge>
              )}
              <button
                type="button"
                onClick={onEdit}
                className="w-6 h-6 rounded-full bg-[color:var(--clr-surface)] border border-(--clr-border) flex items-center justify-center text-[color:var(--clr-fg-dim)] hover:border-[color:var(--clr-border-hover)] hover:text-[color:var(--clr-fg)] transition-colors"
                title="Update profile"
              >
                <LuPencil className="w-3 h-3" />
              </button>
            </div>

            {user.businessName && (
              <p className="text-[color:var(--clr-fg-muted)] font-medium mb-3">
                {user.businessName}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2.5">
              <Badge color="yellow">{roleLabel}</Badge>
              {businessTypeLabel && <Badge color="teal">{businessTypeLabel}</Badge>}
              {businessSizeLabel && <Badge color="purple">{businessSizeLabel}</Badge>}
              {categoryLabel && <Badge color="blue">{categoryLabel}</Badge>}
            </div>
          </div>

          <div className="md:w-64 shrink-0 mt-4 md:mt-0">
            <RatingDisplay rating={user.avgRating} total={user.totalTransactions} />
          </div>
        </div>
      </div>

    </div>
  );
}

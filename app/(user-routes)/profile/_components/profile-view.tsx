'use client';

import { motion } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { LuStar, LuMessageSquare } from 'react-icons/lu';
import type { SerializedUser } from '@/backend/user/user';
import { getUserRatings, getPublicProfile, type RatingDetail } from '@/backend/rating/rating';
import { ProfileHeader } from './profile-header';
import { ProfileStats } from './profile-stats';
import { ProfileInfoGrid } from './profile-info-grid';
import { ProfileBuyerPreferences } from './profile-buyer-preferences';
import { ProfileSupplierDetails } from './profile-supplier-details';
import { ProfileTrustOps } from './profile-trust-ops';
import { ProfileEditModal } from './profile-edit-modal';

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

type ProfileUser = SerializedUser;

function FadeUp({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.56, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ProfileView({ user }: { user: ProfileUser }) {
  const [isEditing, setIsEditing] = useState(false);
  const [ratings, setRatings] = useState<RatingDetail[]>([]);
  const [ratingBreakdown, setRatingBreakdown] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [totalRatings, setTotalRatings] = useState(0);
  const [ratingsLoading, setRatingsLoading] = useState(true);

  const fetchRatings = useCallback(async () => {
    setRatingsLoading(true);
    try {
      const [ratingsData, profileData] = await Promise.all([
        getUserRatings(user.id),
        getPublicProfile(user.id),
      ]);
      setRatings(ratingsData);
      if (profileData) {
        setRatingBreakdown(profileData.ratingBreakdown);
        setTotalRatings(profileData.totalRatings);
      }
    } catch {
      // silently fail
    } finally {
      setRatingsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchRatings();
  }, [fetchRatings]);

  const isBuyer = user.role === 'STORE_OWNER' || user.role === 'BOTH';
  const isSupplier = user.role === 'SUPPLIER' || user.role === 'BOTH';

  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-5 py-4">
      <FadeUp delay={0}>
        <ProfileHeader user={user} onEdit={() => setIsEditing(true)} />
      </FadeUp>
      <FadeUp delay={0.08}>
        <ProfileStats user={user} onRatingClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
      </FadeUp>
      <FadeUp delay={0.16}>
        <ProfileInfoGrid user={user} />
      </FadeUp>
      {isBuyer && (
        <FadeUp delay={0.24}>
          <ProfileBuyerPreferences user={user} />
        </FadeUp>
      )}
      {isSupplier && (
        <FadeUp delay={0.32}>
          <ProfileSupplierDetails user={user} />
        </FadeUp>
      )}
      <FadeUp delay={0.4}>
        <ProfileTrustOps user={user} />
      </FadeUp>

      {/* Reviews Section */}
      <FadeUp delay={0.48}>
        <div id="reviews-section" className="rounded-3xl border border-(--clr-border) bg-(--clr-surface2) p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-(--clr-fg)">Reviews & Ratings</h2>
              <p className="text-sm text-(--clr-fg-muted) mt-1">
                {totalRatings} review{totalRatings !== 1 ? "s" : ""} &middot; {user.avgRating.toFixed(1)} avg
              </p>
            </div>
          </div>

          {/* Rating Breakdown */}
          {!ratingsLoading && totalRatings > 0 && (
            <div className="mb-8 p-5 rounded-2xl border border-(--clr-border) bg-(--clr-surface)">
              <h3 className="text-xs font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-4">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = ratingBreakdown[star] || 0;
                  const pct = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <span className="text-xs font-medium text-(--clr-fg-muted) w-6">{star}</span>
                      <LuStar className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <div className="flex-1 h-2 rounded-full bg-(--clr-surface) overflow-hidden">
                        <div className="h-full rounded-full bg-(--clr-yellow) transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-(--clr-fg-muted) w-8 text-right tabular-nums">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reviews List */}
          {ratingsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-(--clr-border) p-4 animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-xl bg-(--clr-surface)" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-(--clr-surface) rounded" />
                      <div className="h-3 w-48 bg-(--clr-surface) rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : ratings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface)">
                <LuMessageSquare className="h-6 w-6 text-(--clr-fg-dim)" />
              </div>
              <p className="mt-3 text-sm font-medium text-(--clr-fg-muted)">No reviews yet</p>
              <p className="text-xs text-(--clr-fg-dim) mt-1">Reviews from other users will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ratings.map((r) => (
                <div key={r.id} className="rounded-2xl border border-(--clr-border) p-4">
                  <div className="flex items-start gap-3">
                    <Link href={`/profile/${r.rater.id}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface) overflow-hidden hover:border-(--clr-border-hover) transition-all">
                      {r.rater.profileImage ? (
                        <img src={r.rater.profileImage} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-(--clr-fg-muted)">{r.rater.name?.charAt(0)}</span>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <Link href={`/profile/${r.rater.id}`} className="text-sm font-semibold text-(--clr-fg) hover:underline">
                            {r.rater.businessName || r.rater.name}
                          </Link>
                          <div className="flex items-center gap-1 mt-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <LuStar key={s} className={`h-3 w-3 ${s <= r.score ? "fill-amber-400 text-amber-400" : "text-(--clr-fg-dim)"}`} />
                            ))}
                          </div>
                        </div>
                        <span className="text-[10px] text-(--clr-fg-dim) shrink-0">{timeAgo(r.createdAt)}</span>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-(--clr-fg-muted) mt-2">{r.comment}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FadeUp>

      <ProfileEditModal user={user} isOpen={isEditing} onClose={() => setIsEditing(false)} />
    </div>
  );
}

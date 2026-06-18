"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "motion/react";
import {
  LuPackage,
  LuArrowLeft,
  LuStar,
  LuBadgeCheck,
  LuMapPin,
  LuBuilding2,
  LuCalendar,
  LuMessageSquare,
  LuExternalLink,
  LuShoppingBag,
} from "react-icons/lu";
import {
  getPublicProfile,
  submitRating,
  getUserRatings,
  hasRatedUser,
  getMyRating,
  type PublicProfile,
  type RatingDetail,
} from "@/backend/rating/rating";
import { ProfileHeader } from "@/app/(user-routes)/profile/_components/profile-header";
import { ProfileStats } from "@/app/(user-routes)/profile/_components/profile-stats";
import { ProfileInfoGrid } from "@/app/(user-routes)/profile/_components/profile-info-grid";
import { ProfileBuyerPreferences } from "@/app/(user-routes)/profile/_components/profile-buyer-preferences";
import { ProfileSupplierDetails } from "@/app/(user-routes)/profile/_components/profile-supplier-details";
import { ProfileTrustOps } from "@/app/(user-routes)/profile/_components/profile-trust-ops";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

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

export default function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [ratings, setRatings] = useState<RatingDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRateDialog, setShowRateDialog] = useState(false);
  const [existingRating, setExistingRating] = useState<{ score: number; comment: string | null } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [profileData, ratingsData, myRating] = await Promise.all([
        getPublicProfile(userId),
        getUserRatings(userId),
        getMyRating(userId),
      ]);
      if (!profileData) {
        setError("User not found.");
        return;
      }
      setProfile(profileData);
      setRatings(ratingsData);
      setExistingRating(myRating);
    } catch {
      setError("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl pb-16">
        <div className="space-y-5">
          <div className="h-8 w-32 bg-neutral-800/30 rounded animate-pulse" />
          <div className="h-48 bg-neutral-800/30 rounded-3xl animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-32 bg-neutral-800/30 rounded-3xl animate-pulse" />
            <div className="h-32 bg-neutral-800/30 rounded-3xl animate-pulse" />
          </div>
          <div className="h-48 bg-neutral-800/30 rounded-3xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="mx-auto w-full max-w-6xl pb-16">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
            <LuPackage className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-200">{error ?? "User not found"}</h3>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-all"
          >
            <LuArrowLeft className="h-4 w-4" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const isBuyer = profile.role === "STORE_OWNER" || profile.role === "BOTH";
  const isSupplier = profile.role === "SUPPLIER" || profile.role === "BOTH";

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <div className="flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowRateDialog(true)}
            className="inline-flex items-center gap-2 rounded-full bg-(--clr-teal-dim) px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
          >
            <LuStar className="h-4 w-4" />
            {existingRating ? "Update Rating" : "Rate User"}
          </button>
          <Link
            href={`/suppliers/${userId}`}
            className="inline-flex items-center gap-2 rounded-full border border-(--clr-border) px-5 py-2.5 text-sm font-semibold text-(--clr-fg) hover:border-(--clr-border-hover) transition-all"
          >
            <LuShoppingBag className="h-4 w-4" />
            View Inventory
          </Link>
        </div>
      </div>

      <div className="space-y-5">
        <FadeUp delay={0}>
          <CustomProfileHeader profile={profile} onRate={() => setShowRateDialog(true)} existingRating={existingRating} />
        </FadeUp>

        <FadeUp delay={0.08}>
          <ProfileStats user={profile as any} onRatingClick={() => document.getElementById('reviews-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })} />
        </FadeUp>

        <FadeUp delay={0.16}>
          <ProfileInfoGrid user={profile as any} />
        </FadeUp>

        {isBuyer && (
          <FadeUp delay={0.24}>
            <ProfileBuyerPreferences user={profile as any} />
          </FadeUp>
        )}

        {isSupplier && (
          <FadeUp delay={0.32}>
            <ProfileSupplierDetails user={profile as any} />
          </FadeUp>
        )}

        <FadeUp delay={0.4}>
          <ProfileTrustOps user={profile as any} />
        </FadeUp>

        {/* Reviews Section */}
        <FadeUp delay={0.48}>
          <div id="reviews-section" className="rounded-3xl border border-(--clr-border) bg-(--clr-surface2) p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-(--clr-fg)">Reviews & Ratings</h2>
                <p className="text-sm text-(--clr-fg-muted) mt-1">
                  {profile.totalRatings} review{profile.totalRatings !== 1 ? "s" : ""} &middot; {profile.avgRating.toFixed(1)} avg
                </p>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="mb-8 p-5 rounded-2xl border border-(--clr-border) bg-(--clr-surface)">
              <h3 className="text-xs font-semibold text-(--clr-fg-dim) uppercase tracking-widest mb-4">Rating Breakdown</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = profile.ratingBreakdown[star] || 0;
                  const pct = profile.totalRatings > 0 ? (count / profile.totalRatings) * 100 : 0;
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

            {/* Reviews List */}
            {ratings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface)">
                  <LuMessageSquare className="h-6 w-6 text-(--clr-fg-dim)" />
                </div>
                <p className="mt-3 text-sm font-medium text-(--clr-fg-muted)">No reviews yet</p>
                <p className="text-xs text-(--clr-fg-dim) mt-1">Be the first to leave a review</p>
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
                          <span className="text-xs font-bold text-(--clr-fg-muted)">{r.rater.name.charAt(0)}</span>
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
      </div>

      {/* Rate Dialog */}
      {showRateDialog && (
        <RateDialog
          userId={userId}
          userName={profile.businessName || profile.name}
          existingRating={existingRating}
          onClose={() => setShowRateDialog(false)}
          onDone={() => { setShowRateDialog(false); fetchData(); }}
        />
      )}
    </div>
  );
}

function CustomProfileHeader({
  profile,
  onRate,
  existingRating,
}: {
  profile: PublicProfile;
  onRate: () => void;
  existingRating: { score: number; comment: string | null } | null;
}) {
  const roleAccentColor = profile.role === "SUPPLIER" ? "#4ecdc4" : profile.role === "STORE_OWNER" ? "#60a5fa" : "#fff44f";

  return (
    <div className="relative overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface2)">
      <div style={{ backgroundImage: `linear-gradient(to right, ${roleAccentColor}, transparent)` }} className="h-1" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-(--clr-yellow)/6 to-transparent pointer-events-none" />

      <div className="relative p-6 pb-4 md:p-8 md:pb-5">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 rounded-2xl bg-(--clr-yellow) flex items-center justify-center text-(--clr-charcoal) text-3xl font-bold overflow-hidden ring-4 ring-(--clr-surface) shadow-lg">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-bold text-(--clr-fg)">{profile.name}</h1>
              {profile.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-400">
                  <LuBadgeCheck className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>

            {profile.businessName && (
              <div className="flex items-center gap-1.5 text-(--clr-fg-muted) font-medium mb-1">
                <LuBuilding2 className="w-3.5 h-3.5 text-(--clr-fg-dim)" />
                <span>{profile.businessName}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5 text-xs text-(--clr-fg-dim) mb-2">
              <LuMapPin className="w-3.5 h-3.5" />
              <span>{[profile.district, profile.area].filter(Boolean).join(", ") || "Location not set"}</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${
                profile.role === "SUPPLIER" ? "border-teal-500/30 bg-teal-500/10 text-teal-400" :
                profile.role === "STORE_OWNER" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" :
                "border-yellow-500/30 bg-yellow-500/10 text-yellow-400"
              }`}>
                {profile.role.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
              {profile.businessType && (
                <span className="rounded-full border border-(--clr-border) bg-(--clr-surface) px-2.5 py-0.5 text-[10px] font-medium text-(--clr-fg-muted)">
                  {profile.businessType.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
              {profile.primaryCategory && (
                <span className="rounded-full border border-(--clr-border) bg-(--clr-surface) px-2.5 py-0.5 text-[10px] font-medium text-(--clr-fg-muted)">
                  {profile.primaryCategory.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0 mt-2 md:mt-0">
            <div className="text-center">
              <p className="text-3xl font-bold text-(--clr-fg) tabular-nums">{profile.avgRating.toFixed(1)}</p>
              <div className="flex items-center gap-0.5 mt-1 justify-center">
                {[1, 2, 3, 4, 5].map((s) => (
                  <LuStar key={s} className={`h-3 w-3 ${s <= Math.round(profile.avgRating) ? "fill-amber-400 text-amber-400" : "text-(--clr-fg-dim)"}`} />
                ))}
              </div>
              <p className="text-[9px] font-semibold text-(--clr-fg-dim) uppercase tracking-widest mt-1">
                {profile.totalRatings} review{profile.totalRatings !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RateDialog({
  userId,
  userName,
  existingRating,
  onClose,
  onDone,
}: {
  userId: string;
  userName: string;
  existingRating: { score: number; comment: string | null } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [score, setScore] = useState(existingRating?.score ?? 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (score < 1) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitRating({ rateeId: userId, score, comment: comment || undefined });
      if (!result.ok) {
        setError(result.message ?? "Failed to submit rating.");
        return;
      }
      onDone();
    } catch {
      setError("Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-3xl border border-(--clr-border) bg-(--clr-surface) p-6 shadow-2xl">
        <h2 className="text-lg font-bold text-(--clr-fg) mb-1">
          {existingRating ? "Update Rating" : "Rate User"}
        </h2>
        <p className="text-sm text-(--clr-fg-muted) mb-5">{userName}</p>

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">{error}</div>
        )}

        <div className="flex items-center justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setScore(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <LuStar className={`h-10 w-10 ${s <= (hover || score) ? "fill-amber-400 text-amber-400" : "text-(--clr-fg-dim)"}`} />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Write a review (optional)"
          rows={3}
          className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-dim) focus:outline-none focus:border-(--clr-teal-dim) resize-none transition-colors mb-5"
        />

        <div className="flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-full border border-(--clr-border) py-2.5 text-sm font-medium text-(--clr-fg-muted) hover:text-(--clr-fg) hover:border-(--clr-border-hover) transition-all"
          >
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={score < 1 || submitting}
            className="flex-1 rounded-full bg-(--clr-teal-dim) py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Submitting..." : existingRating ? "Update" : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
}

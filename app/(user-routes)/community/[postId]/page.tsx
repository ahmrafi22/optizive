"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LuArrowLeft, LuClock, LuShoppingCart, LuFileText, LuTag, LuDollarSign, LuTrash2, LuCalendar, LuMoveHorizontal } from "react-icons/lu";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { VoteButtons } from "../_components/VoteButtons";
import { CommentSection } from "../_components/CommentSection";
import { FulfillmentSection } from "../_components/FulfillmentSection";
import { getPostById, getComments, deletePost } from "@/backend/community/community";
import type { PostDetail, CommentItem } from "@/backend/community/community";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FILLED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CLOSED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (!params.postId) return;
    setIsLoading(true);
    Promise.all([
      getPostById(params.postId),
      getComments(params.postId),
    ])
      .then(([p, c]) => {
        if (p) { setPost(p); setComments(c); }
        else router.push("/community");
      })
      .catch(() => router.push("/community"))
      .finally(() => setIsLoading(false));
  }, [params.postId, router]);

  const handleDelete = useCallback(async () => {
    if (!post) return;
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(post.id);
      router.push("/community");
    } catch (e) {
      console.error(e);
    }
  }, [post, router]);

  if (isLoading) {
    return (
      <div className="relative mx-auto w-full max-w-3xl">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 rounded bg-(--clr-surface2)" />
          <div className="h-10 w-3/4 rounded-xl bg-(--clr-surface2)" />
          <div className="h-32 rounded-2xl bg-(--clr-surface2)" />
        </div>
      </div>
    );
  }

  if (!post) return null;

  const isOwner = session?.user?.id === post.author.id;
  const isProcurement = post.type === "PROCUREMENT";

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-(--clr-fg-dim) hover:text-(--clr-fg) transition-colors mb-6"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) overflow-hidden">
          <div className="p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[post.status] ?? ""}`}>
                  {post.status}
                </span>
                {isProcurement && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-400 flex items-center gap-1">
                    <LuShoppingCart className="h-3 w-3" />
                    Procurement
                  </span>
                )}
              </div>

              {isOwner && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowMenu((p) => !p)}
                    className="p-1.5 rounded-lg text-(--clr-fg-dim) hover:text-(--clr-fg) hover:bg-(--clr-surface) transition-colors"
                  >
                    <LuMoveHorizontal className="h-5 w-5" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 w-32 rounded-xl border border-(--clr-border) bg-(--clr-surface2) shadow-lg py-1">
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <LuTrash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-(--clr-fg) leading-tight">
              {post.title}
            </h1>

            <p className="text-sm text-(--clr-fg-muted) whitespace-pre-wrap leading-relaxed">
              {post.content}
            </p>

            {isProcurement && (post.budget != null || post.needByDate) && (
              <div className="flex gap-4 text-xs text-(--clr-fg-dim)">
                {post.budget != null && (
                  <span className="flex items-center gap-1">
                    <LuDollarSign className="h-3.5 w-3.5" />
                    Budget: ৳{post.budget.toFixed(2)}
                  </span>
                )}
                {post.needByDate && (
                  <span className="flex items-center gap-1">
                    <LuCalendar className="h-3.5 w-3.5" />
                    Need by: {new Date(post.needByDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            )}

            {post.categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.categories.map((cat) => (
                  <span key={cat} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--clr-surface) border border-(--clr-border) text-(--clr-fg-dim)">
                    <LuTag className="h-3 w-3" />
                    {cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </span>
                ))}
              </div>
            )}

            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span key={tag.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--clr-yellow)/10 text-(--clr-yellow) border border-(--clr-yellow)/20">
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-(--clr-border) flex-wrap gap-3">
              <div className="flex items-center gap-3 text-xs text-(--clr-fg-dim)">
                <span className="flex items-center gap-1.5">
                  <div className="h-6 w-6 rounded-full bg-(--clr-surface) border border-(--clr-border) flex items-center justify-center text-[9px] font-bold text-(--clr-fg-dim)">
                    {(post.author.businessName || post.author.name).charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-(--clr-fg)">{post.author.businessName || post.author.name}</span>
                </span>
                <span className="flex items-center gap-1">
                  <LuClock className="h-3 w-3" />
                  {getTimeAgo(post.createdAt)}
                </span>
              </div>

              <VoteButtons
                postId={post.id}
                initialUpvotes={post.upvoteCount}
                initialDownvotes={post.downvoteCount}
                initialUserVote={post.userVote}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <FulfillmentSection
            postId={post.id}
            postAuthorId={post.author.id}
            currentUserId={session?.user?.id ?? ""}
            initialFulfillments={post.fulfillments}
            isProcurement={isProcurement}
          />

          <CommentSection
            postId={post.id}
            initialComments={comments}
            currentUserId={session?.user?.id ?? ""}
          />
        </div>
      </motion.div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

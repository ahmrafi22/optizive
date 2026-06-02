"use client";

import Link from "next/link";
import { LuMessageSquare, LuShoppingCart, LuFileText, LuClock, LuTag } from "react-icons/lu";
import { VoteButtons } from "./VoteButtons";
import type { PostListItem } from "@/backend/community/community";

interface PostCardProps {
  post: PostListItem;
}

const statusColors: Record<string, string> = {
  OPEN: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  FILLED: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  CLOSED: "bg-gray-500/15 text-gray-400 border-gray-500/30",
};

export function PostCard({ post }: PostCardProps) {
  const timeAgo = getTimeAgo(post.createdAt);
  const isProcurement = post.type === "PROCUREMENT";

  return (
    <Link
      href={`/community/${post.id}`}
      className="group block rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 transition-all duration-200 hover:border-(--clr-yellow)/40 hover:shadow-lg hover:shadow-(--clr-yellow)/5"
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 pt-1">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            isProcurement
              ? "bg-amber-500/15 text-amber-400"
              : "bg-(--clr-teal-dim)/15 text-(--clr-teal-dim)"
          }`}>
            {isProcurement ? <LuShoppingCart className="h-5 w-5" /> : <LuFileText className="h-5 w-5" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[post.status] ?? ""}`}>
              {post.status}
            </span>
            {isProcurement && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-amber-500/30 bg-amber-500/15 text-amber-400">
                Procurement
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-(--clr-fg) group-hover:text-(--clr-yellow) transition-colors line-clamp-1">
            {post.title}
          </h3>

          <p className="mt-1 text-sm text-(--clr-fg-muted) line-clamp-2">
            {post.content}
          </p>

          {post.categories.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.categories.map((cat) => (
                <span key={cat} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--clr-surface) border border-(--clr-border) text-(--clr-fg-dim)">
                  <LuTag className="h-3 w-3" />
                  {cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                </span>
              ))}
            </div>
          )}

          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {post.tags.map((tag) => (
                <span key={tag.id} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-(--clr-yellow)/10 text-(--clr-yellow) border border-(--clr-yellow)/20">
                  #{tag.name}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-3 text-xs text-(--clr-fg-dim)">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-(--clr-fg)">{post.author.businessName || post.author.name}</span>
              </span>
              <span className="flex items-center gap-1">
                <LuClock className="h-3 w-3" />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <LuMessageSquare className="h-3 w-3" />
                {post.commentCount}
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
    </Link>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = now - date;
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

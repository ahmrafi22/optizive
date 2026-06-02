"use client";

import { useCallback, useState } from "react";
import { LuArrowBigUp, LuArrowBigDown } from "react-icons/lu";
import { vote } from "@/backend/community/community";

interface VoteButtonsProps {
  postId: string;
  initialUpvotes: number;
  initialDownvotes: number;
  initialUserVote: "UPVOTE" | "DOWNVOTE" | null;
}

export function VoteButtons({ postId, initialUpvotes, initialDownvotes, initialUserVote }: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<"UPVOTE" | "DOWNVOTE" | null>(initialUserVote);
  const [loading, setLoading] = useState(false);

  const handleVote = useCallback(async (type: "UPVOTE" | "DOWNVOTE") => {
    if (loading) return;
    setLoading(true);

    const newType = userVote === type ? null : type;

    const prev = { upvotes, downvotes, userVote };
    if (newType === "UPVOTE") {
      setUpvotes((u) => u + (userVote === "DOWNVOTE" ? 1 : 1));
      if (userVote === "DOWNVOTE") setDownvotes((d) => d - 1);
    } else if (newType === "DOWNVOTE") {
      setDownvotes((d) => d + (userVote === "UPVOTE" ? 1 : 1));
      if (userVote === "UPVOTE") setUpvotes((u) => u - 1);
    } else {
      if (userVote === "UPVOTE") setUpvotes((u) => u - 1);
      if (userVote === "DOWNVOTE") setDownvotes((d) => d - 1);
    }
    setUserVote(newType);

    try {
      const result = await vote(postId, newType);
      setUpvotes(result.upvoteCount);
      setDownvotes(result.downvoteCount);
      setUserVote(result.userVote);
    } catch {
      setUpvotes(prev.upvotes);
      setDownvotes(prev.downvotes);
      setUserVote(prev.userVote);
    } finally {
      setLoading(false);
    }
  }, [postId, userVote, upvotes, downvotes, loading]);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => handleVote("UPVOTE")}
        disabled={loading}
        className={`active:scale-[0.97] transition-transform duration-150 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold border transition-colors ${
          userVote === "UPVOTE"
            ? "bg-(--clr-teal-dim)/15 border-(--clr-teal-dim)/30 text-(--clr-teal-dim)"
            : "border-(--clr-border) text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg)"
        }`}
      >
        <LuArrowBigUp className={`h-4 w-4 ${userVote === "UPVOTE" ? "fill-(--clr-teal-dim)" : ""}`} />
        {upvotes}
      </button>
      <button
        type="button"
        onClick={() => handleVote("DOWNVOTE")}
        disabled={loading}
        className={`active:scale-[0.97] transition-transform duration-150 flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold border transition-colors ${
          userVote === "DOWNVOTE"
            ? "bg-red-500/15 border-red-500/30 text-red-400"
            : "border-(--clr-border) text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg)"
        }`}
      >
        <LuArrowBigDown className={`h-4 w-4 ${userVote === "DOWNVOTE" ? "fill-red-400" : ""}`} />
        {downvotes}
      </button>
    </div>
  );
}

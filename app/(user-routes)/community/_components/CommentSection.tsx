"use client";

import { useState, useCallback } from "react";
import { LuMessageSquare, LuTrash2, LuSend, LuClock } from "react-icons/lu";
import { getComments, createComment, deleteComment } from "@/backend/community/community";
import type { CommentItem } from "@/backend/community/community";

interface CommentSectionProps {
  postId: string;
  initialComments: CommentItem[];
  currentUserId: string;
}

export function CommentSection({ postId, initialComments, currentUserId }: CommentSectionProps) {
  const [comments, setComments] = useState<CommentItem[]>(initialComments);
  const [newContent, setNewContent] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = useCallback(async () => {
    const content = newContent.trim();
    if (!content || isSending) return;
    setIsSending(true);
    try {
      const comment = await createComment(postId, content);
      setComments((prev) => [comment, ...prev]);
      setNewContent("");
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  }, [postId, newContent, isSending]);

  const handleDelete = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (e) {
      console.error(e);
    }
  }, []);

  return (
    <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-(--clr-fg) mb-4">
        <LuMessageSquare className="h-4 w-4" />
        Comments ({comments.length})
      </h3>

      <div className="flex gap-2 mb-5">
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
          placeholder="Write a comment..."
          className="flex-1 rounded-xl border border-(--clr-border) bg-(--clr-surface) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!newContent.trim() || isSending}
          className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-xl border border-(--clr-yellow) bg-(--clr-yellow) px-4 py-2 text-xs font-bold uppercase tracking-wider text-(--clr-charcoal) hover:opacity-90 disabled:opacity-50 transition-all"
        >
          <LuSend className="h-3.5 w-3.5" />
          {isSending ? "..." : "Send"}
        </button>
      </div>

      <div className="space-y-3">
        {comments.length === 0 && (
          <p className="text-sm text-(--clr-fg-dim) text-center py-6">No comments yet. Be the first to comment!</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-(--clr-fg)">
                    {comment.author.businessName || comment.author.name}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-(--clr-fg-dim)">
                    <LuClock className="h-3 w-3" />
                    {getTimeAgo(comment.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-(--clr-fg-muted) whitespace-pre-wrap">{comment.content}</p>
              </div>
              {comment.author.id === currentUserId && (
                <button
                  type="button"
                  onClick={() => handleDelete(comment.id)}
                  className="shrink-0 p-1 rounded-lg text-(--clr-fg-dim) hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <LuTrash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

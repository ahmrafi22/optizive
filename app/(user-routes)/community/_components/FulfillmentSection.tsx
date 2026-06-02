"use client";

import { useState, useCallback } from "react";
import { LuTruck, LuCheck, LuX, LuClock, LuDollarSign } from "react-icons/lu";
import { createFulfillment, updateFulfillmentStatus } from "@/backend/community/community";
import type { FulfillmentItem } from "@/backend/community/community";

interface FulfillmentSectionProps {
  postId: string;
  postAuthorId: string;
  currentUserId: string;
  initialFulfillments: FulfillmentItem[];
  isProcurement: boolean;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ACCEPTED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  REJECTED: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function FulfillmentSection({ postId, postAuthorId, currentUserId, initialFulfillments, isProcurement }: FulfillmentSectionProps) {
  const [fulfillments, setFulfillments] = useState<FulfillmentItem[]>(initialFulfillments);
  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [estimatedDelivery, setEstimatedDelivery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const isOwner = currentUserId === postAuthorId;
  const canFulfill = !isOwner && isProcurement;

  const handleSubmit = useCallback(async () => {
    if (!message.trim() || isSending) return;
    setIsSending(true);
    try {
      const fulfillment = await createFulfillment(postId, {
        message: message.trim(),
        price: price.trim() ? Number(price) : null,
        estimatedDelivery: estimatedDelivery || null,
      });
      setFulfillments((prev) => [fulfillment, ...prev]);
      setMessage("");
      setPrice("");
      setEstimatedDelivery("");
      setShowForm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  }, [postId, message, price, estimatedDelivery, isSending]);

  const handleStatus = useCallback(async (fulfillmentId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await updateFulfillmentStatus(fulfillmentId, status);
      setFulfillments((prev) => prev.map((f) => f.id === fulfillmentId ? { ...f, status } as FulfillmentItem : f));
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!isProcurement && fulfillments.length === 0) return null;

  return (
    <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5">
      <h3 className="flex items-center gap-2 text-sm font-bold text-(--clr-fg) mb-4">
        <LuTruck className="h-4 w-4" />
        {isProcurement ? "Fulfillment Offers" : "Fulfillments"}
      </h3>

      {canFulfill && !showForm && (
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="active:scale-[0.97] transition-transform duration-150 mb-4 inline-flex items-center gap-2 rounded-xl border border-(--clr-yellow) bg-(--clr-yellow) px-4 py-2 text-xs font-bold uppercase tracking-wider text-(--clr-charcoal) hover:opacity-90 transition-all"
        >
          <LuTruck className="h-3.5 w-3.5" />
          Submit Offer
        </button>
      )}

      {canFulfill && showForm && (
        <div className="mb-5 rounded-xl border border-(--clr-border) bg-(--clr-surface) p-4 space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your offer..."
            rows={3}
            className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all resize-none"
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-(--clr-fg-dim) block mb-1">Price (optional)</span>
              <div className="relative">
                <LuDollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--clr-fg-dim)" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) pl-8 pr-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all"
                />
              </div>
            </div>
            <div className="flex-1">
              <span className="text-[10px] font-semibold text-(--clr-fg-dim) block mb-1">Delivery by (optional)</span>
              <div className="relative">
                <LuClock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-(--clr-fg-dim)" />
                <input
                  type="date"
                  value={estimatedDelivery}
                  onChange={(e) => setEstimatedDelivery(e.target.value)}
                  className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) pl-8 pr-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim() || isSending}
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-xl border border-(--clr-yellow) bg-(--clr-yellow) px-4 py-2 text-xs font-bold uppercase tracking-wider text-(--clr-charcoal) hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSending ? "Sending..." : "Submit Offer"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {fulfillments.length === 0 && (
          <p className="text-sm text-(--clr-fg-dim) text-center py-6">No offers yet.</p>
        )}
        {fulfillments.map((f) => (
          <div key={f.id} className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-(--clr-fg)">
                    {f.supplier.businessName || f.supplier.name}
                  </span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusColors[f.status] ?? ""}`}>
                    {f.status}
                  </span>
                </div>
                <p className="text-sm text-(--clr-fg-muted) whitespace-pre-wrap">{f.message}</p>
                <div className="flex gap-4 mt-2 text-[10px] text-(--clr-fg-dim)">
                  {f.price != null && (
                    <span className="flex items-center gap-1">
                      <LuDollarSign className="h-3 w-3" />
                      ৳{f.price.toFixed(2)}
                    </span>
                  )}
                  {f.estimatedDelivery && (
                    <span className="flex items-center gap-1">
                      <LuClock className="h-3 w-3" />
                      By {new Date(f.estimatedDelivery).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              {isOwner && f.status === "PENDING" && (
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleStatus(f.id, "ACCEPTED")}
                    className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/15 transition-colors"
                    title="Accept"
                  >
                    <LuCheck className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatus(f.id, "REJECTED")}
                    className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/15 transition-colors"
                    title="Reject"
                  >
                    <LuX className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

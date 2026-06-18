"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LuPackage,
  LuArrowRight,
  LuCheck,
  LuX,
  LuEye,
  LuSend,
  LuInbox,
  LuRefreshCw,
  LuClock,
  LuCircleCheck,
  LuBan,
} from "react-icons/lu";
import {
  listSentRequests,
  listReceivedRequests,
  ProcurementRequestSummary,
} from "@/backend/procurement/procurement";
import type { ProcurementRequestStatus } from "@/prisma/generated/prisma/client";

const STATUS_STYLES: Record<ProcurementRequestStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "border-amber-500/30 bg-amber-500/10 text-amber-300" },
  APPROVED: { label: "Approved", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" },
  REJECTED: { label: "Rejected", color: "border-rose-500/30 bg-rose-500/10 text-rose-300" },
  CANCELLED: { label: "Cancelled", color: "border-neutral-600/30 bg-neutral-600/10 text-neutral-400" },
};

const CURRENCY = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ProcurementPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"sent" | "received">("received");
  const [sent, setSent] = useState<ProcurementRequestSummary[]>([]);
  const [received, setReceived] = useState<ProcurementRequestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sentData, receivedData] = await Promise.all([
        listSentRequests(),
        listReceivedRequests(),
      ]);
      setSent(sentData);
      setReceived(receivedData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const activeList = tab === "sent" ? sent : received;

  return (
    <div className="mx-auto w-full max-w-5xl pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-(--clr-fg)">Procurement Requests</h1>
        <p className="text-sm text-(--clr-fg-muted) mt-1">Manage your procurement requests with suppliers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 rounded-2xl border border-(--clr-border) p-1 w-fit">
        <button
          type="button"
          onClick={() => setTab("received")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "received"
              ? "bg-(--clr-teal-dim) text-white shadow-sm"
              : "text-(--clr-fg-muted) hover:text-(--clr-fg)"
          }`}
        >
          <LuInbox className="h-4 w-4" />
          Received
          {received.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500/20 px-1.5 text-[10px] font-bold text-rose-400">
              {received.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("sent")}
          className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "sent"
              ? "bg-(--clr-teal-dim) text-white shadow-sm"
              : "text-(--clr-fg-muted) hover:text-(--clr-fg)"
          }`}
        >
          <LuSend className="h-4 w-4" />
          Sent
          {sent.filter((r) => r.status === "PENDING").length > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500/20 px-1.5 text-[10px] font-bold text-amber-400">
              {sent.filter((r) => r.status === "PENDING").length}
            </span>
          )}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-neutral-800/30 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && activeList.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-(--clr-border) bg-(--clr-surface2)/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface)">
            <LuPackage className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-300">
            No {tab} requests
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            {tab === "sent"
              ? "You haven't sent any procurement requests yet."
              : "No one has sent you a procurement request yet."}
          </p>
        </div>
      )}

      {/* List */}
      {!loading && activeList.length > 0 && (
        <div className="space-y-3">
          {activeList.map((req) => {
            const style = STATUS_STYLES[req.status];
            return (
              <button
                key={req.id}
                type="button"
                onClick={() => router.push(`/procurement/${req.id}`)}
                className="w-full bento-card flex items-center gap-4 p-4 text-left group cursor-pointer"
              >
                <Link
                  href={`/profile/${req.counterpartyId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-(--clr-border) bg-(--clr-surface2) overflow-hidden hover:border-(--clr-border-hover) transition-all"
                >
                  {req.counterpartyImage ? (
                    <img src={req.counterpartyImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-(--clr-fg-muted)">
                      {(req.counterpartyBusinessName || req.counterpartyName).charAt(0)}
                    </span>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/profile/${req.counterpartyId}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-sm font-semibold text-(--clr-fg) truncate hover:underline underline-offset-2"
                    >
                      {req.counterpartyBusinessName || req.counterpartyName}
                    </Link>
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${style.color}`}>
                      {req.status === "PENDING" && <LuClock className="h-3 w-3" />}
                      {req.status === "APPROVED" && <LuCircleCheck className="h-3 w-3" />}
                      {req.status === "REJECTED" && <LuBan className="h-3 w-3" />}
                      {style.label}
                    </span>
                  </div>
                  <p className="text-xs text-(--clr-fg-muted) mt-0.5">
                    {req.itemCount} item{req.itemCount > 1 ? "s" : ""} &middot; {CURRENCY.format(req.totalAmount)} &middot; {timeAgo(req.createdAt)}
                  </p>
                  {req.notes && (
                    <p className="text-xs text-(--clr-fg-dim) mt-1 line-clamp-1">{req.notes}</p>
                  )}
                </div>

                <LuArrowRight className="h-4 w-4 text-(--clr-fg-muted) group-hover:text-(--clr-fg) transition-colors shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

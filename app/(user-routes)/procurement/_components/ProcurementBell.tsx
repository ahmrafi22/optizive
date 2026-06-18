"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LuBell, LuPackage, LuArrowRight, LuClock, LuLoader } from "react-icons/lu";
import { getProcurementCounts, listReceivedRequests, listSentRequests } from "@/backend/procurement/procurement";
import type { ProcurementRequestSummary } from "@/backend/procurement/procurement";

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
  return `${days}d ago`;
}

export function ProcurementBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [requests, setRequests] = useState<ProcurementRequestSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const counts = await getProcurementCounts();
        setCount(counts.sentPending + counts.receivedPending);
      } catch {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      setLoading(true);
      Promise.all([
        listReceivedRequests(3),
        listSentRequests(3),
      ]).then(([received, sent]) => {
        const combined = [...received, ...sent]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);
        setRequests(combined);
      }).finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-(--clr-fg) transition-colors hover:border-(--clr-border-hover)"
        aria-label="Procurement requests"
      >
        <LuBell className="h-4 w-4" />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 rounded-2xl border border-(--clr-border) bg-(--clr-surface) shadow-2xl shadow-black/30 z-[70] overflow-hidden">
          <div className="p-4 border-b border-(--clr-border)">
            <h3 className="text-sm font-bold text-(--clr-fg)">Procurement</h3>
            <p className="text-xs text-(--clr-fg-muted) mt-0.5">{count} pending request{count !== 1 ? "s" : ""}</p>
          </div>

          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <LuLoader className="h-5 w-5 animate-spin text-(--clr-fg-muted)" />
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface2)">
                  <LuPackage className="h-5 w-5 text-(--clr-fg-dim)" />
                </div>
                <p className="mt-2 text-xs text-(--clr-fg-muted)">No recent requests</p>
              </div>
            ) : (
              requests.map((req) => (
                <button
                  key={req.id}
                  type="button"
                  onClick={() => { setOpen(false); router.push(`/procurement/${req.id}`); }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-(--clr-surface2)/50 transition-colors text-left"
                >
                  <Link
                    href={`/profile/${req.counterpartyId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface2) hover:border-(--clr-border-hover) transition-all overflow-hidden"
                  >
                    {req.counterpartyImage ? (
                      <img src={req.counterpartyImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-(--clr-fg-muted)">
                        {(req.counterpartyBusinessName || req.counterpartyName).charAt(0)}
                      </span>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-(--clr-fg) truncate">
                      {req.counterpartyBusinessName || req.counterpartyName}
                    </p>
                    <p className="text-[10px] text-(--clr-fg-muted)">
                      {req.itemCount} item{req.itemCount > 1 ? "s" : ""} &middot; {CURRENCY.format(req.totalAmount)} &middot; {timeAgo(req.createdAt)}
                    </p>
                  </div>
                  {req.status === "PENDING" && (
                    <LuClock className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>

          <div className="border-t border-(--clr-border) p-3">
            <button
              type="button"
              onClick={() => { setOpen(false); router.push("/procurement"); }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--clr-surface2) py-2.5 text-xs font-semibold text-(--clr-fg) hover:brightness-110 transition-all"
            >
              View All
              <LuArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

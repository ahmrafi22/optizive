"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LuPackage,
  LuArrowLeft,
  LuCheck,
  LuX,
  LuClock,
  LuCircleCheck,
  LuBan,
  LuFileText,
  LuShoppingCart,
  LuLoader,
  LuExternalLink,
} from "react-icons/lu";
import {
  getProcurementRequestDetail,
  acceptProcurementRequest,
  rejectProcurementRequest,
  ProcurementRequestDetail,
} from "@/backend/procurement/procurement";
import type { ProcurementRequestStatus } from "@/prisma/generated/prisma/client";

const STATUS_STYLES: Record<ProcurementRequestStatus, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  PENDING: { label: "Pending", color: "border-amber-500/30 bg-amber-500/10 text-amber-300", icon: LuClock },
  APPROVED: { label: "Approved", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: LuCircleCheck },
  REJECTED: { label: "Rejected", color: "border-rose-500/30 bg-rose-500/10 text-rose-300", icon: LuBan },
  CANCELLED: { label: "Cancelled", color: "border-neutral-600/30 bg-neutral-600/10 text-neutral-400", icon: LuX },
};

const CURRENCY = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ProcurementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [request, setRequest] = useState<ProcurementRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const result = await getProcurementRequestDetail(id);
        if (!result) {
          setError("Request not found.");
          return;
        }
        setRequest(result);
      } catch {
        setError("Failed to load request.");
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [id]);

  async function handleAccept() {
    if (!confirm("Accept this procurement request? This will create a sale and update inventory.")) return;
    setActing(true);
    try {
      const result = await acceptProcurementRequest(id);
      if (result) setRequest(result);
    } finally {
      setActing(false);
    }
  }

  async function handleReject() {
    if (!confirm("Reject this procurement request?")) return;
    setActing(true);
    try {
      const result = await rejectProcurementRequest(id);
      if (result) setRequest(result);
    } finally {
      setActing(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-3xl pb-16">
        <div className="space-y-5">
          <div className="h-8 w-48 bg-neutral-800/30 rounded animate-pulse" />
          <div className="h-6 w-32 bg-neutral-800/30 rounded animate-pulse" />
          <div className="h-48 bg-neutral-800/30 rounded-2xl animate-pulse" />
          <div className="h-32 bg-neutral-800/30 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="mx-auto w-full max-w-3xl pb-16">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
            <LuPackage className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-200">{error ?? "Request not found"}</h3>
          <button
            type="button"
            onClick={() => router.push("/procurement")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-neutral-200 transition-all"
          >
            <LuArrowLeft className="h-4 w-4" />
            Back to Procurement
          </button>
        </div>
      </div>
    );
  }

  const style = STATUS_STYLES[request.status];
  const StatusIcon = style.icon;
  const isPending = request.status === "PENDING";
  const isReceived = request.supplierId === request.supplierId; // Will be compared to session - but for now check if viewer is supplier

  return (
    <div className="mx-auto w-full max-w-3xl pb-16">
      {/* Back */}
      <button
        type="button"
        onClick={() => router.push("/procurement")}
        className="inline-flex items-center gap-2 text-sm text-(--clr-fg-muted) hover:text-(--clr-fg) transition-colors mb-6"
      >
        <LuArrowLeft className="h-4 w-4" />
        Back to Procurement
      </button>

      {/* Header */}
      <div className="bento-card p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-xl font-bold text-(--clr-fg)">Procurement Request</h1>
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${style.color}`}>
                <StatusIcon className="h-3.5 w-3.5" />
                {style.label}
              </span>
            </div>
            <p className="text-sm text-(--clr-fg-muted)">Created {formatDate(request.createdAt)}</p>
          </div>
        </div>

        {/* Parties */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <Link href={`/profile/${request.buyerId}`} className="rounded-2xl border border-(--clr-border) p-4 hover:border-(--clr-border-hover) transition-all block">
            <p className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted) mb-2">Buyer</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface2) overflow-hidden">
                {request.buyerImage ? (
                  <img src={request.buyerImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-(--clr-fg-muted)">{request.buyerName.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <p className="text-sm font-semibold text-(--clr-fg) truncate">{request.buyerBusinessName || request.buyerName}</p>
                <LuExternalLink className="h-3 w-3 text-(--clr-fg-dim) shrink-0" />
              </div>
            </div>
          </Link>
          <Link href={`/profile/${request.supplierId}`} className="rounded-2xl border border-(--clr-border) p-4 hover:border-(--clr-border-hover) transition-all block">
            <p className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted) mb-2">Supplier</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-(--clr-border) bg-(--clr-surface2) overflow-hidden">
                {request.supplierImage ? (
                  <img src={request.supplierImage} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-(--clr-fg-muted)">{request.supplierName.charAt(0)}</span>
                )}
              </div>
              <div className="min-w-0 flex items-center gap-1.5">
                <p className="text-sm font-semibold text-(--clr-fg) truncate">{request.supplierBusinessName || request.supplierName}</p>
                <LuExternalLink className="h-3 w-3 text-(--clr-fg-dim) shrink-0" />
              </div>
            </div>
          </Link>
        </div>

        {/* Items */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-(--clr-fg) mb-3">Items ({request.items.length})</h3>
          <div className="space-y-2">
            {request.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl border border-(--clr-border) px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-(--clr-fg) truncate">{item.productName}</p>
                  <p className="text-xs text-(--clr-fg-muted)">{CURRENCY.format(item.unitPrice)} each</p>
                </div>
                <div className="text-right ml-4">
                  <p className="text-sm text-(--clr-fg-muted)">x{item.quantity}</p>
                  <p className="text-sm font-semibold text-(--clr-fg)">{CURRENCY.format(item.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-(--clr-border) pt-3">
            <span className="text-sm font-semibold text-(--clr-fg)">Total</span>
            <span className="text-lg font-bold text-(--clr-fg)">{CURRENCY.format(request.totalAmount)}</span>
          </div>
        </div>

        {/* Notes */}
        {request.notes && (
          <div className="mt-6 rounded-2xl border border-(--clr-border) p-4">
            <p className="text-[10px] uppercase tracking-widest text-(--clr-fg-muted) mb-2">Notes</p>
            <p className="text-sm text-(--clr-fg)">{request.notes}</p>
          </div>
        )}

        {/* Sale link */}
        {request.saleId && (
          <div className="mt-6">
            <button
              type="button"
              onClick={() => router.push(`/sales/${request.saleId}`)}
              className="inline-flex items-center gap-2 rounded-full bg-(--clr-teal-dim)/10 border border-(--clr-teal-dim)/30 px-4 py-2 text-sm font-medium text-(--clr-teal-dim) hover:brightness-110 transition-all"
            >
              <LuShoppingCart className="h-4 w-4" />
              View Sale #{request.saleInvoiceNumber}
            </button>
          </div>
        )}

        {/* Actions */}
        {isPending && (
          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={acting}
              className="flex-1 rounded-full border border-rose-500/30 bg-rose-500/10 py-3 text-sm font-semibold text-rose-300 hover:brightness-110 transition-all disabled:opacity-50"
            >
              {acting ? <LuLoader className="h-4 w-4 animate-spin mx-auto" /> : "Reject"}
            </button>
            <button
              type="button"
              onClick={handleAccept}
              disabled={acting}
              className="flex-1 rounded-full bg-(--clr-teal-dim) py-3 text-sm font-semibold text-white hover:brightness-110 transition-all disabled:opacity-50"
            >
              {acting ? <LuLoader className="h-4 w-4 animate-spin mx-auto" /> : "Accept & Create Sale"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

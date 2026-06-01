"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { SaleDetail, OrderStatus } from "./types";
import { updateSalePayment, updateSaleOrderStatus } from "@/backend/sales/sales";
import PaymentBadge from "./PaymentBadge";
import BuyerTypeBadge from "./BuyerTypeBadge";
import OrderStatusBadge from "./OrderStatusBadge";
import { LuArrowLeft, LuPrinter, LuCheck, LuLoader, LuMapPin, LuCalendar, LuFileText } from "react-icons/lu";
import NumberFlow from "@number-flow/react";

interface Props {
  sale: SaleDetail;
}

const ORDER_STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default function SaleDetailView({ sale }: Props) {
  const router = useRouter();
  const [paidAmount, setPaidAmount] = useState(sale.paidAmount);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const dueAmount = sale.finalAmount - paidAmount;

  async function handleUpdatePayment() {
    setUpdatingPayment(true);
    await updateSalePayment(sale.id, { paidAmount });
    setUpdatingPayment(false);
    router.refresh();
  }

  async function handleStatusChange(status: OrderStatus) {
    setUpdatingStatus(true);
    await updateSaleOrderStatus(sale.id, status);
    setUpdatingStatus(false);
    router.refresh();
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);

  const createdAt = new Date(sale.createdAt);
  const deliveryDate = sale.deliveryDate ? new Date(sale.deliveryDate) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="rounded-xl border border-(--clr-border) p-2.5 text-(--clr-fg-muted) hover:bg-(--clr-surface2) hover:text-(--clr-fg) transition-all">
            <LuArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-naston text-(--clr-fg)">{sale.invoiceNumber}</h1>
              <BuyerTypeBadge type={sale.buyerType} />
              <PaymentBadge status={sale.paymentStatus} />
              <OrderStatusBadge status={sale.orderStatus} />
            </div>
            <p className="text-sm text-(--clr-fg-muted) mt-0.5">
              Created {createdAt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl border border-(--clr-border) px-4 py-2.5 text-sm font-medium text-(--clr-fg) hover:bg-(--clr-surface2) transition-all">
            <LuPrinter className="h-4 w-4" /> Print
          </button>

        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Left: Customer Info + Items */}
        <div className="xl:col-span-2 space-y-6">
          {/* Customer Card */}
          <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Customer Info</h3>
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-(--clr-teal-dim)/10 text-xl font-bold text-(--clr-teal-dim)">
                {sale.customerName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="text-lg font-semibold text-(--clr-fg)">{sale.customerName || "Unknown Customer"}</p>
                {sale.customerPhone && (
                  <p className="text-sm text-(--clr-fg-muted)">{sale.customerPhone}</p>
                )}
                {sale.buyerBusinessName && (
                  <p className="text-xs text-(--clr-fg-muted)">Business: {sale.buyerBusinessName}</p>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) overflow-hidden">
            <div className="border-b border-(--clr-border) px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">
                Items ({sale.items.length})
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--clr-border) bg-(--clr-surface2)/50">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase text-(--clr-fg-muted)">Product</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-(--clr-fg-muted)">Qty</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-(--clr-fg-muted)">Unit Price</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase text-(--clr-fg-muted)">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--clr-border)">
                  {sale.items.map((item) => (
                    <tr key={item.id} className="hover:bg-(--clr-surface2)/30 transition-colors">
                      <td className="px-5 py-3">
                        <Link href={`/inventory/${item.productId}`} className="flex items-center gap-3 group">
                          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-(--clr-surface2)">
                            {item.productImage ? (
                              <img src={item.productImage} alt={item.productName} className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-bold text-(--clr-fg-muted)">
                                {item.productName.charAt(0)}
                              </div>
                            )}
                          </div>
                          <span className="font-medium text-(--clr-fg) group-hover:text-(--clr-teal-dim) transition-colors">
                            {item.productName}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-right text-(--clr-fg)">{item.quantity}</td>
                      <td className="px-5 py-3 text-right text-(--clr-fg-muted)">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-5 py-3 text-right font-semibold text-(--clr-fg)">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-(--clr-border) bg-(--clr-surface2)/30">
                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-medium text-(--clr-fg-muted)">Subtotal</td>
                    <td className="px-5 py-3 text-right font-semibold text-(--clr-fg)">{formatCurrency(sale.totalAmount)}</td>
                  </tr>
                  {sale.discount > 0 && (
                    <tr>
                      <td colSpan={3} className="px-5 py-3 text-right text-sm font-medium text-(--clr-fg-muted)">Discount</td>
                      <td className="px-5 py-3 text-right font-semibold text-rose-500">-{formatCurrency(sale.discount)}</td>
                    </tr>
                  )}
                  <tr className="bg-(--clr-teal-dim)/5">
                    <td colSpan={3} className="px-5 py-3 text-right text-sm font-bold text-(--clr-fg)">Final Amount</td>
                    <td className="px-5 py-3 text-right font-bold text-(--clr-teal-dim) text-lg">{formatCurrency(sale.finalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Payment Card */}
          <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Payment</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-(--clr-fg-muted)">Total</span>
                <span className="font-semibold text-(--clr-fg)">{formatCurrency(sale.finalAmount)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-(--clr-fg-muted)">Paid</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(paidAmount)}</span>
              </div>
              <div className="flex justify-between text-sm border-t border-(--clr-border) pt-3">
                <span className="font-medium text-(--clr-fg)">Due</span>
                <span className={`font-bold ${dueAmount <= 0 ? "text-emerald-600" : "text-rose-600 dark:text-rose-400"}`}>
                  {formatCurrency(dueAmount)}
                </span>
              </div>

              {dueAmount > 0 && (
                <div className="mt-4 space-y-2 border-t border-(--clr-border) pt-4">
                  <label className="text-xs font-medium text-(--clr-fg-muted)">Update Payment</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={0}
                      value={paidAmount}
                      onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
                      className="flex-1 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                    />
                    <button
                      onClick={handleUpdatePayment}
                      disabled={updatingPayment || paidAmount === sale.paidAmount}
                      className="flex items-center gap-1 rounded-lg bg-(--clr-teal-dim) px-3 py-2 text-xs font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all disabled:opacity-50"
                    >
                      {updatingPayment ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuCheck className="h-3.5 w-3.5" />}
                      Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Order Status Card */}
          <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Order Status</h3>
            <div className="space-y-1.5">
              {ORDER_STATUS_FLOW.map((status) => {
                const currentIdx = ORDER_STATUS_FLOW.indexOf(sale.orderStatus as OrderStatus);
                const statusIdx = ORDER_STATUS_FLOW.indexOf(status);
                const isActive = sale.orderStatus === status;
                const isPast = statusIdx <= currentIdx;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updatingStatus || isActive}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                      isActive
                        ? "bg-(--clr-teal-dim)/10 text-(--clr-teal-dim) font-semibold"
                        : isPast
                        ? "text-(--clr-fg-muted) hover:bg-(--clr-surface2)"
                        : "text-(--clr-fg-muted)/50 hover:bg-(--clr-surface2)"
                    } disabled:cursor-not-allowed`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                      isActive ? "border-(--clr-teal-dim) bg-(--clr-teal-dim) text-white" : isPast ? "border-emerald-400 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30" : "border-(--clr-border)"
                    }`}>
                      {isPast ? <LuCheck className="h-3 w-3" /> : statusIdx + 1}
                    </div>
                    {status.charAt(0) + status.slice(1).toLowerCase()}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delivery Card */}
          {(sale.deliveryAddress || deliveryDate) && (
            <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Delivery</h3>
              <div className="space-y-3">
                {sale.deliveryAddress && (
                  <div className="flex items-start gap-3">
                    <LuMapPin className="mt-0.5 h-4 w-4 shrink-0 text-(--clr-fg-muted)" />
                    <p className="text-sm text-(--clr-fg)">{sale.deliveryAddress}</p>
                  </div>
                )}
                {deliveryDate && (
                  <div className="flex items-center gap-3">
                    <LuCalendar className="h-4 w-4 shrink-0 text-(--clr-fg-muted)" />
                    <p className="text-sm text-(--clr-fg)">
                      {deliveryDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes Card */}
          {sale.notes && (
            <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
              <div className="flex items-start gap-3">
                <LuFileText className="mt-0.5 h-4 w-4 shrink-0 text-(--clr-fg-muted)" />
                <p className="text-sm text-(--clr-fg) whitespace-pre-wrap">{sale.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

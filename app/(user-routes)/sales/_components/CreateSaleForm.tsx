"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSale, searchPlatformUsers, getOwnerProducts } from "@/backend/sales/sales";
import type { BuyerType, PlatformUser, OwnerProduct } from "./types";
import { LuSearch, LuPlus, LuX, LuTrash2, LuCheck, LuUser, LuBuilding2, LuLoader } from "react-icons/lu";

export default function CreateSaleForm() {
  const router = useRouter();
  const [buyerType, setBuyerType] = useState<BuyerType>("EXTERNAL");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedBuyer, setSelectedBuyer] = useState<PlatformUser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PlatformUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [products, setProducts] = useState<OwnerProduct[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [items, setItems] = useState<{ productId: string; productName: string; quantity: number; unitPrice: number }[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paidAmount, setPaidAmount] = useState(0);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProducts = useCallback(async () => {
    if (!productsLoaded) {
      const result = await getOwnerProducts();
      setProducts(result);
      setProductsLoaded(true);
    }
  }, [productsLoaded]);

  const handleSearch = useCallback(async (q: string) => {
    setSearchQuery(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    searchTimer.current = setTimeout(async () => {
      const result = await searchPlatformUsers(q);
      setSearchResults(result);
      setSearching(false);
    }, 300);
  }, []);

  function addItem() {
    loadProducts();
    setItems((prev) => [
      ...prev,
      { productId: "", productName: "", quantity: 1, unitPrice: 0 },
    ]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: string, value: string | number) {
    setItems((prev) => {
      const next = [...prev];
      if (field === "productId") {
        const product = products.find((p) => p.id === String(value));
        next[idx] = {
          ...next[idx],
          productId: String(value),
          productName: product?.name || "",
          unitPrice: product?.sellingPrice || 0,
        };
      } else if (field === "quantity") {
        next[idx] = { ...next[idx], quantity: Number(value) || 0 };
      } else if (field === "unitPrice") {
        next[idx] = { ...next[idx], unitPrice: Number(value) || 0 };
      }
      return next;
    });
  }

  const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const finalAmount = totalAmount - discount;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (items.length === 0) { setError("Add at least one product"); return; }
    if (items.some((i) => !i.productId)) { setError("Select a product for all items"); return; }
    if (discount > totalAmount) { setError("Discount cannot exceed total"); return; }
    if (paidAmount > finalAmount) { setError("Paid amount cannot exceed final amount"); return; }

    setSubmitting(true);
    try {
      const sale = await createSale({
        customerName: buyerType === "EXTERNAL" ? customerName : undefined,
        customerPhone: customerPhone || undefined,
        buyerType,
        buyerId: selectedBuyer?.id,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount: discount || 0,
        paidAmount: paidAmount || 0,
        deliveryAddress: deliveryAddress || undefined,
        notes: notes || undefined,
      });

      if (sale) {
        router.push(`/sales/${sale.id}`);
      } else {
        setError("Failed to create sale");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat("en-BD", { style: "currency", currency: "BDT", maximumFractionDigits: 0 }).format(v);

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Buyer Type Selection */}
      <section className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Buyer Type</h2>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setBuyerType("EXTERNAL"); setSelectedBuyer(null); }}
            className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              buyerType === "EXTERNAL"
                ? "border-(--clr-teal-dim) bg-(--clr-teal-dim)/5"
                : "border-(--clr-border) bg-(--clr-surface2) hover:border-(--clr-fg-muted)"
            }`}
          >
            <div className={`rounded-lg p-2 ${buyerType === "EXTERNAL" ? "bg-(--clr-teal-dim) text-white" : "bg-(--clr-surface) text-(--clr-fg-muted)"}`}>
              <LuUser className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-(--clr-fg)">External Customer</p>
              <p className="text-xs text-(--clr-fg-muted)">Buyer not on this platform</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setBuyerType("PLATFORM_USER")}
            className={`flex flex-1 items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
              buyerType === "PLATFORM_USER"
                ? "border-(--clr-teal-dim) bg-(--clr-teal-dim)/5"
                : "border-(--clr-border) bg-(--clr-surface2) hover:border-(--clr-fg-muted)"
            }`}
          >
            <div className={`rounded-lg p-2 ${buyerType === "PLATFORM_USER" ? "bg-(--clr-teal-dim) text-white" : "bg-(--clr-surface) text-(--clr-fg-muted)"}`}>
              <LuBuilding2 className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-(--clr-fg)">Platform User</p>
              <p className="text-xs text-(--clr-fg-muted)">Buyer registered on this platform</p>
            </div>
          </button>
        </div>
      </section>

      {/* Buyer Info */}
      <section className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--clr-fg-muted)">
          {buyerType === "EXTERNAL" ? "Customer Details" : "Select Platform Buyer"}
        </h2>

        {buyerType === "EXTERNAL" ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. ABC Traders"
                className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Phone Number</label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 017XXXXXXXX"
                className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
              />
            </div>
          </div>
        ) : (
          <div className="relative">
            {selectedBuyer ? (
              <div className="flex items-center justify-between rounded-xl border border-(--clr-teal-dim) bg-(--clr-teal-dim)/5 p-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-(--clr-teal-dim)/10 text-(--clr-teal-dim) text-sm font-bold">
                    {selectedBuyer.businessName?.charAt(0) || selectedBuyer.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-(--clr-fg)">{selectedBuyer.businessName || selectedBuyer.name}</p>
                    <p className="text-xs text-(--clr-fg-muted)">{selectedBuyer.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setSelectedBuyer(null); setSearchQuery(""); setShowUserSearch(false); }}
                  className="rounded-lg p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-rose-500 transition-all"
                ><LuX className="h-4 w-4" /></button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => { handleSearch(e.target.value); setShowUserSearch(true); }}
                    onFocus={() => searchQuery.length >= 2 && setShowUserSearch(true)}
                    placeholder="Search platform users by name, business, or phone..."
                    className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) py-2.5 pl-10 pr-4 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                  />
                  {searching && <LuLoader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-(--clr-fg-muted)" />}
                </div>
                {showUserSearch && searchResults.length > 0 && (
                  <div className="mt-2 rounded-xl border border-(--clr-border) bg-(--clr-surface) shadow-lg overflow-hidden">
                    {searchResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setSelectedBuyer(u); setShowUserSearch(false); }}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-(--clr-surface2) transition-colors border-b border-(--clr-border) last:border-0"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-(--clr-surface2) text-sm font-bold text-(--clr-fg-muted)">
                          {u.businessName?.charAt(0) || u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-(--clr-fg)">{u.businessName || u.name}</p>
                          <p className="text-xs text-(--clr-fg-muted)">{u.phone || "No phone"}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Products / Items */}
      <section className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Products</h2>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1.5 rounded-lg bg-(--clr-teal-dim) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all"
          ><LuPlus className="h-3.5 w-3.5" /> Add Item</button>
        </div>

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-(--clr-border) p-8 text-center">
            <p className="text-sm text-(--clr-fg-muted)">No products added yet. Click "Add Item" to start.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="flex flex-wrap items-end gap-3 rounded-xl border border-(--clr-border) bg-(--clr-surface2)/50 p-3">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-1 block text-xs font-medium text-(--clr-fg-muted)">Product</label>
                  <select
                    value={item.productId}
                    onChange={(e) => updateItem(idx, "productId", e.target.value)}
                    className="w-full rounded-lg border border-(--clr-border) bg-(--clr-surface) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                  >
                    <option value="">Select product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatCurrency(p.sellingPrice)} ({p.quantity} {p.unit})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-24">
                  <label className="mb-1 block text-xs font-medium text-(--clr-fg-muted)">Qty</label>
                  <input type="number" min={0} step={1} value={item.quantity}
                    onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                    className="w-full rounded-lg border border-(--clr-border) bg-(--clr-surface) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                  />
                </div>
                <div className="w-28">
                  <label className="mb-1 block text-xs font-medium text-(--clr-fg-muted)">Unit Price</label>
                  <input type="number" min={0} step={0.01} value={item.unitPrice}
                    onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                    className="w-full rounded-lg border border-(--clr-border) bg-(--clr-surface) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                  />
                </div>
                <div className="w-24 pb-2">
                  <p className="text-xs text-(--clr-fg-muted) mb-1">Total</p>
                  <p className="text-sm font-semibold text-(--clr-fg)">{formatCurrency(item.quantity * item.unitPrice)}</p>
                </div>
                <button type="button" onClick={() => removeItem(idx)}
                  className="mb-1 rounded-lg p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface) hover:text-rose-500 transition-all"
                ><LuTrash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-4 border-t border-(--clr-border) pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-(--clr-fg-muted)">Subtotal</span>
                <span className="font-medium text-(--clr-fg)">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-(--clr-fg-muted)">Discount</span>
                <input type="number" min={0} value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                  className="w-32 rounded-lg border border-(--clr-border) bg-(--clr-surface2) px-3 py-1.5 text-right text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                />
              </div>
              <div className="flex justify-between border-t border-(--clr-border) pt-2 text-base font-bold">
                <span className="text-(--clr-fg)">Final Amount</span>
                <span className="text-(--clr-teal-dim)">{formatCurrency(finalAmount)}</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Payment */}
      <section className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Payment</h2>
        <div className="max-w-xs">
          <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Amount Paid</label>
          <input type="number" min={0} value={paidAmount}
            onChange={(e) => setPaidAmount(Number(e.target.value) || 0)}
            className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
          />
          <p className="mt-1.5 text-xs text-(--clr-fg-muted)">
            {paidAmount >= finalAmount ? "Fully paid" : `Due: ${formatCurrency(finalAmount - paidAmount)}`}
          </p>
        </div>
      </section>

      {/* Delivery & Notes */}
      <section className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Delivery & Notes</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Delivery Address</label>
            <textarea
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              rows={2}
              placeholder="Optional delivery address..."
              className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50 resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Any additional notes..."
              className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50 resize-none"
            />
          </div>
        </div>
      </section>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3">
        <button type="button" onClick={() => router.back()}
          className="rounded-xl border border-(--clr-border) px-6 py-2.5 text-sm font-medium text-(--clr-fg) hover:bg-(--clr-surface2) transition-all"
        >Cancel</button>
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-(--clr-teal-dim) px-6 py-2.5 text-sm font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all disabled:opacity-50"
        >
          {submitting && <LuLoader className="h-4 w-4 animate-spin" />}
          {submitting ? "Creating..." : "Create Sale"}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { LuPackage, LuArrowLeft, LuShoppingCart } from "react-icons/lu";
import { getSupplierProfile } from "@/backend/supplier-recommender/supplier-recommender";
import type { SupplierDetail } from "@/backend/supplier-recommender/types";
import { SupplierHeader } from "../_components/SupplierHeader";
import { SupplierCatalog } from "../_components/SupplierCatalog";
import { RequestProcurementDialog } from "@/app/(user-routes)/procurement/_components/RequestProcurementDialog";

export default function SupplierDetailPage() {
  const { supplierId } = useParams<{ supplierId: string }>();
  const router = useRouter();
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);

  useEffect(() => {
    async function fetchSupplier() {
      setLoading(true);
      setError(null);
      try {
        const result = await getSupplierProfile(supplierId);
        if (!result) {
          setError("Supplier not found or no longer active.");
          return;
        }
        setSupplier(result);
      } catch (err) {
        setError((err as Error).message ?? "Failed to load supplier.");
      } finally {
        setLoading(false);
      }
    }
    fetchSupplier();
  }, [supplierId]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl pb-16">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-72 lg:shrink-0 space-y-5">
            <div className="aspect-square rounded-3xl bg-neutral-800/50 animate-pulse" />
            <div className="h-6 w-3/4 bg-neutral-800/50 rounded animate-pulse mx-auto" />
            <div className="h-4 w-1/2 bg-neutral-800/50 rounded animate-pulse mx-auto" />
          </div>
          <div className="flex-1 space-y-5">
            <div className="flex gap-2">
              <div className="h-6 w-20 bg-neutral-800/50 rounded-full animate-pulse" />
              <div className="h-6 w-16 bg-neutral-800/50 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-24 bg-neutral-800/50 rounded-2xl animate-pulse" />
              <div className="h-24 bg-neutral-800/50 rounded-2xl animate-pulse" />
              <div className="h-24 bg-neutral-800/50 rounded-2xl animate-pulse" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="h-64 bg-neutral-800/50 rounded-2xl animate-pulse" />
              <div className="h-64 bg-neutral-800/50 rounded-2xl animate-pulse" />
              <div className="h-64 bg-neutral-800/50 rounded-2xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="flex flex-col items-center justify-center rounded-3xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-800 bg-neutral-900">
            <LuPackage className="h-6 w-6 text-neutral-500" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-neutral-200">{error ?? "Supplier not found"}</h3>
          <button
            type="button"
            onClick={() => router.push("/suppliers")}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-neutral-800 bg-neutral-900 px-6 py-2.5 text-sm font-medium text-neutral-400 hover:text-neutral-200 hover:border-neutral-700 transition-all"
          >
            <LuArrowLeft className="h-4 w-4" />
            Back to Suppliers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl pb-16">
      <SupplierHeader supplier={supplier} />

      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-base uppercase tracking-widest text-white font-medium">Product Catalog</h2>
          <span className="rounded-full border border-neutral-800 bg-neutral-900 px-2.5 py-0.5 text-[11px] text-neutral-400">
            {supplier.products.length} items
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowRequestDialog(true)}
          className="inline-flex items-center gap-2 rounded-full bg-(--clr-teal-dim) px-5 py-2.5 text-sm font-semibold text-white hover:brightness-110 transition-all"
        >
          <LuShoppingCart className="h-4 w-4" />
          Request Procurement
        </button>
      </div>
      <div className="mt-4">
        <SupplierCatalog products={supplier.products} supplierId={supplierId} />
      </div>

      <RequestProcurementDialog
        open={showRequestDialog}
        onClose={() => setShowRequestDialog(false)}
        supplierId={supplierId}
        supplierName={supplier.businessName || supplier.name}
        products={supplier.products}
      />
    </div>
  );
}

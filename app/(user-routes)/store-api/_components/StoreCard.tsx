"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { StoreInfo } from "@/backend/store/store";
import { acceptTerms, toggleStoreStatus, regenerateApiKey, deleteStore } from "@/backend/store/store";
import { LuStore, LuCheck, LuX, LuCopy, LuRefreshCw, LuTrash2, LuEye, LuEyeOff, LuLoader, LuBook } from "react-icons/lu";
import StoreDocsView from "./StoreDocsView";

export default function StoreCard({ store, businessSlug, onUpdate }: { store: StoreInfo; businessSlug: string; onUpdate: () => void }) {
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState("");
  const [showDocs, setShowDocs] = useState(false);

  async function handleAcceptTerms() {
    setLoading("terms");
    await acceptTerms(store.id);
    setLoading("");
    onUpdate();
  }

  async function handleToggle() {
    setLoading("toggle");
    await toggleStoreStatus(store.id, !store.isActive);
    setLoading("");
    onUpdate();
  }

  async function handleRegenKey() {
    if (!confirm("Regenerating the API key will break existing integrations. Continue?")) return;
    setLoading("regen");
    const result = await regenerateApiKey(store.id);
    if (result.apiKey) {
      store.apiKey = result.apiKey;
    }
    setLoading("");
    onUpdate();
  }

  async function handleDelete() {
    if (!confirm(`Delete "${store.name}" permanently?`)) return;
    setLoading("delete");
    await deleteStore(store.id);
    setLoading("");
    onUpdate();
  }

  async function copyKey() {
    try {
      await navigator.clipboard.writeText(store.apiKey);
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-(--clr-border) bg-(--clr-surface) p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`rounded-xl p-2.5 ${store.isActive ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-(--clr-surface2) text-(--clr-fg-muted)"}`}>
            <LuStore className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-(--clr-fg)">{store.name}</h3>
            <p className="text-xs text-(--clr-fg-muted)">/{store.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {!store.termsAccepted ? (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">Pending</span>
          ) : store.isActive ? (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">Active</span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">Off</span>
          )}
        </div>
      </div>

      {/* API Key */}
      <div className="mb-4">
        <p className="mb-1 text-xs font-medium text-(--clr-fg-muted)">API Key</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-lg bg-(--clr-surface2) px-3 py-2 font-mono text-xs text-(--clr-fg)">
            {showKey ? store.apiKey : `${store.apiKey.slice(0, 12)}...${store.apiKey.slice(-6)}`}
          </code>
          <button onClick={() => setShowKey(!showKey)} className="shrink-0 rounded-lg p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all">
            {showKey ? <LuEyeOff className="h-4 w-4" /> : <LuEye className="h-4 w-4" />}
          </button>
          <button onClick={copyKey} className="shrink-0 rounded-lg p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all">
            <LuCopy className="h-4 w-4" />
          </button>
          <button onClick={handleRegenKey} disabled={loading === "regen"} className="shrink-0 rounded-lg p-2 text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all disabled:opacity-40">
            {loading === "regen" ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuRefreshCw className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {!store.termsAccepted ? (
          <button onClick={handleAcceptTerms} disabled={loading === "terms"}
            className="flex items-center gap-1.5 rounded-lg bg-(--clr-teal-dim) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all disabled:opacity-50"
          >
            {loading === "terms" ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuCheck className="h-3.5 w-3.5" />}
            Accept Terms & Enable API
          </button>
        ) : (
          <button onClick={handleToggle} disabled={loading === "toggle"}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all disabled:opacity-50 ${
              store.isActive
                ? "bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400"
                : "bg-(--clr-teal-dim) text-white hover:bg-(--clr-teal-dim)/90"
            }`}
          >
            {loading === "toggle" ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : store.isActive ? <LuX className="h-3.5 w-3.5" /> : <LuCheck className="h-3.5 w-3.5" />}
            {store.isActive ? "Deactivate" : "Activate"}
          </button>
        )}
        <button onClick={() => setShowDocs(true)}
          className="flex items-center gap-1 rounded-lg border border-(--clr-border) px-3 py-1.5 text-xs font-medium text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all"
        >
          <LuBook className="h-3 w-3" /> Docs
        </button>
        <button onClick={handleDelete} disabled={loading === "delete"}
          className="ml-auto rounded-lg p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface2) hover:text-rose-500 transition-all disabled:opacity-40"
        >
          {loading === "delete" ? <LuLoader className="h-4 w-4 animate-spin" /> : <LuTrash2 className="h-4 w-4" />}
        </button>
      </div>

      <StoreDocsView store={store} businessSlug={businessSlug} open={showDocs} onClose={() => setShowDocs(false)} />
    </motion.div>
  );
}

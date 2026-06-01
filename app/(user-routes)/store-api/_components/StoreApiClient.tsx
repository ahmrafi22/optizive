"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { StoreStats } from "@/backend/store/store";
import { getUserStores, updateBusinessSlug } from "@/backend/store/store";
import StoreCard from "./StoreCard";
import CreateStoreDialog from "./CreateStoreDialog";
import { LuStore, LuActivity, LuChartBar, LuPlus, LuKey, LuPencil, LuCheck, LuX, LuLoader, LuGlobe, LuCircleX } from "react-icons/lu";
import NumberFlow from "@number-flow/react";
import Link from "next/link";

export default function StoreApiClient({ initialStats }: { initialStats: StoreStats | null }) {
  const [stats, setStats] = useState(initialStats);
  const [showCreate, setShowCreate] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = useCallback(async () => {
    const s = await getUserStores();
    if (s) setStats(s);
  }, []);

  const errorRate = stats && stats.totalApiHits > 0
    ? Math.round((stats.errorHits / stats.totalApiHits) * 100)
    : 0;

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total Stores", value: stats?.totalStores || 0, icon: LuStore, bgColor: "bg-blue-400/10", textColor: "text-blue-600 dark:text-blue-400", blurColor: "from-blue-400/20 to-blue-600/10" },
            { label: "Active", value: stats?.activeStores || 0, icon: LuChartBar, bgColor: "bg-emerald-400/10", textColor: "text-emerald-600 dark:text-emerald-400", blurColor: "from-emerald-400/20 to-emerald-600/10" },
            { label: "API Hits", value: stats?.totalApiHits || 0, icon: LuActivity, bgColor: "bg-violet-400/10", textColor: "text-violet-600 dark:text-violet-400", blurColor: "from-violet-400/20 to-violet-600/10" },
            { label: "Error Rate", value: errorRate, icon: LuCircleX, bgColor: "bg-rose-400/10", textColor: "text-rose-600 dark:text-rose-400", blurColor: "from-rose-400/20 to-rose-600/10", suffix: "%" },
          ].map((card, i) => {
            const Icon = card.icon;
            const suffix = (card as any).suffix || "";
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.05 * i,
                  duration: 0.5,
                  ease: [0.23, 1, 0.32, 1],
                }}
                className="group relative overflow-hidden rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-(--clr-border-hover) hover:shadow-[0_12px_40px_rgba(0,0,0,0.06)]"
              >
                <div
                  className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${card.blurColor} blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
                />
                <div className="absolute -right-4 -top-4 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                  <Icon className="h-28 w-28" />
                </div>
                <div className="relative z-10">
                  <div className="mb-3 flex items-center justify-between">
                    <div className={`rounded-xl border border-white/10 p-2 shadow-inner ${card.bgColor}`}>
                      <Icon className={`h-4 w-4 ${card.textColor}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-0.5">
                      <NumberFlow value={card.value} className="text-xl font-bold tabular-nums text-(--clr-fg)" />
                      {suffix && <span className="text-sm font-bold text-(--clr-fg-muted)">{suffix}</span>}
                    </div>
                    <p className="text-[11px] font-medium tracking-[0.08em] text-(--clr-fg-muted) uppercase">{card.label}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Business Slug */}
        <BusinessSlugSection slug={stats?.businessSlug || null} onUpdated={refresh} />

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3">
          <button onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-(--clr-teal-dim) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all shadow-sm"
          >
            <LuKey className="h-4 w-4" /> APIs
          </button>
          <Link href="/store-api/docs"
            className="rounded-xl border border-(--clr-border) px-5 py-2.5 text-xs font-medium text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all"
          >
            API Docs
          </Link>
        </div>

        {/* Recent API Hits */}
        {stats && stats.recentHits.length > 0 && (
          <div className="rounded-xl border border-(--clr-border) bg-(--clr-surface) overflow-hidden">
            <div className="border-b border-(--clr-border) px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-(--clr-fg-muted)">Recent API Hits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--clr-border) bg-(--clr-surface2)/50">
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase text-(--clr-fg-muted)">Endpoint</th>
                    <th className="px-5 py-2.5 text-left text-[10px] font-semibold uppercase text-(--clr-fg-muted)">Method</th>
                    <th className="px-5 py-2.5 text-center text-[10px] font-semibold uppercase text-(--clr-fg-muted)">Status</th>
                    <th className="px-5 py-2.5 text-right text-[10px] font-semibold uppercase text-(--clr-fg-muted)">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--clr-border)">
                  {stats.recentHits.map((hit) => (
                    <tr key={hit.id} className="hover:bg-(--clr-surface2)/30">
                      <td className="px-5 py-2.5 font-mono text-xs text-(--clr-fg)">{hit.endpoint}</td>
                      <td className="px-5 py-2.5">
                        <span className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          hit.method === "GET" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>{hit.method}</span>
                      </td>
                      <td className="px-5 py-2.5 text-center">
                        <span className={`text-xs font-medium ${hit.statusCode < 300 ? "text-emerald-600" : hit.statusCode < 400 ? "text-amber-600" : "text-rose-600"}`}>
                          {hit.statusCode}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 text-right text-xs text-(--clr-fg-muted)">{formatRelativeTime(hit.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Slide-in Sidebar Panel */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[600px] flex-col border-l border-(--clr-border) bg-(--clr-surface) shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-(--clr-border) px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--clr-teal-dim)/10">
                    <LuKey className="h-4 w-4 text-(--clr-teal-dim)" />
                  </div>
                  <h2 className="text-sm font-semibold text-(--clr-fg)">API Keys &amp; Branches</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowCreate(true)}
                    className="flex items-center gap-1 rounded-lg bg-(--clr-teal-dim) px-3 py-1.5 text-xs font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all"
                  >
                    <LuPlus className="h-3 w-3" /> Add
                  </button>
                  <button onClick={() => setSidebarOpen(false)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all"
                  >
                    <LuX className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-5">
                {stats?.stores.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-(--clr-surface2)">
                      <LuStore className="h-6 w-6 text-(--clr-fg-muted)" />
                    </div>
                    <h3 className="font-semibold text-(--clr-fg)">No branches yet</h3>
                    <p className="mt-1 text-sm text-(--clr-fg-muted)">Add a branch to get API keys</p>
                    <button onClick={() => setShowCreate(true)}
                      className="mt-4 flex items-center gap-2 rounded-xl bg-(--clr-teal-dim) px-5 py-2.5 text-sm font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all"
                    >
                      <LuPlus className="h-4 w-4" /> Add Your First Branch
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stats?.stores.map((store) => (
                      <StoreCard key={store.id} store={store} businessSlug={stats?.businessSlug || ""} onUpdate={refresh} />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CreateStoreDialog open={showCreate} onClose={() => setShowCreate(false)} onCreated={refresh} />
    </div>
  );
}

function BusinessSlugSection({ slug, onUpdated }: { slug: string | null; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(slug || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    setError("");
    if (!value || value.length < 2) { setError("Slug must be at least 2 characters"); return; }
    if (!/^[a-z0-9-]+$/.test(value)) { setError("Only lowercase letters, numbers, and hyphens allowed"); return; }
    setLoading(true);
    const res = await updateBusinessSlug(value);
    setLoading(false);
    if (!res.success) { setError(res.error || "Failed to update"); return; }
    setEditing(false);
    onUpdated();
  };

  const handleCancel = () => {
    setValue(slug || "");
    setEditing(false);
    setError("");
  };

  const handleStartEdit = () => {
    setValue(slug || "");
    setEditing(true);
    setError("");
  };

  return (
    <div
      onClick={!editing ? handleStartEdit : undefined}
      className="group relative cursor-pointer rounded-xl border-2 border-dashed border-amber-400/60 bg-(--clr-surface) p-4 transition-all hover:border-amber-400 hover:bg-amber-500/[0.03]"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 transition-all group-hover:scale-105">
            <LuGlobe className="h-[18px] w-[18px]" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-(--clr-fg-muted) font-semibold">Business Slug</p>
            {editing ? (
              <div className="flex items-center gap-1.5 mt-1" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-(--clr-fg-muted)">/api/</span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => { setValue(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")); setError(""); }}
                  className="w-48 rounded-lg border-2 border-amber-400/60 bg-(--clr-surface2) px-2 py-1 text-sm font-mono text-(--clr-fg) outline-none ring-0 focus:border-amber-400"
                  autoFocus
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") handleCancel(); }}
                />
                <span className="text-xs text-(--clr-fg-muted)">/main-branch/products</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm font-mono font-semibold text-(--clr-fg)">/api/{slug || "—"}/{"{branchSlug}"}/...</p>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-amber-900/40 dark:text-amber-300">
                  Click to edit
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {editing ? (
            <>
              <button onClick={handleSave} disabled={loading}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
              >
                {loading ? <LuLoader className="h-3.5 w-3.5 animate-spin" /> : <LuCheck className="h-4 w-4" />}
              </button>
              <button onClick={handleCancel}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 transition-all"
              >
                <LuX className="h-4 w-4" />
              </button>
            </>
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700 opacity-0 transition-all group-hover:opacity-100 dark:bg-amber-900/40 dark:text-amber-300">
              <LuPencil className="h-4 w-4" />
            </span>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
    </div>
  );
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

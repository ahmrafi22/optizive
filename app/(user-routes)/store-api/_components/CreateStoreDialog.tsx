"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createStore } from "@/backend/store/store";
import { LuX, LuLoader, LuStore } from "react-icons/lu";

export default function CreateStoreDialog({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) { setError("Enter a store name"); return; }
    setLoading(true);
    const result = await createStore(name);
    setLoading(false);
    if (!result.success) {
      setError(result.error || "Failed to create store");
    } else {
      setName("");
      onClose();
      onCreated();
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-(--clr-border) bg-(--clr-surface) p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-(--clr-teal-dim)/10 p-2.5">
                  <LuStore className="h-5 w-5 text-(--clr-teal-dim)" />
                </div>
                <h2 className="text-lg font-naston text-(--clr-fg)">Add Branch</h2>
              </div>
              <button onClick={onClose} className="rounded-lg p-1.5 text-(--clr-fg-muted) hover:bg-(--clr-surface2) transition-all">
                <LuX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-medium text-(--clr-fg-muted)">Branch Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Downtown Branch, Warehouse"
                  className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-4 py-2.5 text-sm text-(--clr-fg) placeholder:text-(--clr-fg-muted) focus:outline-none focus:ring-2 focus:ring-(--clr-teal-dim)/50"
                  autoFocus
                />
                {name && (
                  <p className="mt-1 text-[10px] text-(--clr-fg-muted)">
                    /api/{"{businessSlug}"}/{name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48)}
                  </p>
                )}
              </div>
              {error && <p className="mb-4 text-xs text-rose-500">{error}</p>}
              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-(--clr-teal-dim) py-2.5 text-sm font-semibold text-white hover:bg-(--clr-teal-dim)/90 transition-all disabled:opacity-50"
              >
                {loading && <LuLoader className="h-4 w-4 animate-spin" />}
                {loading ? "Adding..." : "Add Branch"}
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

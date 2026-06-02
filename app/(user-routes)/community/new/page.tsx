"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { LuArrowLeft, LuPlus, LuX, LuShoppingCart, LuFileText, LuTag } from "react-icons/lu";
import Link from "next/link";

import { createPost, getCategoryOptions } from "@/backend/community/community";
import type { Category } from "@/prisma/generated/prisma/client";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const inputBase =
  "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all";
const selectBase =
  "w-full rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-sm text-(--clr-fg) focus:outline-none focus:ring-2 focus:ring-[color:var(--clr-yellow)]/40 focus:border-(--clr-yellow) transition-all appearance-none";

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<"GENERAL" | "PROCUREMENT">("GENERAL");
  const [budget, setBudget] = useState("");
  const [needByDate, setNeedByDate] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCategoryOptions().then((cats) => setCategoryOptions(cats.map((c) => ({ value: c.value, label: c.label })))).catch(() => {});
  }, []);

  const addTag = useCallback(() => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags((prev) => [...prev, t]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = useCallback((tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  }, []);

  const handleSubmit = useCallback(async () => {
    setError(null);
    if (!title.trim()) { setError("Title is required"); return; }
    if (!content.trim()) { setError("Content is required"); return; }

    setIsSaving(true);
    try {
      const post = await createPost({
        title: title.trim(),
        content: content.trim(),
        type,
        budget: budget.trim() ? Number(budget) : null,
        needByDate: needByDate || null,
        categories: selectedCategories.length > 0 ? selectedCategories as Category[] : undefined,
        tagNames: tags.length > 0 ? tags : undefined,
      });
      router.push(`/community/${post.id}`);
    } catch (e) {
      setError((e as Error).message ?? "Failed to create post");
    } finally {
      setIsSaving(false);
    }
  }, [title, content, type, budget, needByDate, selectedCategories, tags, router]);

  return (
    <div className="relative mx-auto w-full max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
      >
        <Link
          href="/community"
          className="inline-flex items-center gap-2 text-sm text-(--clr-fg-dim) hover:text-(--clr-fg) transition-colors mb-6"
        >
          <LuArrowLeft className="h-4 w-4" />
          Back to Community
        </Link>

        <h1 className="text-3xl md:text-4xl font-naston text-(--clr-fg) mb-8">New Post</h1>

        {error && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Post Type
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setType("GENERAL")}
                className={`active:scale-[0.97] transition-transform duration-150 flex-1 flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition-all ${
                  type === "GENERAL"
                    ? "border-(--clr-teal-dim) bg-(--clr-teal-dim)/10 text-(--clr-teal-dim)"
                    : "border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-muted) hover:border-(--clr-border-hover)"
                }`}
              >
                <LuFileText className="h-5 w-5" />
                General Discussion
              </button>
              <button
                type="button"
                onClick={() => setType("PROCUREMENT")}
                className={`active:scale-[0.97] transition-transform duration-150 flex-1 flex items-center justify-center gap-2 rounded-xl border p-4 text-sm font-bold transition-all ${
                  type === "PROCUREMENT"
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-muted) hover:border-(--clr-border-hover)"
                }`}
              >
                <LuShoppingCart className="h-5 w-5" />
                Procurement Request
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Details
            </p>

            <label className="block">
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Title *</span>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`${inputBase} mt-2`}
                placeholder={type === "PROCUREMENT" ? "e.g. Need 500kg of rice for wholesale" : "e.g. Looking for reliable dairy suppliers"}
              />
            </label>

            <label className="block">
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Content *</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className={`${inputBase} mt-2 min-h-[120px] resize-y`}
                placeholder={type === "PROCUREMENT" ? "Describe what you need, quantity, quality requirements, delivery location..." : "Share your thoughts, questions, or discussion topic..."}
                rows={5}
              />
            </label>

            {type === "PROCUREMENT" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-xs font-semibold text-(--clr-fg-dim)">Budget (optional)</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className={`${inputBase} mt-2`}
                    placeholder="e.g. 50000"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-(--clr-fg-dim)">Need By (optional)</span>
                  <input
                    type="date"
                    value={needByDate}
                    onChange={(e) => setNeedByDate(e.target.value)}
                    className={`${inputBase} mt-2`}
                  />
                </label>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-(--clr-fg-dim)">
              Categories & Tags
            </p>

            <div>
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Product Categories (optional)</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {categoryOptions.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => toggleCategory(cat.value)}
                    className={`active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                      selectedCategories.includes(cat.value)
                        ? "border-(--clr-yellow) bg-(--clr-yellow)/15 text-(--clr-yellow)"
                        : "border-(--clr-border) bg-(--clr-surface) text-(--clr-fg-dim) hover:border-(--clr-border-hover)"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-(--clr-fg-dim)">Tags (optional)</span>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                  className={`${inputBase} flex-1`}
                  placeholder="Type a tag and press Enter"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-xl border border-(--clr-border) bg-(--clr-surface2) px-3 py-2 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
                >
                  <LuPlus className="h-3.5 w-3.5" />
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-(--clr-yellow)/10 text-(--clr-yellow) border border-(--clr-yellow)/20 px-2.5 py-1 text-[10px] font-semibold">
                      <LuTag className="h-3 w-3" />
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                        <LuX className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link
              href="/community"
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-fg-muted) hover:border-(--clr-border-hover) transition-colors"
            >
              Cancel
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSaving}
              className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:opacity-90 disabled:opacity-50 transition-all"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin h-3.5 w-3.5 border-2 border-(--clr-charcoal) border-t-transparent rounded-full" />
                  Posting...
                </>
              ) : (
                <>
                  <LuPlus className="h-3.5 w-3.5" />
                  Create Post
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

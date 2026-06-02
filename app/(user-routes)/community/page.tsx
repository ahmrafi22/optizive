"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { LuPlus, LuMessageSquare } from "react-icons/lu";
import Link from "next/link";

import { PostCard } from "./_components/PostCard";
import { CommunityFilters } from "./_components/CommunityFilters";
import { getPosts, getCategoryOptions } from "@/backend/community/community";
import type { PostListItem } from "@/backend/community/community";
import type { Category } from "@/prisma/generated/prisma/client";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

export default function CommunityPage() {
  const [posts, setPosts] = useState<PostListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [categories, setCategories] = useState<{ value: Category; label: string }[]>([]);

  const [search, setSearch] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [category, setCategory] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const loadPosts = useCallback(async (append = false) => {
    setIsFetching(true);
    try {
      const result = await getPosts({
        search: search || undefined,
        type: type as any,
        status: status as any,
        category: category !== "ALL" ? (category as Category) : undefined,
        sort: sort as any,
        limit: 20,
        offset: append ? posts.length : 0,
      });
      if (append) {
        setPosts((prev) => [...prev, ...result.posts]);
      } else {
        setPosts(result.posts);
      }
      setTotal(result.total);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [search, type, status, category, sort, posts.length]);

  useEffect(() => {
    setIsLoading(true);
    setPosts([]);
    loadPosts();
  }, [search, type, status, category, sort]);

  useEffect(() => {
    getCategoryOptions().then(setCategories).catch(() => {});
  }, []);

  const handleClear = useCallback(() => {
    setSearch("");
    setType("ALL");
    setStatus("ALL");
    setCategory("ALL");
    setSort("newest");
  }, []);

  const isEmpty = !isLoading && posts.length === 0;

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="relative mx-auto w-full max-w-4xl space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mt-3 text-3xl md:text-4xl font-naston text-(--clr-fg)">Community</h1>
              <p className="mt-1 text-sm text-(--clr-fg-dim)">
                Procure, share, and connect with other businesses
              </p>
            </div>
            <Link
              href="/community/new"
              className="active:scale-[0.97] transition-transform duration-150 mt-3 inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:opacity-90 transition-all"
            >
              <LuPlus className="h-3.5 w-3.5" />
              New Post
            </Link>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
        >
          <CommunityFilters
            search={search} onSearchChange={setSearch}
            type={type} onTypeChange={setType}
            status={status} onStatusChange={setStatus}
            category={category} onCategoryChange={(v) => setCategory(v as string)}
            categories={categories}
            sort={sort} onSortChange={setSort}
            onClear={handleClear}
            isFetching={isFetching}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.12, ease: EASE_OUT }}
          className="space-y-3"
        >
          {isLoading && (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-2xl border border-(--clr-border) bg-(--clr-surface2) p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="h-10 w-10 rounded-xl bg-(--clr-surface) shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-1/3 rounded bg-(--clr-surface)" />
                      <div className="h-3 w-full rounded bg-(--clr-surface)" />
                      <div className="h-3 w-2/3 rounded bg-(--clr-surface)" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-(--clr-surface2) border border-(--clr-border) mb-4">
                <LuMessageSquare className="h-8 w-8 text-(--clr-fg-dim)" />
              </div>
              <p className="text-lg font-bold text-(--clr-fg)">No posts found</p>
              <p className="mt-1 text-sm text-(--clr-fg-dim)">Try adjusting your filters or create a new post.</p>
              <Link
                href="/community/new"
                className="active:scale-[0.97] transition-transform duration-150 mt-4 inline-flex items-center gap-2 rounded-full border border-(--clr-yellow) bg-(--clr-yellow) px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.15em] text-(--clr-charcoal) hover:opacity-90 transition-all"
              >
                <LuPlus className="h-3.5 w-3.5" />
                Create Post
              </Link>
            </div>
          )}

          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}

          {posts.length < total && (
            <div className="flex justify-center pt-2 pb-8">
              <button
                type="button"
                onClick={() => loadPosts(true)}
                disabled={isFetching}
                className="active:scale-[0.97] transition-transform duration-150 inline-flex items-center gap-2 rounded-full border border-(--clr-border) bg-(--clr-surface2) px-6 py-3 text-xs font-semibold text-(--clr-fg-muted) hover:border-(--clr-border-hover) hover:text-(--clr-fg) transition-colors"
              >
                {isFetching ? "Loading..." : `Load More (${posts.length}/${total})`}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

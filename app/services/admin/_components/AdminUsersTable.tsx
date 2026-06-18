"use client";

import { motion } from "motion/react";
import { LuBadgeCheck } from "react-icons/lu";
import type { AdminDashboardUser } from "@/backend/admin/admin";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;

interface Props {
  users: AdminDashboardUser[];
}

export default function AdminUsersTable({ users }: Props) {
  if (users.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-3xl border border-(--clr-border) bg-(--clr-surface) text-sm text-(--clr-fg-muted)">
        No users yet
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.56, delay: 0.08, ease: EASE_OUT }}
      className="overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
    >
      <div className="noise-overlay absolute inset-0 pointer-events-none" />
      <div className="relative z-10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-(--clr-border) text-[10px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
              <th className="px-5 py-4 font-semibold">User</th>
              <th className="px-5 py-4 font-semibold">Role</th>
              <th className="px-5 py-4 font-semibold">Rating</th>
              <th className="px-5 py-4 font-semibold">Transactions</th>
              <th className="px-5 py-4 font-semibold">Status</th>
              <th className="px-5 py-4 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--clr-border)">
            {users.slice(0, 10).map((u, i) => (
              <motion.tr
                key={u.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.08 + i * 0.03, ease: EASE_OUT }}
                className="transition-colors hover:bg-(--clr-surface2)/40"
              >
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-xs font-bold text-(--clr-fg-muted)">
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-(--clr-fg)">{u.name}</p>
                      <p className="truncate text-xs text-(--clr-fg-muted)">{u.email ?? u.businessName ?? "—"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <span className="rounded-full border border-(--clr-border) bg-(--clr-surface2) px-2.5 py-1 text-xs font-medium text-(--clr-fg-muted)">
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-(--clr-fg)">{u.avgRating.toFixed(1)}</span>
                </td>
                <td className="px-5 py-3.5">
                  <span className="font-semibold text-(--clr-fg)">{u.totalTransactions}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    {u.isVerified && <LuBadgeCheck className="h-4 w-4 text-emerald-400" />}
                    {u.banned ? (
                      <span className="text-xs font-medium text-rose-400">Banned</span>
                    ) : (
                      <span className="text-xs font-medium text-emerald-400">Active</span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3.5 text-xs text-(--clr-fg-muted)">
                  {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

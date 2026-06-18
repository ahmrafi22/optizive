"use client";

import { useState, useTransition } from "react";
import { motion } from "motion/react";
import NumberFlow, { continuous } from "@number-flow/react";
import { LuBadgeCheck, LuBan, LuCheck, LuUserX, LuSearch, LuSlidersHorizontal } from "react-icons/lu";
import { toggleUserBan, toggleUserVerification } from "@/backend/admin/admin";
import type { AdminDashboardUser } from "@/backend/admin/admin";

const EASE_OUT = [0.23, 1, 0.32, 1] as const;
const numberTiming = { duration: 600, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };
const numberOpacityTiming = { duration: 400, easing: "cubic-bezier(0.23, 1, 0.32, 1)" };

interface Props {
  users: AdminDashboardUser[];
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    ADMIN: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    SUPPLIER: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    STORE_OWNER: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    BOTH: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    NONE: "bg-zinc-400/10 text-zinc-400 border-zinc-400/20",
  };
  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${colors[role] ?? colors.NONE}`}>
      {role}
    </span>
  );
}

function AnimatedPill({ value }: { value: number }) {
  return (
    <NumberFlow
      willChange
      plugins={[continuous]}
      value={value}
      format={{ maximumFractionDigits: 1 }}
      locales="en-US"
      animated
      transformTiming={numberTiming}
      spinTiming={numberTiming}
      opacityTiming={numberOpacityTiming}
      className="font-semibold text-(--clr-fg)"
    />
  );
}

export default function UsersManagement({ users: initial }: Props) {
  const [users, setUsers] = useState(initial);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [_, startTransition] = useTransition();

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q) || u.businessName?.toLowerCase().includes(q);
    const matchesRole = filterRole === "all" || u.role === filterRole;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "banned" && u.banned) ||
      (filterStatus === "active" && !u.banned) ||
      (filterStatus === "verified" && u.isVerified) ||
      (filterStatus === "unverified" && !u.isVerified);
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleBan = (id: string, banned: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned } : u)));
    startTransition(async () => {
      const r = await toggleUserBan(id, banned);
      if (!r.success) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, banned: !banned } : u)));
    });
  };

  const handleVerify = (id: string, isVerified: boolean) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isVerified } : u)));
    startTransition(async () => {
      const r = await toggleUserVerification(id, isVerified);
      if (!r.success) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, isVerified: !isVerified } : u)));
    });
  };

  return (
    <div className="relative w-full space-y-6 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.56, ease: EASE_OUT }}
        className="relative isolate overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) px-6 py-6 shadow-[0_16px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:px-7"
      >
        <div className="noise-overlay absolute inset-0" />
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--clr-yellow)/20">
            <LuUserX className="h-6 w-6 text-(--clr-yellow)" />
          </div>
          <div>
            <h1 className="text-2xl font-naston leading-tight text-(--clr-fg) sm:text-3xl">User Management</h1>
            <p className="mt-1 text-sm text-(--clr-fg-muted)">{users.length} total users — Ban, unban, verify</p>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.56, delay: 0.06, ease: EASE_OUT }}
        className="flex flex-wrap items-center gap-3"
      >
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <LuSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-(--clr-fg-muted)" />
          <input
            type="text"
            placeholder="Search by name, email, business..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-(--clr-border) bg-(--clr-surface) py-2.5 pl-10 pr-4 text-sm text-(--clr-fg) placeholder-(--clr-fg-dim) focus:outline-none focus:border-(--clr-border-hover) transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          <LuSlidersHorizontal className="h-4 w-4 text-(--clr-fg-muted)" />
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="rounded-xl border border-(--clr-border) bg-(--clr-surface) px-3 py-2.5 text-xs font-semibold text-(--clr-fg) focus:outline-none focus:border-(--clr-border-hover)"
          >
            <option value="all">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPPLIER">Supplier</option>
            <option value="STORE_OWNER">Store Owner</option>
            <option value="BOTH">Both</option>
            <option value="NONE">None</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-xl border border-(--clr-border) bg-(--clr-surface) px-3 py-2.5 text-xs font-semibold text-(--clr-fg) focus:outline-none focus:border-(--clr-border-hover)"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
            <option value="verified">Verified</option>
            <option value="unverified">Unverified</option>
          </select>
        </div>
      </motion.div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-3xl border border-(--clr-border) bg-(--clr-surface) text-sm text-(--clr-fg-muted)">
          No users match your filters
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.56, delay: 0.12, ease: EASE_OUT }}
          className="overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) shadow-[0_14px_38px_rgba(0,0,0,0.04)] dark:shadow-[0_16px_46px_rgba(0,0,0,0.16)]"
        >
          <div className="noise-overlay absolute inset-0 pointer-events-none" />
          <div className="relative z-10 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-(--clr-border) text-[10px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
                  <th className="px-5 py-4 font-semibold w-[280px]">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Rating</th>
                  <th className="px-5 py-4 font-semibold">Txns</th>
                  <th className="px-5 py-4 font-semibold">Verified</th>
                  <th className="px-5 py-4 font-semibold">Banned</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                  <th className="px-5 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--clr-border)">
                {filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 + i * 0.02, ease: EASE_OUT }}
                    className="transition-colors hover:bg-(--clr-surface2)/40"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-(--clr-border) bg-(--clr-surface2) text-sm font-bold text-(--clr-fg-muted)">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-(--clr-fg)">{u.name}</p>
                          <p className="truncate text-xs text-(--clr-fg-muted)">{u.email ?? u.businessName ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                    <td className="px-5 py-3"><AnimatedPill value={u.avgRating} /></td>
                    <td className="px-5 py-3 font-semibold text-(--clr-fg)">{u.totalTransactions}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => handleVerify(u.id, !u.isVerified)}
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-all ${
                          u.isVerified
                            ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-400"
                            : "border-zinc-400/20 text-(--clr-fg-muted) hover:border-zinc-400/40"
                        }`}
                      >
                        <LuBadgeCheck className={`h-3.5 w-3.5 ${u.isVerified ? "" : "opacity-40"}`} />
                        {u.isVerified ? "Verified" : "Verify"}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium ${u.banned ? "text-rose-400" : "text-emerald-400"}`}>
                        {u.banned ? "Banned" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-xs text-(--clr-fg-muted)">
                      {new Date(u.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerify(u.id, !u.isVerified)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            u.isVerified
                              ? "border-zinc-400/20 text-(--clr-fg-muted) hover:border-zinc-400/40"
                              : "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                          }`}
                          title={u.isVerified ? "Unverify" : "Verify"}
                        >
                          <LuBadgeCheck className="h-3 w-3" />
                          {u.isVerified ? "Unverify" : "Verify"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleBan(u.id, !u.banned)}
                          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                            u.banned
                              ? "border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10"
                              : "border-rose-400/30 text-rose-400 hover:bg-rose-400/10"
                          }`}
                          title={u.banned ? "Unban" : "Ban"}
                        >
                          {u.banned ? <LuCheck className="h-3 w-3" /> : <LuBan className="h-3 w-3" />}
                          {u.banned ? "Unban" : "Ban"}
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

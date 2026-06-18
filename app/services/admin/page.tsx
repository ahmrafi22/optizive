import { getAdminDashboardData, getAdminUsers, getAdminRecentSales } from "@/backend/admin/admin";
import AdminStatsGrid from "./_components/AdminStats";
import AdminUsersSection from "./_components/AdminUsersSection";
import AdminRecentSales from "./_components/AdminRecentSales";
import { LuShield } from "react-icons/lu";

export default async function AdminDashboardPage() {
  const [{ stats }, users, recentSales] = await Promise.all([
    getAdminDashboardData(),
    getAdminUsers(),
    getAdminRecentSales(),
  ]);

  return (
    <main className="relative w-full space-y-6 pb-12">
      {/* Header */}
      <div className="relative isolate overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) px-6 py-6 shadow-[0_16px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:px-7">
        <div className="noise-overlay absolute inset-0" />
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-(--clr-yellow)/20">
            <LuShield className="h-6 w-6 text-(--clr-yellow)" />
          </div>
          <div>
            <h1 className="text-2xl font-naston leading-tight text-(--clr-fg) sm:text-3xl">
              Admin Dashboard
            </h1>
            <p className="mt-1 text-sm text-(--clr-fg-muted)">
              Platform overview &amp; management
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <AdminStatsGrid stats={stats} />

      {/* Users Table — full width */}
      <div className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">All Users ({users.length})</h2>
        <AdminUsersSection users={users} />
      </div>

      {/* Recent Sales — full width */}
      <div className="space-y-4">
        <h2 className="text-[11px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">Recent Activity</h2>
        <AdminRecentSales sales={recentSales} />
      </div>
    </main>
  );
}

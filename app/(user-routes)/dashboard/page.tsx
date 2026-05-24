import { getDashboardData } from "@/backend/dashboard/dashboard";
import { DashboardStats } from "./_components/DashboardStats";
import { SalesChart } from "./_components/SalesChart";
import { TopProducts } from "./_components/TopProducts";
import { RecentSales } from "./_components/RecentSales";
import { CategoryChart } from "./_components/CategoryChart";
import { LuLayoutDashboard, LuSparkles } from "react-icons/lu";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--clr-border) bg-(--clr-surface2) p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-(--clr-surface2)">
            <LuLayoutDashboard className="h-6 w-6 text-(--clr-fg-muted)" />
          </div>
          <h2 className="text-lg font-semibold text-(--clr-fg)">
            Please sign in
          </h2>
          <p className="text-sm text-(--clr-fg-muted) mt-2">
            You need to be signed in to view the dashboard
          </p>
        </div>
      </main>
    );
  }

  const displayName = dashboardData.userName || "there";

  return (
    <main className="relative w-full space-y-6 pb-12">
      {/* Header */}
      <div className="relative isolate overflow-hidden rounded-3xl border border-(--clr-border) bg-(--clr-surface) px-6 py-6 shadow-[0_16px_45px_rgba(0,0,0,0.04)] dark:shadow-[0_18px_55px_rgba(0,0,0,0.16)] sm:px-7">
        <div className="noise-overlay absolute inset-0" />
        <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-(--clr-fg-muted)">
              <LuSparkles className="h-3.5 w-3.5 text-primary" />
              Business overview
            </div>
            <div>
              <h1 className="text-3xl font-naston leading-tight text-(--clr-fg) sm:text-4xl">
                Welcome back, {displayName}
              </h1>
            </div>
          </div>
          <div className="w-fit rounded-2xl border border-(--clr-border) bg-(--clr-surface2)/70 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.18em] text-(--clr-fg-muted)">
              Today
            </p>
            <p className="mt-1 text-sm font-semibold leading-none text-(--clr-fg)">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              }).format(new Date())}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={dashboardData.stats} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Daily Sales Chart - Takes 2 columns */}
        <div className="xl:col-span-2">
          <SalesChart
            data={dashboardData.dailySales}
            title="Daily Sales (Last 30 Days)"
            showRevenue={true}
            delay={0.24}
            chartAnimationDelay={650}
          />
        </div>

        {/* Top Products - Takes 1 column */}
        <div className="xl:col-span-1">
          <TopProducts products={dashboardData.topProducts} delay={0.32} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
        {/* Monthly Overview - swapped with category chart */}
        {dashboardData.monthlySales.length > 0 ? (
          <SalesChart
            data={dashboardData.monthlySales}
            title="Monthly Sales Overview"
            showRevenue={true}
            delay={0.4}
            chartAnimationDelay={850}
            chartHeight={205}
          />
        ) : (
          <CategoryChart
            data={dashboardData.categorySales}
            delay={0.4}
            chartAnimationDelay={850}
          />
        )}

        {/* Recent Sales */}
        <RecentSales sales={dashboardData.recentSales} delay={0.48} />
      </div>

      {/* Category Sales Chart */}
      {dashboardData.monthlySales.length > 0 && (
        <CategoryChart
          data={dashboardData.categorySales}
          delay={0.56}
          chartAnimationDelay={1000}
        />
      )}
    </main>
  );
}

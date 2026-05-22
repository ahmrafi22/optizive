import { getDashboardData } from "@/backend/dashboard/dashboard";
import { DashboardStats } from "./_components/DashboardStats";
import { SalesChart } from "./_components/SalesChart";
import { TopProducts } from "./_components/TopProducts";
import { RecentSales } from "./_components/RecentSales";
import { CategoryChart } from "./_components/CategoryChart";
import { LuLayoutDashboard } from "react-icons/lu";

export default async function DashboardPage() {
  const dashboardData = await getDashboardData();

  if (!dashboardData) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-6 px-6 py-16">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-(--clr-border) bg-(--clr-surface2) p-12 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-(--clr-surface2)">
            <LuLayoutDashboard className="h-6 w-6 text-(--clr-fg-muted)" />
          </div>
          <h2 className="text-lg font-semibold text-(--clr-fg)">Please sign in</h2>
          <p className="text-sm text-(--clr-fg-muted) mt-2">
            You need to be signed in to view the dashboard
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative w-full space-y-6 pb-12">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-naston text-(--clr-fg)">Dashboard</h1>
        <p className="text-sm text-(--clr-fg-muted)">
          Welcome back! Here's an overview of your inventory and sales.
        </p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={dashboardData.stats} />

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Daily Sales Chart - Takes 2 columns */}
        <div className="xl:col-span-2">
          <SalesChart
            data={dashboardData.dailySales}
            title="Daily Sales (Last 30 Days)"
            showRevenue={true}
          />
        </div>

        {/* Top Products - Takes 1 column */}
        <div className="xl:col-span-1">
          <TopProducts products={dashboardData.topProducts} />
        </div>
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category Sales Chart */}
        <CategoryChart data={dashboardData.categorySales} />

        {/* Recent Sales */}
        <RecentSales sales={dashboardData.recentSales} />
      </div>

      {/* Monthly Overview */}
      {dashboardData.monthlySales.length > 0 && (
        <SalesChart
          data={dashboardData.monthlySales}
          title="Monthly Sales Overview"
          showRevenue={true}
        />
      )}
    </main>
  );
}

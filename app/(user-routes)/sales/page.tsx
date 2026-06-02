import { getSalesStats, listSales, getSalesChartData } from "@/backend/sales/sales";
import SalesStats from "./_components/SalesStats";
import SalesListView from "./_components/SalesListView";
import SalesTrendChart from "./_components/SalesTrendChart";
import SalesDistributionChart from "./_components/SalesDistributionChart";

export default async function SalesPage() {
  const [stats, initialData, chartData] = await Promise.all([
    getSalesStats(),
    listSales({ page: 1, limit: 20 }),
    getSalesChartData(),
  ]);

  return (
    <main className="relative pb-12">
      <div className="mb-6">
        <h1 className="text-2xl font-naston leading-tight text-(--clr-fg) sm:text-3xl">
          Sales
        </h1>
      </div>

      {stats && <SalesStats stats={stats} />}

      {/* Charts section ~40% viewport height */}
      {chartData && (
        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2" style={{ height: "40vh", minHeight: 280 }}>
          <SalesTrendChart data={chartData.monthlyTrend} />
          <SalesDistributionChart
            paymentData={chartData.paymentDistribution}
            buyerData={chartData.buyerTypeDistribution}
          />
        </div>
      )}

      {/* Sales list */}
      <div className="mt-6">
        <SalesListView initialData={initialData} />
      </div>
    </main>
  );
}

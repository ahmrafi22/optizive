/**
 * Sales Charts - Usage Examples
 * 
 * This file contains example implementations of the sales charts.
 * Copy and adapt these examples for your specific use cases.
 */

import { MiniSalesChart } from "@/app/(user-routes)/inventory/_components/MiniSalesChart";
import { SalesHistoryChart } from "@/app/(user-routes)/inventory/_components/SalesHistoryChart";
import { MonthlyComparisonChart } from "@/app/(user-routes)/inventory/_components/MonthlyComparisonChart";

// ============================================================================
// Example 1: Mini Sales Chart in a Product Card
// ============================================================================

export function ProductCardExample() {
  const product = {
    id: "prod_123",
    name: "Premium Coffee Beans",
    // ... other product fields
  };

  return (
    <div className="bento-card noise-overlay p-4">
      <h3>{product.name}</h3>
      
      {/* Mini chart at the bottom */}
      <div className="mt-4 pt-3 border-t border-(--clr-border)">
        <div className="text-[9px] uppercase tracking-widest text-(--clr-fg-muted) mb-1">
          Sales Trend (12M)
        </div>
        <MiniSalesChart productId={product.id} />
      </div>
    </div>
  );
}

// ============================================================================
// Example 2: Full Sales History Chart
// ============================================================================

export function ProductDetailExample() {
  const product = {
    id: "prod_123",
    name: "Premium Coffee Beans",
  };

  return (
    <div className="space-y-6">
      {/* Product info cards */}
      <div className="grid grid-cols-2 gap-4">
        {/* ... pricing and stock cards ... */}
      </div>

      {/* Sales History Chart */}
      <SalesHistoryChart 
        productId={product.id} 
        productName={product.name}
      />

      {/* Monthly Comparison Chart */}
      <MonthlyComparisonChart productId={product.id} />
    </div>
  );
}

// ============================================================================
// Example 3: Custom Styling
// ============================================================================

export function CustomStyledChartExample() {
  return (
    <div className="space-y-6">
      {/* Chart with custom className */}
      <SalesHistoryChart 
        productId="prod_123"
        productName="Product Name"
        className="shadow-xl" // Add custom styles
      />

      {/* Mini chart with wrapper styling */}
      <div className="bg-gradient-to-r from-yellow-50 to-teal-50 dark:from-gray-800 dark:to-gray-900 p-4 rounded-xl">
        <MiniSalesChart productId="prod_123" />
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Grid Layout with Multiple Charts
// ============================================================================

export function DashboardGridExample() {
  const products = [
    { id: "prod_1", name: "Product A" },
    { id: "prod_2", name: "Product B" },
    { id: "prod_3", name: "Product C" },
    { id: "prod_4", name: "Product D" },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {products.map((product) => (
        <div key={product.id} className="bento-card noise-overlay p-5">
          <h3 className="text-lg font-semibold mb-4">{product.name}</h3>
          <MiniSalesChart productId={product.id} />
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Example 5: Conditional Rendering
// ============================================================================

export function ConditionalChartExample() {
  const product = {
    id: "prod_123",
    name: "Product Name",
    hasSalesData: true, // Check if product has sales data
  };

  return (
    <div className="bento-card noise-overlay p-5">
      <h2 className="text-lg font-semibold mb-4">{product.name}</h2>
      
      {product.hasSalesData ? (
        <SalesHistoryChart 
          productId={product.id}
          productName={product.name}
        />
      ) : (
        <div className="text-center py-12 text-(--clr-fg-muted)">
          <p>No sales data available yet</p>
          <p className="text-xs mt-2">Start selling to see your sales history</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Example 6: Loading State
// ============================================================================

export function ChartWithLoadingExample() {
  const isLoading = false; // Replace with actual loading state
  const product = { id: "prod_123", name: "Product Name" };

  return (
    <div className="bento-card noise-overlay p-5">
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-(--clr-surface2) rounded" />
          <div className="h-64 bg-(--clr-surface2) rounded" />
        </div>
      ) : (
        <SalesHistoryChart 
          productId={product.id}
          productName={product.name}
        />
      )}
    </div>
  );
}

// ============================================================================
// Example 7: Side-by-Side Charts
// ============================================================================

export function SideBySideChartsExample() {
  const product = { id: "prod_123", name: "Product Name" };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SalesHistoryChart 
        productId={product.id}
        productName={product.name}
      />
      <MonthlyComparisonChart productId={product.id} />
    </div>
  );
}

// ============================================================================
// Example 8: Responsive Layout
// ============================================================================

export function ResponsiveLayoutExample() {
  const product = { id: "prod_123", name: "Product Name" };

  return (
    <div className="space-y-6">
      {/* Full width on mobile, side-by-side on desktop */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bento-card noise-overlay p-5">
          <h3 className="text-sm font-semibold mb-4">Sales Trend</h3>
          <MiniSalesChart productId={product.id} />
        </div>
        
        <div className="bento-card noise-overlay p-5">
          <h3 className="text-sm font-semibold mb-4">Quick Stats</h3>
          {/* Other stats */}
        </div>
      </div>

      {/* Full width chart */}
      <SalesHistoryChart 
        productId={product.id}
        productName={product.name}
      />
    </div>
  );
}

// ============================================================================
// Example 9: With Error Boundary
// ============================================================================

import { Component, ReactNode } from "react";

class ChartErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bento-card noise-overlay p-8 text-center">
          <p className="text-(--clr-fg-muted)">
            Unable to load chart. Please try again later.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ChartWithErrorBoundaryExample() {
  const product = { id: "prod_123", name: "Product Name" };

  return (
    <ChartErrorBoundary>
      <SalesHistoryChart 
        productId={product.id}
        productName={product.name}
      />
    </ChartErrorBoundary>
  );
}

// ============================================================================
// Example 10: Integration with Real API
// ============================================================================

import { useEffect, useState } from "react";

interface SalesData {
  date: string;
  sales: number;
  revenue: number;
}

export function ChartWithRealDataExample() {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const productId = "prod_123";

  useEffect(() => {
    async function fetchSalesData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/products/${productId}/sales`);
        const data = await response.json();
        setSalesData(data);
      } catch (error) {
        console.error("Failed to fetch sales data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalesData();
  }, [productId]);

  if (loading) {
    return (
      <div className="bento-card noise-overlay p-5 animate-pulse">
        <div className="h-64 bg-(--clr-surface2) rounded" />
      </div>
    );
  }

  // For now, we use the built-in mock data
  // Replace with: <CustomChartWithData data={salesData} />
  return (
    <SalesHistoryChart 
      productId={productId}
      productName="Product Name"
    />
  );
}

// ============================================================================
// Tips for Production Use
// ============================================================================

/**
 * 1. Replace mock data with real API calls
 * 2. Add proper error handling
 * 3. Implement loading states
 * 4. Add empty states for no data
 * 5. Consider data caching
 * 6. Add refresh functionality
 * 7. Implement date range filters
 * 8. Add export functionality
 * 9. Consider real-time updates
 * 10. Add analytics tracking
 */

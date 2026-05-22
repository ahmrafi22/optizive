# Sales History Charts - Implementation Guide

## Overview
Beautiful, theme-aware sales history charts have been added to your inventory system. The charts automatically adapt to both dark and light modes, matching your existing design system.

## What Was Added

### 1. **Base Chart Components** (`components/ui/chart.tsx`)
- `ChartContainer` - Responsive container for all charts
- `ChartTooltipContent` - Customizable tooltip with theme support
- `ChartLegendContent` - Legend component for chart data
- Fully supports your CSS custom properties for theming

### 2. **Mini Sales Chart** (`inventory/_components/MiniSalesChart.tsx`)
- Compact sparkline chart for product cards
- Shows 12-month sales trend
- Displays trend percentage with up/down indicator
- Color-coded: Green for positive trends, Red for negative
- Minimal footprint (60px height)

### 3. **Sales History Chart** (`inventory/_components/SalesHistoryChart.tsx`)
- Full-featured area chart for product detail pages
- Displays both units sold and revenue
- 12-month historical data
- Interactive tooltips with formatted values
- Dual gradient fills matching your brand colors (#fff44f yellow, #4ecdc4 teal)

### 4. **Monthly Comparison Chart** (`inventory/_components/MonthlyComparisonChart.tsx`)
- Bar chart comparing current year vs previous year
- 6-month comparison view
- Side-by-side bars for easy comparison
- Theme-aware styling

## Theme Integration

All charts automatically adapt to your theme using CSS custom properties:

### Light Mode
- Background: `var(--clr-surface)` (#ffffff)
- Text: `var(--clr-fg)` (#0f1419)
- Muted text: `var(--clr-fg-muted)` (#3d4752)
- Borders: `var(--clr-border)` (rgba(0, 0, 0, 0.15))

### Dark Mode
- Background: `var(--clr-surface)` (#2e2e2e)
- Text: `var(--clr-fg)` (#f0f0f0)
- Muted text: `var(--clr-fg-muted)` (#b3b3b3)
- Borders: `var(--clr-border)` (rgba(255, 255, 255, 0.08))

### Brand Colors
- Primary Yellow: `#fff44f` (--clr-yellow)
- Teal: `#4ecdc4` (--clr-teal)
- Success: `#34d399` (emerald)
- Danger: `#f87171` (rose)

## Where Charts Appear

### Product Cards (`inventory/page.tsx`)
Each product card now includes:
- Mini sales trend chart at the bottom
- Trend indicator showing percentage change
- Automatic color coding based on performance

### Product Detail Page (`inventory/[productId]/page.tsx`)
Full product pages now show:
- **Sales History Chart**: 12-month area chart with units and revenue
- **Monthly Comparison Chart**: Current year vs previous year bar chart

## Data Generation

Currently using mock data generation based on product IDs for demonstration:
- Consistent data per product (seeded by product ID)
- Realistic variance and trends
- Ready to be replaced with real API calls

### To Connect Real Data:
Replace the `generateMockSalesData()` functions with API calls:

```typescript
// Example for SalesHistoryChart.tsx
async function fetchSalesData(productId: string): Promise<SalesDataPoint[]> {
  const response = await fetch(`/api/products/${productId}/sales`);
  return response.json();
}
```

## Styling Features

### Bento Card Integration
All charts use your existing `bento-card` class:
- Rounded corners (1.5rem)
- Border with hover effects
- Noise overlay texture
- Smooth transitions

### Responsive Design
- Charts automatically resize with container
- Mobile-friendly layouts
- Touch-friendly tooltips

### Accessibility
- Proper ARIA labels
- Keyboard navigation support
- High contrast in both themes
- Screen reader friendly tooltips

## Dependencies Installed

```json
{
  "recharts": "^2.x.x",
  "class-variance-authority": "^0.x.x"
}
```

## Customization Options

### Change Chart Colors
Edit the gradient definitions in each chart component:

```typescript
// In SalesHistoryChart.tsx
<linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
  <stop offset="5%" stopColor="#YOUR_COLOR" stopOpacity={0.3} />
  <stop offset="95%" stopColor="#YOUR_COLOR" stopOpacity={0} />
</linearGradient>
```

### Adjust Chart Height
Modify the `initialDimension` prop:

```typescript
<ChartContainer initialDimension={{ width: 600, height: 280 }}>
```

### Change Data Range
Update the loop in data generation functions:

```typescript
// For 6 months instead of 12
for (let i = 0; i < 6; i++) {
  // ... data generation
}
```

## Performance Notes

- Charts use `useMemo` to prevent unnecessary recalculations
- `isAnimationActive={false}` on mini charts for instant rendering
- Responsive containers optimize for viewport size
- Gradients are defined once and reused

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires SVG support
- CSS custom properties support
- Flexbox and Grid support

## Future Enhancements

Consider adding:
1. Date range picker for custom periods
2. Export chart as image functionality
3. Real-time data updates with WebSocket
4. Comparison with category averages
5. Predictive trend lines
6. Drill-down to daily/weekly views

## Troubleshooting

### Charts not showing?
- Check if recharts is installed: `npm list recharts`
- Verify CSS custom properties are defined in globals.css
- Check browser console for errors

### Theme not switching?
- Ensure `html.dark` and `html.light` classes are toggled
- Verify CSS custom properties are scoped correctly
- Check if theme provider is wrapping the app

### Data looks wrong?
- Mock data is seeded by product ID for consistency
- Replace with real API calls for production data
- Verify data format matches expected interface

## Support

For issues or questions:
1. Check component props and types
2. Review Recharts documentation: https://recharts.org/
3. Verify theme CSS custom properties
4. Test in both light and dark modes

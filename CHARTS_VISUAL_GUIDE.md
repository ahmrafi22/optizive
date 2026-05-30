# Sales Charts Visual Guide

## 📊 Chart Components Overview

### 1. Mini Sales Chart (Product Cards)
**Location**: Inventory page - on each product card  
**Purpose**: Quick visual indicator of sales performance  
**Features**:
- 📈 12-month sparkline trend
- ✅ Trend percentage indicator (↗ 15% or ↘ 8%)
- 🎨 Color-coded: Green (positive) / Red (negative)
- 📏 Compact: 60px height

**Visual Layout**:
```
┌─────────────────────────────────────┐
│  Product Card                       │
│  ┌─────────────────────────────┐   │
│  │     Product Image           │   │
│  └─────────────────────────────┘   │
│                                     │
│  Category Badge  [In Stock]         │
│  Product Name                       │
│  Description text...                │
│                                     │
│  Price: $1,200    Stock: 45 PCS    │
│  ─────────────────────────────────  │
│  SALES TREND (12M)         ↗ 15%   │
│  ╱╲    ╱╲                          │
│ ╱  ╲  ╱  ╲╱╲  ╱╲                   │
│      ╲╱      ╲╱  ╲                 │
└─────────────────────────────────────┘
```

### 2. Sales History Chart (Product Detail)
**Location**: Product detail page  
**Purpose**: Comprehensive 12-month sales analysis  
**Features**:
- 📊 Dual area chart (Units Sold + Revenue)
- 🎯 Interactive tooltips
- 📅 Monthly breakdown
- 🌈 Gradient fills with brand colors

**Visual Layout**:
```
┌──────────────────────────────────────────────────┐
│  SALES HISTORY (12 MONTHS)                       │
│                                                   │
│  Revenue                                          │
│  ┌────────────────────────────────────────────┐  │
│  │     ╱╲    ╱╲                               │  │
│  │    ╱  ╲  ╱  ╲╱╲  ╱╲                        │  │
│  │   ╱    ╲╱      ╲╱  ╲                       │  │
│  │  ╱                  ╲                      │  │
│  │ ╱                    ╲                     │  │
│  └────────────────────────────────────────────┘  │
│   Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec│
│                                                   │
│  ● Units Sold    ● Revenue                       │
└──────────────────────────────────────────────────┘
```

### 3. Monthly Comparison Chart (Product Detail)
**Location**: Product detail page  
**Purpose**: Year-over-year comparison  
**Features**:
- 📊 Side-by-side bar chart
- 📅 6-month comparison
- 🔄 Current year vs Previous year
- 🎨 Yellow bars (current) vs Gray bars (previous)

**Visual Layout**:
```
┌──────────────────────────────────────────────────┐
│  MONTHLY COMPARISON                               │
│                                                   │
│  Units                                            │
│  ┌────────────────────────────────────────────┐  │
│  │  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░ │  │
│  │  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░ │  │
│  │  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░ │  │
│  │  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░  ▓▓ ░░ │  │
│  └────────────────────────────────────────────┘  │
│   Jan    Feb    Mar    Apr    May    Jun         │
│                                                   │
│  ■ This Year    ■ Last Year                      │
└──────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Light Mode
- **Background**: White (#ffffff)
- **Text**: Dark charcoal (#0f1419)
- **Borders**: Light gray (rgba(0,0,0,0.15))
- **Primary**: Yellow (#fff44f)
- **Secondary**: Teal (#4ecdc4)
- **Success**: Emerald (#34d399)
- **Danger**: Rose (#f87171)

### Dark Mode
- **Background**: Dark charcoal (#2e2e2e)
- **Text**: Light gray (#f0f0f0)
- **Borders**: Subtle white (rgba(255,255,255,0.08))
- **Primary**: Yellow (#fff44f) - same
- **Secondary**: Teal (#4ecdc4) - same
- **Success**: Emerald (#34d399) - same
- **Danger**: Rose (#f87171) - same

## 🎯 Interactive Features

### Tooltips
When hovering over any chart point:
```
┌─────────────────────┐
│ January             │
│ ■ Units Sold: 45    │
│ ■ Revenue: BDT 1.2K │
└─────────────────────┘
```

### Trend Indicators
```
Positive: ↗ 15%  (Green background)
Negative: ↘ 8%   (Red background)
```

## 📱 Responsive Behavior

### Desktop (> 768px)
- Full-width charts
- All details visible
- Hover interactions enabled

### Tablet (768px - 1024px)
- Slightly compressed charts
- All features maintained
- Touch-friendly tooltips

### Mobile (< 768px)
- Stacked layouts
- Simplified tooltips
- Touch-optimized interactions

## 🔧 Technical Details

### Chart Library
- **Recharts** v2.x
- React-based
- SVG rendering
- Fully responsive

### Performance
- Memoized data generation
- No animations on mini charts
- Optimized re-renders
- Lazy loading ready

### Accessibility
- ARIA labels
- Keyboard navigation
- Screen reader support
- High contrast modes

## 🎬 Animation & Transitions

### On Load
- Smooth fade-in
- Progressive data reveal
- Gradient animations

### On Hover
- Tooltip appears instantly
- Highlight active data point
- Smooth color transitions

### Theme Switch
- Instant color updates
- No layout shift
- Smooth gradient transitions

## 📐 Dimensions

### Mini Sales Chart
- Width: 100% (responsive)
- Height: 60px
- Margin: 0

### Sales History Chart
- Width: 100% (responsive)
- Height: 280px
- Margin: { top: 10, right: 10, left: 0, bottom: 0 }

### Monthly Comparison Chart
- Width: 100% (responsive)
- Height: 280px
- Margin: { top: 10, right: 10, left: 0, bottom: 0 }

## 🚀 Usage Examples

### Product Card with Chart
```typescript
<ProductCard 
  product={product} 
  view="grid" 
/>
// Automatically includes mini sales chart
```

### Product Detail with Full Charts
```typescript
<SalesHistoryChart 
  productId={product.id} 
  productName={product.name} 
/>

<MonthlyComparisonChart 
  productId={product.id} 
/>
```

## 💡 Best Practices

1. **Data Loading**: Show skeleton loaders while fetching
2. **Error States**: Display friendly messages if data fails
3. **Empty States**: Show "No data available" with helpful text
4. **Performance**: Use pagination for large datasets
5. **Accessibility**: Always include alt text and ARIA labels

## 🎨 Customization Tips

### Change Chart Colors
```typescript
// In chart component
<Area
  stroke="#YOUR_COLOR"
  fill="url(#yourGradient)"
/>
```

### Adjust Height
```typescript
<ChartContainer 
  initialDimension={{ width: 600, height: 350 }}
>
```

### Modify Tooltip Format
```typescript
formatter={(value) => `${value} units`}
labelFormatter={(label) => `Month: ${label}`}
```

## 📊 Data Format

### Sales History Data
```typescript
interface SalesDataPoint {
  date: string;      // "Jan", "Feb", etc.
  sales: number;     // Units sold
  revenue: number;   // Total revenue
}
```

### Comparison Data
```typescript
interface MonthlyData {
  month: string;     // "Jan", "Feb", etc.
  current: number;   // This year's sales
  previous: number;  // Last year's sales
}
```

## 🔮 Future Enhancements

- [ ] Real-time data updates
- [ ] Export to PNG/PDF
- [ ] Custom date ranges
- [ ] Drill-down to daily view
- [ ] Predictive analytics
- [ ] Comparison with category average
- [ ] Seasonal trend indicators
- [ ] Anomaly detection highlights

# Chart.js Setup for CebuCrust Dashboard

To enable the interactive charts in the dashboard, you need to install Chart.js and vue-chartjs:

## Installation

```bash
npm install chart.js vue-chartjs
```

## What's Included

The dashboard includes two chart components:

1. **OrdersOverview.vue** - Line chart showing order trends over time
2. **RevenueTrend.vue** - Bar chart showing revenue trends over time

## Fallback Behavior

If Chart.js is not installed, the chart components will display a fallback message indicating that Chart.js needs to be installed. The dashboard will still function normally with all other features.

## Chart Features

- **Orders Overview**: Orange line chart with data points showing monthly order counts
- **Revenue Trend**: Orange bar chart showing monthly revenue in thousands
- Both charts are responsive and match the design from the provided image
- Charts automatically update when data changes in the Pinia store

## Data Source

Charts consume data from the `dashboard.ts` Pinia store:

- `ordersChartData` - Array of monthly order data
- `revenueChartData` - Array of monthly revenue data

The data structure includes:

```typescript
{
  month: string
  orders: number
  revenue: number
}
```



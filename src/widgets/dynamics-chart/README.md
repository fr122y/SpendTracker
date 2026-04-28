# Dynamics Chart Widget

Visualizes daily spending trends for the current month with an interactive
stacked bar chart and weekly reading aids.

## Public API (`index.ts`)

- `DailySpendingChart`: Recharts BarChart showing daily spending amounts

## State & Data

- `useSessionStore`: selectedDate for month scope and active-day highlighting
- `useExpenseStore`: expenses for aggregation
- Local `lib/daily-spending-data`: prepares daily chart data, weekday labels,
  week starts, and clipped week ranges

## Features

- Bar chart with day of month on X-axis and amount on Y-axis
- Weekday labels on the X-axis
- Dashed week-start markers for Mondays
- Week range labels clipped to the selected month
- Highlighted bar for selected date
- Click on bar to select that date
- Custom tooltip with Russian formatting
- Monthly personal, project, and total amounts in header

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`, `recharts`

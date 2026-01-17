# Dynamics Chart Widget

Visualizes daily spending trends for the current month with an interactive bar chart.

## Public API (`index.ts`)

- `DailySpendingChart`: Recharts BarChart showing daily spending amounts

## State & Data

- **Stores:**
  - `useSessionStore`: viewDate, selectedDate for highlighting
  - `useExpenseStore`: expenses for aggregation

## Features

- Bar chart with day of month on X-axis, amount on Y-axis
- Highlighted bar for selected date (blue vs emerald)
- Click on bar to select that date
- Custom tooltip with Russian formatting
- Monthly total in header
- Responsive sizing

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`, `recharts`

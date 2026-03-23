# Dynamics Chart Widget

Visualizes daily spending trends for the current month with an interactive bar chart.

## Public API (`index.ts`)

- `DailySpendingChart`: Recharts BarChart showing daily spending amounts

## State & Data

- `useSessionStore`: viewDate, selectedDate for highlighting
- `useExpenses`: expenses for aggregation

## Features

- Bar chart with day of month on X-axis and amount on Y-axis
- Highlighted bar for selected date
- Click on bar to select that date
- Custom tooltip with Russian formatting
- Monthly total in header

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`, `recharts`

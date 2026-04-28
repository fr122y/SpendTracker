# Dynamics Chart Widget

Visualizes daily spending trends for the current month with an interactive
stacked bar chart and weekly reading aids.

## Public API (`index.ts`)

- `DailySpendingChart`: Recharts BarChart showing daily spending amounts

## State & Data

- `useSessionStore`: selectedDate for month scope and active-day highlighting
- `useExpenseStore`: expenses for aggregation
- Local `lib/daily-spending-data`: prepares daily chart data, weekday labels for
  tooltips, week-start markers, and weekend spans

## Features

- Bar chart with sparse day-of-month ticks on X-axis and amount on Y-axis
- Dashed week-start markers for Mondays
- Subtle background highlight for Saturdays and Sundays
- Highlighted bar for selected date
- Click on bar to select that date
- Custom tooltip with weekday and Russian formatting
- Monthly personal, project, and total amounts in header

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/shared/lib`, `recharts`

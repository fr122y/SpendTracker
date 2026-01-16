# Dashboard Page

Main application page that composes all dashboard widgets into a unified view.

## Public API (`index.ts`)

- `DashboardPage`: Main page component that renders the expense tracking dashboard

## State & Data

- **Store:** Uses `useLayoutStore` for grid configuration
- **Actions:** Layout customization, widget visibility toggle

## Dependencies

- Uses: `@/widgets/calendar`, `@/widgets/expense-log`, `@/widgets/analysis`, `@/widgets/dynamics-chart`, `@/widgets/weekly-budget`, `@/widgets/savings`, `@/widgets/categories-settings`, `@/widgets/financial-settings`, `@/widgets/projects`

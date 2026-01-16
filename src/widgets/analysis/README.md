# Analysis Widget

Provides spending analysis with category breakdown and insights.

## Public API (`index.ts`)

- `AnalysisWidget`: Pie chart and breakdown of expenses by category

## State & Data

- **Store:** Reads from `useExpenseStore`, `useCategoryStore`
- **Actions:** Time period selection, category drill-down

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/shared/lib`

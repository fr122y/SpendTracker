# Widgets Layer

Composite UI blocks that combine entities and features. Widgets are page sections.

## Structure

Each widget folder contains:

- `ui/` - Composite component(s)
- `index.ts` - Public API exports
- `README.md` - Micro-documentation

## Widgets & Exports

| Widget                  | Export                     | Description                                                                                    |
| ----------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| **calendar**            | `Calendar`                 | Interactive calendar with month navigation, date selection, and expense/salary/advance markers |
| **expense-log**         | `ExpenseLog`               | Daily expense list with add form, filters project expenses                                     |
| **analysis**            | `AnalysisDashboard`        | Category breakdown with visual boxes sized by spending percentage                              |
| **dynamics-chart**      | `DailySpendingChart`       | Recharts bar chart showing daily spending for current month                                    |
| **weekly-budget**       | `WeeklyBudget`             | Progress bar with spent/remaining amounts and editable limit                                   |
| **savings**             | `SavingsSection`           | Wrapper for BucketEditor (income allocation)                                                   |
| **categories-settings** | `CategoriesSection`        | Wrapper for CategoryManager CRUD                                                               |
| **financial-settings**  | `FinancialSettingsSection` | Wrapper for FinancialSettings form                                                             |
| **projects**            | `ProjectsSection`          | Project grid with expandable details, expense form, and delete                                 |

## Rules

1. Widgets can depend on entities, features, and shared
2. Widgets MUST NOT depend on other widgets
3. Dashboard grid layout is controlled by `useLayoutConfig` and `useEditMode`
4. Use `next/dynamic` with `{ ssr: false }` for client-only widgets

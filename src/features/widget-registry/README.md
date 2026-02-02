# Widget Registry

Central registry for all dashboard widgets. Maps widget IDs to component metadata (component, title, icon).

## Public API (`index.ts`)

- `WIDGET_REGISTRY`: Record mapping WidgetId to WidgetRegistryEntry
- `WidgetRegistryEntry`: Interface for widget metadata (component, title, icon)

## State & Data

- **Type:** Static registry (no state management)
- **Widget IDs:** CALENDAR, EXPENSE_LOG, ANALYSIS, DYNAMICS, WEEKLY_BUDGET, SAVINGS, PROJECTS, CATEGORIES, SETTINGS

## Dependencies

- Uses: `@/widgets/*` (all 9 widgets)
- Uses: `@/shared/types` (WidgetId type)
- Uses: `lucide-react` (icons)

# Widgets Layer

Composite UI blocks that combine entities and features. Widgets are page sections.

## Structure

Each widget folder should contain:

- `ui/` - Composite component
- `index.ts` - Public API exports

## Widgets

- **expense-list** - Scrollable list of expenses with filters
- **expense-summary** - Total spending card
- **category-chart** - Pie/donut chart by category
- **monthly-chart** - Bar chart of monthly spending
- **budget-progress** - Progress bar for budget limits
- **quick-add** - Floating action button for quick expense entry

## Rules

1. Widgets can depend on entities, features, and shared
2. Widgets MUST NOT depend on other widgets
3. Dashboard grid layout is controlled by `useLayoutStore`
4. Use `next/dynamic` with `{ ssr: false }` for localStorage-dependent widgets

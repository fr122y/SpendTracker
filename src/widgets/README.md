# Widgets Layer

Composite UI blocks that combine entities and features. Widgets are page sections.

## Structure

Each widget folder should contain:

- `ui/` - Composite component
- `index.ts` - Public API exports

## Widgets

- **calendar** - Interactive calendar displaying daily expense totals
- **expense-log** - Scrollable list of expenses with filtering
- **analysis** - Spending analysis with category breakdown
- **dynamics-chart** - Time-series chart showing expense trends
- **weekly-budget** - Weekly spending progress against limits
- **savings** - Savings goals and progress tracking
- **categories-settings** - Category management CRUD interface
- **financial-settings** - Financial parameters configuration
- **projects** - Project budget tracking and management

## Rules

1. Widgets can depend on entities, features, and shared
2. Widgets MUST NOT depend on other widgets
3. Dashboard grid layout is controlled by `useLayoutStore`
4. Use `next/dynamic` with `{ ssr: false }` for localStorage-dependent widgets

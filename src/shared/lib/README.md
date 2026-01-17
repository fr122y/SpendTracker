# Shared Library

Utility functions and helpers used across the application.

## Public API (`index.ts`)

### Finance Selectors

- `getMonthlyExpenses(expenses, date)`: Filter expenses by month
- `getDailyExpenses(expenses, date)`: Filter expenses by specific date
- `getCategoryStats(expenses, date)`: Get category statistics for month (sorted by value)
- `getWeeklyStats(expenses, date, limit)`: Get weekly spending stats with boundaries

### Utilities

- `cn(...classes)`: Class name utility (tailwind-merge + clsx)

### Widget Registry (separate import)

**Note:** Import directly from `@/shared/lib/widget-registry` to avoid circular dependencies.

- `WIDGET_REGISTRY`: Mapping of `WidgetId` to component, title, and icon
- `WidgetRegistryEntry`: Type for registry entries

### Types

- `CategoryStat`: Category statistics with name, value, emoji, percent
- `WeeklyStat`: Weekly stats with spent, limit, start, end

## Usage Examples

```typescript
import {
  getMonthlyExpenses,
  getCategoryStats,
  getWeeklyStats,
} from '@/shared/lib'

// Get monthly expenses
const monthly = getMonthlyExpenses(expenses, new Date())

// Get category breakdown
const stats = getCategoryStats(expenses, new Date())
// Returns: [{ name: "Продукты", value: 5000, emoji: "🛒", percent: 45.5 }, ...]

// Get weekly budget status
const weekly = getWeeklyStats(expenses, new Date(), 10000)
// Returns: { spent: 7500, limit: 10000, start: "2024-01-15", end: "2024-01-21" }
```

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
- `evaluateMathExpression(expr)`: Safe math expression evaluator

### Widget Registry (moved to features layer)

**Note:** Widget registry has been moved to `@/features/widget-registry` to fix FSD layer violations.

- Import from `@/features/widget-registry` instead of shared layer

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

### Math Expression Evaluator

Safe parser for mathematical expressions without using `eval()`.

```typescript
import { evaluateMathExpression } from '@/shared/lib'

// Basic operations
evaluateMathExpression('5+3') // 8
evaluateMathExpression('10-3') // 7
evaluateMathExpression('4*5') // 20
evaluateMathExpression('100/4') // 25

// Operator precedence
evaluateMathExpression('2+3*4') // 14 (multiplication first)

// Parentheses
evaluateMathExpression('(2+3)*4') // 20

// Decimals (supports both . and , as separators)
evaluateMathExpression('10.5+0.5') // 11
evaluateMathExpression('10,5+0,5') // 11

// Edge cases
evaluateMathExpression('abc') // NaN (invalid input)
evaluateMathExpression('') // NaN (empty)
evaluateMathExpression('5/0') // Infinity
```

**Features:**

- Supports: `+`, `-`, `*`, `/`, parentheses `()`
- Respects operator precedence (multiplication/division before addition/subtraction)
- Handles negative numbers
- Supports Russian decimal separator (comma)
- Returns `NaN` for invalid expressions

# Shared Library

Utility functions and helpers used across the application.

## Public API (`index.ts`)

### Finance Selectors

- `getMonthlyExpenses(expenses, date)`: Filter expenses by month
- `getDailyExpenses(expenses, date)`: Filter expenses by specific date
- `getDailyOperations(expenses, date)`: Filter all operation types by date
- `getDailyExpenseTotal(expenses, date)`: Sum real expenses by date
- `getCategoryStats(expenses, date)`: Get category statistics for month (sorted by value)
- `getProjectOperations(expenses, projectId)`: Filter all operations for a project
- `getProjectSpent(expenses, projectId)`: Sum real project expenses
- `getProjectCashOnHand(expenses, projectId)`: Calculate outstanding project money on hand
- `getWeeklyStats(expenses, date, limit)`: Get weekly spending stats with boundaries
- `getWeeklyBudgetCoverage(expenses, date, limit)`: Calculate weekly personal spending coverage by personal limit, project top-ups, and uncovered overage
- `getEffectiveWeeklyLimit(limits, date, defaultLimit)`: Resolve the weekly
  budget limit effective for a selected week
- `getWeekBoundaries(date)`: Return Monday-Sunday ISO date boundaries for a
  date

### Utilities

- `cn(...classes)`: Class name utility (tailwind-merge + clsx)
- `evaluateMathExpression(expr)`: Safe math expression evaluator
- `showMutationRollbackToast(message?)`: Unified error toast for optimistic
  mutation rollback UX

### Widget Registry (moved to features layer)

**Note:** Widget registry has been moved to `@/features/widget-registry` to fix FSD layer violations.

- Import from `@/features/widget-registry` instead of shared layer

### Types

- `CategoryStat`: Category statistics with name, value, emoji, percent
- `WeeklyStat`: Weekly stats with spent, limit, start, end
- `WeeklyBudgetCoverage`: Weekly coverage split into personal, project top-up, and uncovered amounts
- `WeeklyLimitSetting`: Effective weekly limit record

## Usage Examples

```typescript
import {
  getMonthlyExpenses,
  getCategoryStats,
  getWeeklyBudgetCoverage,
} from '@/shared/lib'

// Get monthly expenses
const monthly = getMonthlyExpenses(expenses, new Date())

// Get category breakdown
const stats = getCategoryStats(expenses, new Date())
// Returns: [{ name: "Продукты", value: 5000, emoji: "🛒", percent: 45.5 }, ...]

// Get weekly budget coverage
const weekly = getWeeklyBudgetCoverage(expenses, new Date(), 10000)
// Returns personalCovered, projectCovered, projectTopUp, uncovered, and week boundaries
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

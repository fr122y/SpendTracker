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
- `getWeeklyBudgetCoverage(expenses, date, limit)`: Calculate weekly personal
  spending coverage by personal limit, project top-ups, and uncovered overage
- `getSharedWeeklyBudgetCoverage(expenses, sharedBudgetId, date, limit)`:
  Calculate weekly coverage for one shared budget without project top-ups
- `getWeeklyBudgetSummary(coverage)`: Derive real spent, base limit, top-ups,
  effective limit, non-negative remaining, and over-budget amount
- `isValidWeeklyLimitAmount(value)`: True for a finite weekly limit in
  `(0, MAX_MONEY_AMOUNT]`
- `isWeekStartDate(value)`: True for a real `YYYY-MM-DD` date that is a Monday
- `getEffectiveWeeklyLimit(limits, date, defaultLimit)`: Resolve the weekly
  budget limit effective for a selected week
- `getWeekBoundaries(date)`: Return Monday-Sunday ISO date boundaries for a
  date

### Pocket History (`pocket-history.ts`)

- `getPocketMonthHistory({ pocketId, pocketCreatedAt, budgets, expenses, selectedPeriod })`:
  per-month budget, spent, and remainder (negative = overspend) from the
  pocket's first month to `selectedPeriod`, newest first; a month without a
  saved budget carries the latest earlier one, or 0. Read-only.

### Income Allocation (`allocation.ts`)

- `getBucketAmountKopecks(bucket, incomeKopecks)`, `calculateAllocation(buckets, incomeKopecks)`: bucket amounts, allocated total, and the operations remainder in kopecks
- `rublesToKopecks`, `percentageToKopecks`, `amountToPercentage`, `formatKopecks`, `formatPercentage`, `formatEditableKopecks`: currency-safe conversions and display formatting
- Used by `features/manage-buckets` and `features/calculator`

### Salary And Advance Days (`payday.ts`)

- `getPaydayInMonth(day, year, month)`: the day a saved salary or advance day
  falls on in a month, `min(day, daysInMonth)`; weekends are not shifted
- `isValidPaydayDay(value)`, `PAYDAY_MIN`, `PAYDAY_MAX`: a valid saved day is
  an integer 1–31; used by `widgets/calendar` and the settings Server Action

### Utilities

- `cn(...classes)`: Class name utility (tailwind-merge + clsx)
- `evaluateMathExpression(expr)`: Safe math expression evaluator
- `parseAmountInput(raw, { allowZero?, max? })`: Parse a typed amount
  (thousands spaces, `,` or `.` decimals, expressions) into a value rounded to
  kopecks or a Russian error; no partial parse
- `isValidMoneyAmount(value, { allowZero?, max? })`: Server-side check for a
  finite amount in `(0, MAX_MONEY_AMOUNT]` (`[0, …]` with `allowZero`)
- `MAX_MONEY_AMOUNT`: 100 000 000 ₽ cap for amounts in forms and Server Actions
- `getSafeCallbackUrl(callbackUrl, fallback?)`: allow only same-app relative
  auth redirect targets
- `showMutationRollbackToast(message?)`: Unified error toast for optimistic
  mutation rollback UX
- `useSubmitLock()`: ref-based lock for form submits; rapid repeated submits
  run the task once until it settles
- `getPocketNameKey`, `findPocketNameConflict`, `POCKET_NAME_CONFLICT_MESSAGE`
  (`pocket-name.ts`): trimmed, case-insensitive pocket name comparison shared
  by the forms and the pocket Server Actions
- `pluralizeRu(count, [one, few, many])` (`plural.ts`): Russian plural form
  for a count, with the 11–14 exceptions
- `useViewport()` / `useResolvedViewport()`: viewport category; the second
  returns `null` on the server and during hydration, so a layout can show a
  neutral placeholder instead of a guessed desktop tree
- `requestWidgetReveal(id)` / `subscribeWidgetReveal(listener)`
  (`widget-reveal.ts`): ask the mounted mobile accordion to open a widget and
  scroll to it; a no-op when no layout listens

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
evaluateMathExpression('1.2.3') // NaN (no partial number)
```

**Features:**

- Supports: `+`, `-`, `*`, `/`, parentheses `()`
- Respects operator precedence (multiplication/division before addition/subtraction)
- Handles negative numbers
- Supports Russian decimal separator (comma)
- Returns `NaN` for invalid expressions

### Account Email Delivery

Server-only templates, outbox, and Resend wrapper for account emails. Import
these modules directly from server code; do not re-export them from the general
`@/shared/lib` barrel because that barrel is used by client components.

```typescript
import { createPasswordResetEmail } from '@/shared/lib/account-email-templates'
import { enqueueAccountEmail } from '@/shared/lib/account-email-outbox'

const emailPayload = createPasswordResetEmail({
  resetUrl: 'https://spendtracker.online/reset-password/token',
  expiresInMinutes: 15,
})

await enqueueAccountEmail({
  type: 'auth.reset_password',
  to: 'user@example.com',
  userId: 'user-id',
  subject: emailPayload.subject,
  text: emailPayload.text,
  html: emailPayload.html,
  idempotencyKey: 'auth.reset_password:user-id:token-id',
})
```

Required production environment:

- `RESEND_API_KEY`
- `ACCOUNT_EMAIL_FROM`
- `RESEND_WEBHOOK_SECRET`
- `ACCOUNT_EMAIL_REPLY_TO` (optional)

In development and tests, missing `RESEND_API_KEY` logs a safe preview instead
of sending a real email. Email provider secrets must stay server-only and must
not use `NEXT_PUBLIC_*`.

Production readiness checklist:
`docs/context/ACCOUNT_EMAIL_PRODUCTION_CHECKLIST.md`.

### Account Email Webhooks And Suppression

Resend delivery webhooks are handled by
`@/shared/lib/account-email-webhooks`. The processor verifies the raw webhook
payload with `RESEND_WEBHOOK_SECRET`, stores auditable delivery events, updates
account email message status, and suppresses bounced, complained, or
provider-suppressed recipients.

`processAccountEmailOutbox` checks the suppression list before provider sends.
Suppressed recipients are marked as `suppressed` without calling Resend.

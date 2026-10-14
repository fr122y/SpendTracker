# Calculator

Floating calculator for transfer amounts: a round button in the bottom-right corner opens a dialog on desktop or a bottom sheet on mobile. Input comes only from on-screen buttons; chips insert values from «Накопления» as plain ruble numbers, and «Скопировать» copies the result as a plain number (`12345.67`).

## Public API (`index.ts`)

- `CalculatorLauncher`: Floating button plus the calculator dialog/sheet; mounted by `_pages/dashboard`

## State & Data

- **Store:** none. The expression and copy status are local component state; nothing is persisted.
- **Data:** monthly income from `useSettingsStore` and buckets from `useBucketStore` (TanStack Query), converted with the shared allocation math in kopecks.
- `lib/expression.ts`: expression editing, value insertion, evaluation via `evaluateMathExpression` rounded to kopecks, display and copy formats
- `lib/savings-values.ts`: chips for income, each bucket, and «Операции (остаток)»; integer kopecks→rubles conversion

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/lib`, `@/shared/types`

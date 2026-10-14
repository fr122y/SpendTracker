# Calculator

Floating calculator for transfer amounts. A round button in the bottom-right corner (hidden while open) opens a dialog on desktop (closes with × or Escape) or a bottom sheet on mobile (closes with ×, a downward swipe, or a backdrop tap; page scroll is locked while open). Input comes only from on-screen buttons, inserted at a visible caret that is placed by tapping the expression or moved with «←» «→». Chips insert live savings values; «Скопировать» (icon in the result line) copies the result as a plain number (`12345.67`).

## Public API (`index.ts`)

- `CalculatorLauncherDynamic`: client-only (`next/dynamic`, `ssr: false`) launcher; mounted by `_pages/dashboard`
- `CalculatorLauncher`: the launcher component itself (button plus dialog/sheet)

## State & Data

- **Store:** `calculatorAtom` (Reatom, `{ tokens, caret }`), persisted with `reatomPersistWebStorage` (Persistence key: `smartspend-calculator-v1`); corrupt or unknown data is discarded by `sanitizeCalculatorState`.
- **Actions:** `updateCalculator(update)`; read in React with `useCalculatorState()`.
- **Data:** monthly income from `useSettingsStore` and buckets from `useBucketStore` (TanStack Query), converted with the shared allocation math in kopecks.
- `lib/expression.ts`: token model (characters and indivisible savings values), caret moves, insertion with symmetric auto-`+` (value next to a number, digit next to a value), values serialised in parentheses so they never merge with digits, live evaluation by current amounts with last-known fallback, display and copy formats
- `lib/abbreviate.ts`: shortest label abbreviation («Месячный доход» → «Мес. д.»)
- `lib/savings-values.ts`: chips for income, each bucket, and «Операции (остаток)»; integer kopecks→rubles conversion
- `lib/swipe.ts`: swipe-down close threshold

## Dependencies

- Uses: `@/entities/bucket`, `@/entities/settings`, `@/shared/lib`, `@/shared/types`, `@reatom/core`

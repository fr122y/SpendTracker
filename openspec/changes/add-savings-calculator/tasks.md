# Tasks

## 1. Tests first

- [x] 1.1 Add failing unit tests for `features/calculator/lib`: building the expression from keys, backspace and clear, inserting values (replace trailing number, negative in parentheses), result rounding to kopecks, invalid expression and division by zero, copy format, and chips data from income, percentage buckets, and the remainder.
- [x] 1.2 Add failing UI tests for `CalculatorLauncher`: open and close, desktop dialog vs mobile bottom panel, swipe-down closing, chip insertion, `=` result, and «Скопировать» with confirmation.
- [x] 1.3 Add the e2e scenario `e2e/savings-calculator.spec.ts`: open, insert a savings value, operate, see the result and the copy control.

## 2. Implementation

- [x] 2.1 Move the pure allocation functions to `src/shared/lib/allocation.ts` and re-export them from `features/manage-buckets/lib/allocation.ts`; keep the `manage-buckets` tests green.
- [x] 2.2 Implement `features/calculator` lib and UI and mount `CalculatorLauncher` in `_pages/dashboard`.
- [x] 2.3 Add `src/features/calculator/README.md` and update the `_pages/dashboard` and `shared/lib` READMEs.

## 3. Verify

- [x] 3.1 Run `npm run spec:check` and `npm run validate`; record the results and any check not run. Result: `npm run spec:check` passed (4 passed, 0 failed); `npm run validate` passed (typecheck, lint, 95 suites, 1083 tests; 28 new calculator tests). Playwright was not run: it needs E2E credentials and a running app with a database; `playwright test --list` confirms the new scenario is collected.
- [x] 3.2 Review the full diff against `docs/engineering/code-review.md`. Result: the diff touches only the change folder, `shared/lib` (moved allocation math), `features/manage-buckets` (re-export, README), `features/calculator`, `_pages/dashboard`, and the new e2e spec; no schema, Server Action, or dependency change.
- [ ] 3.3 Manually verify on Vercel Preview: open the calculator on desktop and mobile, insert income, a percentage category, and the remainder, compute, copy, and paste the result.

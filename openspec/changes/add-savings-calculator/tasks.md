# Tasks

## 1. Tests first

- [x] 1.1 Add failing unit tests for `features/calculator/lib`: building the expression from keys, backspace and clear, inserting values (replace trailing number, negative in parentheses), result rounding to kopecks, invalid expression and division by zero, copy format, and chips data from income, percentage buckets, and the remainder.
- [x] 1.2 Add failing UI tests for `CalculatorLauncher`: open and close, desktop dialog vs mobile bottom panel, swipe-down closing, chip insertion, `=` result, and «Скопировать» with confirmation.
- [x] 1.3 Add the e2e scenario `e2e/savings-calculator.spec.ts`: open, insert a savings value, operate, see the result and the copy control.

## 2. Implementation

- [x] 2.1 Move the pure allocation functions to `src/shared/lib/allocation.ts` and re-export them from `features/manage-buckets/lib/allocation.ts`; keep the `manage-buckets` tests green.
- [x] 2.2 Implement `features/calculator` lib and UI and mount `CalculatorLauncher` in `_pages/dashboard`.
- [x] 2.3 Add `src/features/calculator/README.md` and update the `_pages/dashboard` and `shared/lib` READMEs.

## 3. Second iteration (owner review of the Preview)

- [x] 3.1 Update failing tests first: abbreviation table and edge cases, token model (insert at caret, delete, caret moves, auto-plus, live amounts, missing category fallback), persistence round trip and corrupt data, swipe threshold, launcher hidden while open, Escape and backdrop closing, scroll lock, icon copy control, caret placement by tap and arrows; update the e2e scenario. Result: before the implementation 22 tests failed and three new suites (abbreviation, swipe, store) could not load their modules; the e2e scenario now checks the abbreviated value, the result, the copy control, and the expression after a reload.
- [x] 3.2 Implement `lib/abbreviate.ts`, `lib/tokens.ts`, the Reatom `model/calculator-store.ts` with `withLocalStorage`, the caret UI and arrow keys, wider chips, the icon copy control, scroll lock, pointer/touch swipe, and the `next/dynamic` launcher. A digit typed right after a value gets no automatic `+` (ambiguous).
- [x] 3.3 Update `src/features/calculator/README.md`.

## 4. Fix: digit glued to a value (Preview of b47623c)

- [x] 4.1 Add failing regression tests through `pressKey`/`insertSavings` and evaluation: «5+Кв.» then «7», a digit before a value, a digit after a value followed by `(`, and adjacent number and value tokens evaluating to no result. Result: 7 tests failed before the fix (6 new, plus the fallback test updated for parenthesised values).
- [x] 4.2 Make auto-`+` symmetric for digits and the decimal separator next to a value, and wrap every value in parentheses when serialising.

## 5. Physical keyboard input

- [x] 5.1 Add failing tests: key mapping for each group (digits and keypad, operators, decimal keys, parentheses, Enter/`=`, Backspace, Delete, arrows), the focus rule for outside editable fields, ignored modifiers and composition, `preventDefault` only for handled keys, no handling after close, and Enter on a focused calculator button handled once; type an expression with the keyboard in the e2e scenario. Result: before the implementation the keyboard suite could not load and 5 UI tests failed; 4 guard tests (outside input, modifiers, after close, focused Enter) passed trivially without a listener and now guard the implementation.
- [x] 5.2 Implement `lib/keyboard.ts` and the panel's `keydown` listener through the same commands as the on-screen buttons.

## 6. Result continuation and value deletion (Preview of 53e30f8)

- [ ] 6.1 Add failing tests: after `=` a digit, `.`, `(`, or value starts a new expression, an operator continues, backspace/arrows/tap edit the result; deleting a value removes a redundant operator (between numbers, at the start, at the end, inside parentheses, the only token).
- [ ] 6.2 Implement `justEvaluated` and the operator clean-up in `lib/expression.ts`.

## 7. Verify

- [ ] 7.1 Run `npm run spec:check` and `npm run validate`; record the results and any check not run.
- [ ] 7.2 Review the full diff against `docs/engineering/code-review.md`.
- [ ] 7.3 Manually verify on Vercel Preview: open the calculator on desktop and mobile, insert income, a percentage category, and the remainder, move the caret, type an expression on a hardware keyboard, compute, copy, and paste the result; reload and see the expression restored.

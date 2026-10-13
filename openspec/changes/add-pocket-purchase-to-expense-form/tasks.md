# Tasks

## 1. Tests first

- [ ] 1.1 In `src/features/add-expense/__tests__/ExpenseForm.test.tsx`, mock `@/entities/pocket` and add failing tests: the scenario «Покупка из кармана» is offered with at least one non-archived pocket and absent with no pockets, with only archived pockets, and while the pocket list is not loaded; the pocket select lists only non-archived pockets; no date field is rendered; submit is blocked until a pocket is chosen.
- [ ] 1.2 Add failing tests for the saved operation: it carries `operationType: 'expense'`, the chosen `pocketId`, the dashboard `selectedDate`, the description, the amount, and the category name and emoji, and carries no `projectId` or shared-budget fields; keyword suggestion, manual category choice, and mapping persistence work as for a personal expense; no balance check prevents the submit.
- [ ] 1.3 Confirm the new tests fail for the expected reason and the existing `ExpenseForm` tests still pass.

## 2. Implementation

- [ ] 2.1 Add the `pocket_purchase` scenario to `ExpenseForm`: read pockets through `usePockets()` from `@/entities/pocket` (FSD: `features/add-expense` now imports `@/entities/pocket`, the allowed `features -> entities` direction), offer the scenario only when a non-archived pocket exists, and show a pocket select modelled on the project select.
- [ ] 2.2 Submit the purchase through the existing `useExpenseStore().addExpense` path as an `expense` with `pocketId`, reusing the personal category flow; add no date field, no balance check, and no transfer scenario. Do not change Server Actions, schema, or `src/features/manage-pockets`.
- [ ] 2.3 Update `src/features/add-expense/README.md`: public API description, state and data, logic flow, and the new `@/entities/pocket` dependency.

## 3. End-to-end

- [ ] 3.1 Add an e2e scenario: with an active pocket, record a purchase through the journal form, then check that it appears in the journal for the selected date and in the pocket's purchase history, and that the pocket's remaining amount decreases.

## 4. Verify

- [ ] 4.1 Run `npm run spec:check` and `npm run validate`; record the actual results, including any check that was not run and why.
- [ ] 4.2 Review the full diff against `docs/engineering/code-review.md`: only the change folder, `src/features/add-expense`, and the e2e scenario are touched; the saved record matches a purchase made by `PocketOperationForm`; the delta spec matches the behavior.
- [ ] 4.3 Manually verify on Vercel Preview: the scenario is offered with an active pocket and hidden without one; an archived pocket is not listed; a purchase recorded from the journal shows in the journal and in the pockets widget history for the selected date, reduces the remaining amount (including below zero), counts in total and category expenses, and does not count in the personal weekly operational spend.

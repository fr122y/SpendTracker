# Tasks

## 1. Tests first

- [x] 1.1 In `src/features/add-expense/__tests__/ExpenseForm.test.tsx`, mock `@/entities/pocket` and add failing tests: the scenario «Покупка из кармана» is offered with at least one non-archived pocket and absent with no pockets, with only archived pockets, and while the pocket list is not loaded; the pocket select lists only non-archived pockets; no date field is rendered; with exactly one non-archived pocket it is preselected and the purchase can be added without touching the select; with two or more the select starts empty and submit is blocked until a pocket is chosen.
- [x] 1.2 Add failing tests for the saved operation: it carries `operationType: 'expense'`, the chosen `pocketId`, the dashboard `selectedDate`, the description, the amount, and the category name and emoji, and carries no `projectId` or shared-budget fields; keyword suggestion, manual category choice, and mapping persistence work as for a personal expense; no balance check prevents the submit.
- [x] 1.3 Confirm the new tests fail for the expected reason and the existing `ExpenseForm` tests still pass. Result: 9 new tests failed before the implementation (scenario option and pocket select missing); the 15 existing tests passed.

## 2. Implementation

- [x] 2.1 Add the `pocket_purchase` scenario to `ExpenseForm`: read pockets through `usePockets()` from `@/entities/pocket` (FSD: `features/add-expense` now imports `@/entities/pocket`, the allowed `features -> entities` direction), offer the scenario only when a non-archived pocket exists, and show a pocket select modelled on the project select; preselect the pocket when exactly one is non-archived, otherwise start empty.
- [x] 2.2 Submit the purchase through the existing `useExpenseStore().addExpense` path as an `expense` with `pocketId`, reusing the personal category flow; add no date field, no balance check, and no transfer scenario. Do not change Server Actions, schema, or `src/features/manage-pockets`.
- [x] 2.3 Update `src/features/add-expense/README.md`: public API description, state and data, logic flow, and the new `@/entities/pocket` dependency.

## 3. End-to-end

- [ ] 3.1 Add an e2e scenario: with an active pocket, record a purchase through the journal form, then check that it appears in the journal for the selected date and in the pocket's purchase history, and that the pocket's remaining amount decreases. Status: the scenario `should record a purchase from the journal form` is added to `e2e/pockets.spec.ts` and passes typecheck, lint, and `playwright --list`; it was NOT run — `E2E_USER_EMAIL`/`E2E_USER_PASSWORD` are not set on the working machine, so the pockets scenario is skipped there. Left unchecked until it is run against a real account. Still not run at archive time (2026-10-13): the change is archived with this task open, and the Playwright scenario remains unverified.

## 4. Verify

- [x] 4.1 Run `npm run spec:check` and `npm run validate`; record the actual results, including any check that was not run and why. Result: `npm run spec:check` passed (5 passed, 0 failed); `npm run validate` passed (typecheck, lint, 91 suites, 1046 tests). Playwright was not run, see 3.1.
- [x] 4.2 Review the full diff against `docs/engineering/code-review.md`: only the change folder, `src/features/add-expense`, and the e2e scenario are touched; the saved record matches a purchase made by `PocketOperationForm`; the delta spec matches the behavior.
- [x] 4.3 Manually verify on Vercel Preview: the scenario is offered with an active pocket and hidden without one; an archived pocket is not listed; a purchase recorded from the journal shows in the journal and in the pockets widget history for the selected date, reduces the remaining amount (including below zero), counts in total and category expenses, and does not count in the personal weekly operational spend. Result: performed 2026-10-13 on the Preview deployment of head `901bd1e` with the agent test account; scenarios A–F passed (scenario offered with an active pocket and hidden without one, the only pocket preselected, select empty with two pockets, overspend allowed, archived pocket not listed, personal expense unaffected, totals correct).

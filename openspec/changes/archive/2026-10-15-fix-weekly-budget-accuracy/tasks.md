# Tasks

## 1. Tests first

- [x] 1.1 Add unit tests for `getWeeklyBudgetSummary`, `isValidWeeklyLimitAmount`, and `isWeekStartDate`, including the local Monday in UTC+10.
- [x] 1.2 Add server action tests: limit 0 and negative rejected, non-Monday or malformed week start rejected, `updateSettings` uses the client week start instead of the server clock.
- [x] 1.3 Update weekly budget UI tests: real spent when over budget, single over-budget line, effective limit with top-ups, hidden zero top-ups, zero and negative limit errors, label linked to input.
- [x] 1.4 Add an e2e scenario in `e2e/dashboard.spec.ts`: enter limit 0, see the error, reload, and see the saved limit unchanged. Result: run in CI by the `e2e` check against the Preview.

## 2. Implementation

- [x] 2.1 Add the selectors and validators to `src/shared/lib/finance-selectors.ts` and export them.
- [x] 2.2 Validate the limit and week start in `setWeeklyLimitForWeek` and `updateSettings`.
- [x] 2.3 Rework the weekly budget summary, top-up metrics, limit error, and label association.
- [x] 2.4 Update `src/widgets/weekly-budget/README.md` and `src/shared/lib/README.md`.

## 3. Shared budget limit follow-up

- [x] 3.1 Add server tests: `createSharedBudget` and `setSharedWeeklyLimitForWeek` reject 0, negative and non-finite limits before any write.
- [x] 3.2 Add UI tests: inline error for a zero limit on creation and a negative limit on edit.
- [x] 3.3 Apply `isValidWeeklyLimitAmount` in the shared budget server actions and forms; update the spec delta and the widget README.

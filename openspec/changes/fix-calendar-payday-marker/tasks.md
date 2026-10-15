# Tasks

## 1. Tests first

- [x] 1.1 Add unit tests for `getPaydayInMonth` and `isValidPaydayDay` in `src/shared/lib/__tests__/payday.test.ts`.
- [x] 1.2 Update calendar UI tests: marker on the last day of a short month, no weekend shift, label and range while editing, error instead of clamping.
- [x] 1.3 Add server action tests rejecting `salaryDay` / `advanceDay` outside 1–31.
- [x] 1.4 Add an e2e scenario in `e2e/dashboard.spec.ts`: open the salary editor, enter 35, see the error, cancel with Escape without saving. Result: run in CI by the `e2e` check against the Preview.

## 2. Implementation

- [x] 2.1 Add `src/shared/lib/payday.ts` and export it from `@/shared/lib`.
- [x] 2.2 Use `getPaydayInMonth` in `getCalendarDays` and rework the legend editor.
- [x] 2.3 Validate days in `updateSettings`.
- [x] 2.4 Update `src/widgets/calendar/README.md` and `src/shared/lib/README.md`.

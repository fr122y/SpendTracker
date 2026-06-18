# Task Run: T-009 Add shared budget selection to expense entry and journal

Date: 2026-06-18

Branch: `task/T-009-shared-budget-expense-log`

Issue: #TBD

PR: #21

## Summary

Implemented shared budget expense entry and journal filtering while preserving
the single existing expense log.

## Scope

- Planned: add shared expense selection to the add-expense form, show shared
  metadata in the journal, and add personal/shared scope filters.
- Out of scope: analytics scope switching, shared category management, database
  migrations, and project/shared expense mixing.
- Write scope: add-expense feature, expense-log widget, expense entity,
  focused tests, slice README files, and planning docs.

## Changes

- Added the `Общий расход` form scenario when active shared budgets exist.
- Shared expenses now use the selected shared budget category and pass
  `sharedBudgetId`/`sharedBudgetCategoryId` through the expense mutation path.
- Added journal budget-scope filters for all, personal, and shared operations
  alongside existing operation filters.
- Added shared expense card metadata for shared budget name and author.
- Preserved project expense, project withdrawal, and project return behavior.

## Files Touched

- `src/features/add-expense/**`
- `src/widgets/expense-log/**`
- `src/entities/expense/**`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm test -- --runTestsByPath src/features/add-expense/__tests__/ExpenseForm.test.tsx src/widgets/expense-log/__tests__/expense-log.test.tsx src/entities/expense/__tests__/ExpenseCard.test.tsx src/entities/expense/__tests__/queries.optimistic.test.ts`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: passed. Full validation: 63 suites, 792 tests.
- Not run: none.

## Review Checkpoint

- Scope checked: yes, against T-009.
- Acceptance criteria checked: yes, with focused tests for form selection,
  journal filters, shared metadata, optimistic shared fields, and project
  regression behavior.
- Regression risk checked: personal default, keyword mapping path, and project
  scenarios remain covered.
- Tracker consistency checked: yes, `python3 scripts/validate_task_tracker.py`
  passed.
- Docs checked: slice README files and planning docs updated.
- CI or PR status: PR #21 opened; local validation passed.

## Follow-Ups

- `T-010` remains responsible for analytics scope switching.
- `T-011` remains responsible for end-to-end two-user shared budget QA.

## Open Questions

- None.

## Registry Update Requested

- Move `T-009` to `review` before PR. Mark `done` only after review, merge, and
  post-merge reconciliation.

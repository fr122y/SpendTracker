# Task Run: T-013 Autoselect categories for shared expenses

Date: 2026-06-19

Branch: `task/T-013-shared-expense-autocategorization`

Issue: none

PR: #23

Merge commit: `9199d4b`

## Summary

Added shared budget keyword mappings so shared expenses can suggest categories
using the same fuzzy matching behavior as personal expenses without mixing
personal and shared category data.

## Scope

- Planned: shared expense category suggestions, shared mapping persistence,
  access checks, tests, migration, and docs.
- Out of scope: shared category management UI from `T-014`.
- Write scope: `drizzle/**`, `src/features/add-expense/**`,
  `src/entities/category/**`, `src/entities/keyword-mapping/**`,
  `src/entities/shared-budget/**`, `src/shared/api/**`, `src/shared/db/**`,
  `src/shared/lib/**`, `src/shared/types/**`, `docs/planning/**`.

## Changes

- Added `shared_budget_keyword_mapping` schema and migration.
- Added Server Actions for listing and upserting shared keyword mappings.
- Added TanStack Query hooks with optimistic update and rollback toast.
- Updated the add-expense form to suggest shared categories and learn manual
  shared category choices per shared budget.
- Updated focused API, entity, and form tests.

## Verification

- Checks run:
  - `npm test -- --runTestsByPath src/shared/api/__tests__/shared-keyword-actions.test.ts src/entities/keyword-mapping/__tests__/queries.optimistic.test.ts src/features/add-expense/__tests__/ExpenseForm.test.tsx`
  - `python3 scripts/validate_task_tracker.py`
  - `npm run typecheck`
  - `npm run validate`
- Result: passed. Full validation passed with 64 suites and 813 tests.
- Not run:
  - Browser/manual QA.

## Follow-Ups

- `T-014` will add user-facing shared budget category management.
- Apply `drizzle/0007_shared_budget_keyword_mappings.sql` in the target
  database with `npm run db:migrate`.

## Open Questions

- None.

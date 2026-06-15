# Task Run: T-006 Add shared budget categories

Date: 2026-06-15

Branch: `task/T-006-shared-budget-categories`

Issue: #TBD

PR: #13

## Summary

Implemented the shared budget category domain foundation: schema, migration,
category copy on shared budget creation, category Server Actions, shared expense
category validation, client query hooks, and focused tests.

## Scope

- Planned: independent shared budget category sets, creator-category snapshot,
  shared expense category enforcement, access-boundary tests.
- Out of scope: shared category management UI, invite flow, expense form scope
  picker, analytics scope switcher.
- Write scope: `src/entities/category/**`, `src/shared/api/**`,
  `src/shared/db/**`, `src/shared/types/**`, `drizzle/**`,
  `docs/planning/**`.

## Changes

- Added `shared_budget_category` and nullable
  `expense.sharedBudgetCategoryId`.
- Copied the creator's personal categories into the shared budget category set
  during `createSharedBudget`.
- Added Server Actions for listing, adding, updating, and archiving shared
  categories, guarded by shared budget membership.
- Updated shared expense creation so shared category name and emoji come from
  the shared category record, not from caller-provided private category data.
- Added query keys and hooks for shared budget categories.
- Added focused tests for category copy, shared expense category selection, and
  access boundaries.

## Files Touched

- `drizzle/0005_shared_budget_categories.sql`
- `src/shared/db/schema.ts`
- `src/shared/api/shared-category-actions.ts`
- `src/shared/api/shared-budget-actions.ts`
- `src/shared/api/expense-actions.ts`
- `src/entities/category/model/queries.ts`
- `src/shared/api/__tests__/shared-category-actions.test.ts`
- Planning docs

## Verification

- Checks run: `npm run typecheck`; focused Jest suite for shared budget,
  shared category, and shared expense actions; `npm run validate`;
  `python3 scripts/validate_task_tracker.py`.
- Result: Passed. Full validation passed with 60 suites and 762 tests.
- Not run: E2E tests; T-006 has no UI path yet.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: personal categories and project operations remain
  separate from shared category selection.
- Tracker consistency checked: yes.
- Docs checked: yes.
- CI or PR status: PR #13 merged to `main` with merge commit `d3dc1a4`.

## Follow-Ups

- `T-007` invite links.
- `T-009` expense form and journal UI for choosing shared budget scope and
  shared categories.

## Open Questions

- None for T-006.

## Registry Update Requested

- Mark `T-006` as `done` after PR #13 merge and tracker reconciliation.

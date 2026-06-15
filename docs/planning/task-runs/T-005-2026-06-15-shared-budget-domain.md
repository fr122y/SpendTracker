# Task Run: T-005 Define shared budget domain model and access rules

Date: 2026-06-15

Branch: `task/T-005-shared-budget-domain`

Issue: #TBD

PR: TBD

## Summary

Implemented the server-side shared budget foundation: database model, migration,
shared budget Server Actions, expense visibility/access rules, tests, and ADR.

## Scope

- Planned: shared budget domain model, membership, active selection, shared
  weekly limits, expense visibility, and access rules.
- Out of scope: invitation links, shared budget UI, shared categories, analytics
  filters, project transfers into shared budgets.
- Write scope: `src/shared/**`, `src/entities/expense/**`, `drizzle/**`,
  `docs/planning/**`, `docs/decisions/**`.

## Changes

- Added `shared_budget`, `shared_budget_member`, and
  `shared_budget_weekly_limit` schema and migration.
- Added nullable `expense.sharedBudgetId` while keeping `expense.userId` as the
  author.
- Added shared budget types and Server Actions for list, create, archive,
  active selection, and weekly limit upsert.
- Updated expense Server Actions so reads return current-user private expenses
  plus shared member expenses only.
- Guarded shared expense create/update/delete with server-side membership
  checks and kept shared expenses separate from project operations.
- Added focused unit tests for shared budget actions and shared expense access.
- Recorded ADR `docs/decisions/0002-shared-budget-domain.md`.

## Files Touched

- `drizzle/0004_shared_budget_domain.sql`
- `src/shared/db/schema.ts`
- `src/shared/api/shared-budget-actions.ts`
- `src/shared/api/expense-actions.ts`
- `src/shared/api/__tests__/shared-budget-actions.test.ts`
- `src/shared/api/__tests__/expense-actions.shared.test.ts`
- `src/shared/types/index.ts`
- `docs/decisions/0002-shared-budget-domain.md`
- Slice README and planning docs

## Verification

- Checks run: `npm run typecheck`; focused Jest suite for shared budget and
  expense actions; `npm run validate`.
- Result: Passed.
- Not run: E2E tests; T-005 has no UI path yet.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: personal expenses remain `sharedBudgetId = null`;
  shared visibility is membership-scoped.
- Tracker consistency checked: pending `python3 scripts/validate_task_tracker.py`
  after this report update.
- Docs checked: yes.
- CI or PR status: local validation passed; PR pending.

## Follow-Ups

- `T-006` shared budget categories.
- `T-007` invite links and member joining flow.
- `T-008` weekly budget UI support for shared budgets.
- `T-009` expense input/log support for choosing shared budget scope.

## Open Questions

- None for T-005.

## Registry Update Requested

- Move `T-005` to `review` until PR review and merge are complete.

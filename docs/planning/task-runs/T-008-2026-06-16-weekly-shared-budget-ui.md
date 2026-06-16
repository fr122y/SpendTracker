# Task Run: T-008 Extend weekly budget widget for shared budgets

Date: 2026-06-16

Branch: `task/T-008-weekly-shared-budget-ui`

Issue: #TBD

PR: #19

## Summary

Implemented the Weekly Budget widget shared-budget UX. The widget now keeps the
personal weekly budget visible and adds active shared budget creation,
selection, limit editing, invite link generation, member display, and
owner-only archival.

## Scope

- Planned: `T-008` shared weekly budget UI in the existing widget.
- Out of scope: expense entry/journal shared budget selection, analytics scope
  switcher, project-to-shared-budget transfers.
- Write scope: `src/widgets/weekly-budget/**`, `src/entities/**`,
  `src/shared/lib/**`, and planning docs.

## Changes

- Added `entities/shared-budget` TanStack Query hooks with optimistic updates
  and rollback toast behavior for shared budget mutations.
- Split weekly budget coverage into personal and shared calculations so shared
  expenses do not consume the personal weekly budget.
- Extended `WeeklyBudget` with active shared budget summary, member chips,
  create/select controls, shared weekly limit editor, invite link UI, copy
  action, and archive confirmation.
- Added focused hook, widget, and finance selector tests for shared budget
  behavior.
- Updated FSD slice documentation.

## Files Touched

- `src/entities/shared-budget/**`
- `src/widgets/weekly-budget/**`
- `src/shared/lib/**`
- `docs/planning/**`

## Verification

- Checks run: `npm run validate`, focused Jest tests for weekly budget/shared
  budget hooks/finance selectors, `python3 scripts/validate_task_tracker.py`.
- Result: passed.
- Not run: browser/manual two-user QA; covered by later `T-011`.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: personal weekly budget behavior covered by existing
  and updated tests.
- Tracker consistency checked: yes.
- Docs checked: yes.
- CI or PR status: PR #19 opened.

## Follow-Ups

- Continue with `T-009` after review/merge so the expense form and journal can
  use the shared budget entity hooks.
- Apply `T-007` invite migration in the target database before production QA if
  it has not already been applied.

## Open Questions

- None.

## Registry Update Requested

- `T-008` moved to `review`; PR #19 opened.

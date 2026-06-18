# Task Run: T-010 Add analytics scopes for visible expenses

Date: 2026-06-18

Branch: `task/T-010-shared-budget-analytics-scopes`

Issue: #TBD

PR: #22

## Summary

Added all/personal/shared scope switching to analytics, dynamics, and calendar
widgets using shared finance selectors.

## Scope

- Planned: scope-aware analytics, dynamics chart, calendar markers, tests, and
  docs.
- Out of scope: end-to-end two-user QA, release reconciliation, and category
  drilldown UX.
- Write scope: `src/shared/lib/**`, `src/widgets/analysis/**`,
  `src/widgets/dynamics-chart/**`, `src/widgets/calendar/**`,
  `docs/planning/**`.

## Changes

- Added shared `ExpenseScope` selectors for real expenses and operations.
- Extended category and daily chart aggregates with shared amounts.
- Added local `Все` / `Личные` / `Общие` filters to analysis, dynamics, and
  calendar widgets.
- Kept same-name personal/shared categories merged while exposing personal,
  shared, and project breakdowns.
- Updated focused selector and widget tests plus slice documentation.

## Files Touched

- `src/shared/lib/finance-selectors.ts`
- `src/widgets/analysis/**`
- `src/widgets/dynamics-chart/**`
- `src/widgets/calendar/**`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm test -- --runTestsByPath src/shared/lib/__tests__/finance-selectors.test.ts src/widgets/analysis/__tests__/analysis-dashboard.test.tsx src/widgets/dynamics-chart/__tests__/daily-spending-chart.test.tsx src/widgets/calendar/__tests__/calendar.test.tsx`
  - `npm run typecheck`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: passed. Full validation passed with 63 suites and 802 tests. Tracker
  validation passed with 12 tasks.
- Not run: none.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: focused selector/widget tests plus full validation.
- Tracker consistency checked: yes.
- Docs checked: slice docs updated.
- CI or PR status: PR #22 opened.

## Follow-Ups

- `T-011` will cover end-to-end shared budget QA.

## Open Questions

- None.

## Registry Update Requested

- `T-010` is ready for review in PR #22.

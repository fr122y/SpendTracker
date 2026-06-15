# Task Run: T-004 Add historical weekly personal budget limits

Date: 2026-06-15

Branch: `task/T-004-historical-weekly-limits`

Issue: #TBD

PR: #8

## Summary

Implemented historical personal weekly budget limits so changing a selected
week's limit no longer recalculates earlier weeks.

## Scope

- Planned: add an effective-week data model, migrate existing users from
  `user_settings.weeklyLimit`, update the weekly budget widget, and cover the
  behavior with focused tests.
- Out of scope: shared budgets, shared expenses, invite flows, analytics scope
  switching, and project behavior changes.
- Write scope: `src/entities/settings/**`, `src/widgets/weekly-budget/**`,
  `src/shared/api/**`, `src/shared/db/**`, `src/shared/lib/**`,
  `drizzle/**`, and planning/docs updates.

## Changes

- Added `weekly_budget_limit` schema and migration with a baseline backfill
  from `user_settings.weeklyLimit`.
- Added effective-week limit selectors and exported week boundary helpers.
- Extended settings server actions and TanStack Query hooks with
  `setWeeklyLimitForWeek`.
- Updated `WeeklyBudget` to read and update the limit for the selected week.
- Updated slice README files and tracker state.

## Files Touched

- `drizzle/0003_historical_weekly_limits.sql`
- `src/shared/db/schema.ts`
- `src/shared/api/settings-actions.ts`
- `src/entities/settings/model/queries.ts`
- `src/shared/lib/finance-selectors.ts`
- `src/widgets/weekly-budget/ui/weekly-budget.tsx`
- Focused tests under `src/**/__tests__`
- Slice README files and `docs/planning/**`

## Verification

- Checks run: `npm test -- --runInBand --runTestsByPath src/shared/lib/__tests__/finance-selectors.test.ts src/entities/settings/__tests__/store.test.ts src/entities/settings/__tests__/queries.optimistic.test.ts src/widgets/weekly-budget/__tests__/weekly-budget.test.tsx`
- Checks run: `npm run validate`
- Checks run: `python3 scripts/validate_task_tracker.py`
- Result: passed.
- Not run: database migration against a live database; SQL migration was added
  and covered by schema/type checks.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: weekly budget and settings behavior covered by
  focused tests plus full unit suite.
- Tracker consistency checked: yes.
- Docs checked: yes.
- CI or PR status: local validation and GitHub checks passed on PR #8.

## Follow-Ups

- Continue shared budget foundation with `T-005` after `T-004` is reviewed and
  merged.

## Open Questions

- None.

## Registry Update Requested

- Move `T-004` to `review`.

# Task Run: T-002 Refresh stale long-running app tabs

Date: 2026-06-19

Branch: `task/T-002-refresh-stale-tabs`

Issue: #3

PR: TBD

## Summary

Implemented app-resume freshness for long-running tabs without full page
reloads. The app now refreshes active TanStack Query data on focus/reconnect,
keeps date defaults aligned with the local day while the user is following
today, and preserves manually selected dates.

## Scope

- Planned: app resume/reconnect refresh, local day rollover handling, manual
  date preservation, focused tests, tracker updates.
- Out of scope: continuous realtime sync while an active tab remains open.
- Write scope: `src/entities/**`, `src/providers/**`, `docs/planning/**`.

## Changes

- Added session follow-today state and `syncTodayIfFollowing()`.
- Added `AppFreshnessController` under providers for focus, reconnect, and
  midnight freshness.
- Added focused tests for session rollover rules and app freshness events.
- Updated local slice/provider documentation.

## Files Touched

- `src/entities/session/**`
- `src/providers/**`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm test -- src/entities/session/__tests__/store.test.ts src/providers/__tests__/app-freshness-controller.test.tsx --runInBand`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: Passed.
- Not run: Playwright e2e; lifecycle behavior is covered by focused jsdom
  tests.

## Review Checkpoint

- Scope checked: Yes, changes are limited to session state, app providers,
  focused tests, and planning/docs updates.
- Acceptance criteria checked: Yes.
- Regression risk checked: Yes; optimistic mutation paths and Server Actions
  were not changed.
- Tracker consistency checked: Yes, task tracker validation passed.
- Docs checked: Yes.
- CI or PR status: Local validation passed; PR not opened yet.

## Follow-Ups

- None.

## Open Questions

- None.

## Registry Update Requested

- `T-002` moved to `review`; PR still needs to be opened.

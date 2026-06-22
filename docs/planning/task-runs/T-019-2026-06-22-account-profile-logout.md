# Task Run: T-019 Add account profile and logout

Date: 2026-06-22

Branch: `task/T-019-account-profile-logout`

Issue: none

PR: #31

Merge commit: none yet

## Summary

Implemented the minimal account v1. Authenticated users can open `/account`
from the dashboard header, see their name, email, and sign-in provider, and
sign out through a server action that redirects to `/login`.

## Scope

- Planned: account profile route, dashboard header entry, server-side logout,
  focused tests, and slice docs.
- Out of scope: profile editing, avatar UI, session/device management, email
  changes, password changes, and account security settings.
- Write scope: app account route, dashboard header widget, shared auth helper,
  focused tests, and planning docs.

## Changes

- Added a server-only account profile helper that resolves credentials versus
  OAuth provider information from the existing auth tables.
- Added `/account` with a protected server-rendered profile view and a
  form-based logout action using `signOut({ redirectTo: '/login' })`.
- Added dashboard header account navigation for mobile and desktop action
  groups without changing date navigation or edit-mode behavior.
- Added focused tests for account profile lookup, account page rendering,
  logout action behavior, and dashboard header account navigation.

## Verification

- Checks run:
  `npm test -- src/widgets/dashboard-header/__tests__/dashboard-header.test.tsx src/shared/auth/__tests__/account-profile.test.ts src/app/account/__tests__/account-actions.test.ts src/app/account/__tests__/account-page.test.tsx`,
  `npm run validate`, `python3 scripts/validate_task_tracker.py`.
- Result: focused tests passed with 4 suites and 21 tests; full validate
  passed with 72 suites and 876 tests. Existing `MobileWidgetModal` React
  `act(...)` warnings still appear and are unrelated to this task; tracker
  validation passed with 24 tasks.
- Not run yet: CI, manual browser QA.

## Review Checkpoint

- Scope checked: yes; no profile editing or session management was included.
- Acceptance criteria checked: yes; focused tests and full validation passed.
- Regression risk checked: yes; dashboard header tests were included.
- Tracker consistency checked: yes; tracker validation passes.
- Docs checked: yes; auth and dashboard header slice docs updated.
- CI or PR status: PR #31 opened.

## Follow-Ups

- None.

## Open Questions

- None.

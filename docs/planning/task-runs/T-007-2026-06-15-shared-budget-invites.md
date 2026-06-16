# Task Run: T-007 Add one-time invite links for shared budgets

Date: 2026-06-15

Branch: `task/T-007-shared-budget-invites`

Issue: #TBD

PR: #15

Merge: `d071d8b`

## Summary

Implemented one-time shared budget invite links with hashed token storage,
owner-only generation, seven-day expiry, explicit invite failure states, and a
public invite acceptance page that preserves auth callback flow.

## Scope

- Planned: shared budget invite persistence, Server Actions, public invite
  route, auth callback handling, focused tests, and slice docs.
- Out of scope: weekly budget widget invite UI; that remains in `T-008`.
- Write scope: `src/app/**`, `src/features/auth/**`, `src/shared/**`,
  `drizzle/**`, and `docs/planning/**`.

## Changes

- Added `shared_budget_invite` schema and migration with hashed one-time token
  storage.
- Added invite generation, preview, and acceptance Server Actions.
- Added `/invite/[token]` page with logged-out login/register CTA and logged-in
  explicit accept action.
- Preserved safe relative `callbackUrl` values through credentials, register,
  Google sign-in, and middleware redirect flow.
- Updated shared API, DB, lib, types, and auth feature docs.

## Files Touched

- `drizzle/0006_shared_budget_invites.sql`
- `src/shared/db/schema.ts`
- `src/shared/api/shared-budget-invite-actions.ts`
- `src/app/invite/[token]/**`
- `src/features/auth/**`
- `src/middleware.ts`
- `src/shared/types/index.ts`
- Slice README files under `src/shared/**` and `src/features/auth/`

## Verification

- Checks run: focused Jest for invite/auth callback tests, `npm run typecheck`,
  `npm run lint`, `npm run validate`.
- Result: passed. Full validate passed with 62 suites and 772 tests.
- Not run: Playwright e2e; no browser-level invite journey exists yet.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes, except widget-side invite display remains
  explicitly out of scope for `T-008`.
- Regression risk checked: auth redirects, invite token reuse, expiry, duplicate
  membership, and owner authorization covered by focused tests.
- Tracker consistency checked: pending final tracker validation.
- Docs checked: yes.
- CI or PR status: local validation passed; PR #15 merged.

## Follow-Ups

- `T-008` should call `createSharedBudgetInvite` from the weekly budget widget
  and display/copy the returned URL.
- Apply `0006_shared_budget_invites.sql` to the production database after merge.

## Open Questions

- None.

## Registry Update Requested

- `T-007` moved to `done` after PR #15 merged.

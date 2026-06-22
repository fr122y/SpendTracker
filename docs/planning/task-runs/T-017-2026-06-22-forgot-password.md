# Task Run: T-017 Add forgot password flow for credentials users

Date: 2026-06-22

Branch: `task/T-017-forgot-password`

Issue: none

PR: #30

Merge commit: `f18cc77`

## Summary

Implemented the credentials forgot-password flow. Users can request a reset
link without exposing whether an email exists, valid reset links allow setting
a new bcrypt-hashed password, and expired, used, invalid, OAuth-only, and
unknown-email cases are handled safely.

## Scope

- Planned: add reset-token persistence, Server Actions, account email delivery,
  forgot/reset UI, and focused tests.
- Out of scope: email outbox/retries, Resend webhooks, suppression lists,
  email verification, automatic post-reset sign-in, and rich email templates.
- Write scope: auth UI, app routes, shared API, shared DB schema/migration,
  slice docs, and planning docs.

## Changes

- Added `password_reset_token` schema and migration for hashed one-time reset
  tokens with expiry and use state.
- Added `requestPasswordReset`, `getPasswordResetTokenStatus`, and
  `resetPassword` Server Actions.
- Password reset requests return neutral success for unknown email addresses
  and OAuth-only users.
- Reset links expire after 15 minutes and use `APP_ORIGIN` in production with
  local development fallback to `http://localhost:3000`.
- Password updates use existing bcrypt hashing and atomically claim reset
  tokens before changing the password.
- Added `/forgot-password` and `/reset-password/[token]` routes plus login
  success messaging after reset.
- Added focused server and UI tests for request, reset, token status, link
  states, form validation, password visibility, and login redirect messaging.

## Files Touched

- `drizzle/0008_password_reset_tokens.sql`
- `src/shared/db/schema.ts`
- `src/shared/api/auth-actions.ts`
- `src/shared/api/index.ts`
- `src/app/forgot-password/page.tsx`
- `src/app/reset-password/[token]/page.tsx`
- `src/features/auth/**`
- `src/shared/**/README.md`
- `docs/planning/**`

## Verification

- Checks run:
  `npm test -- src/features/auth/__tests__/password-reset-actions.test.ts src/features/auth/__tests__/forgot-password-form.test.tsx src/features/auth/__tests__/reset-password-form.test.tsx src/features/auth/__tests__/credentials-sign-in-form.test.tsx src/features/auth/__tests__/auth-tabs.test.tsx src/features/auth/__tests__/register-action.test.ts`,
  `npm run typecheck`, `npm run lint`, `npm run validate`,
  `python3 scripts/validate_task_tracker.py`.
- Result: focused tests passed with 6 suites and 36 tests; typecheck and lint
  passed; full validate passed with 69 suites and 868 tests. Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task; tracker validation passed with 24 tasks.
- Not run yet: CI, manual real Resend send.

## Review Checkpoint

- Scope checked: yes; no email verification, outbox, webhook, or template
  follow-up work was included.
- Acceptance criteria checked: yes; focused tests and full validation passed.
- Regression risk checked: yes; registration and login form tests were included
  in the focused suite.
- Tracker consistency checked: yes; tracker validation passes.
- Docs checked: yes; auth/shared slice docs updated.
- CI or PR status: PR #30 merged to `main` as `f18cc77`.

## Follow-Ups

- `T-024` is still needed before production email sends can be smoke-tested
  with real Resend credentials and DNS.
- `T-021`/`T-022` remain the production hardening path for outbox retries,
  webhooks, and suppression.

## Open Questions

- None.

## Registry Update Requested

- No further action.

# Task Run: T-018 Add email verification for credentials registration

Date: 2026-06-23

Branch: `task/T-018-email-verification`

Issue: none

PR: #32

## Summary

Implemented advisory credentials email verification. Registration now creates a
24-hour hashed verification token and sends an `auth.verify_email` account
email. Unverified credentials users can still use the app, but the dashboard
shows a resend banner until `users.emailVerified` is set through
`/verify-email/[token]`.

## Scope

- Planned: email verification tokens, registration email send, resend action,
  verify route, dashboard banner, focused tests, docs, and tracker updates.
- Out of scope: blocking login/actions, email outbox/retries, Resend webhooks,
  suppression list, production Resend DNS/secrets, and rich email templates.
- Write scope: `src/app/**`, `src/features/auth/**`, `src/shared/api/**`,
  `src/shared/auth/**`, `src/shared/db/**`, `drizzle/**`, and
  `docs/planning/**`.

## Changes

- Added `email_verification_token` schema and SQL migration.
- Added registration/resend/verify/status Server Actions using hashed
  one-time tokens and the existing account email wrapper.
- Added `/verify-email/[token]` and a dashboard email verification banner.
- Preserved auto-login and callback URL behavior after registration.
- Updated auth, API, and DB slice docs.

## Files Touched

- `src/shared/api/auth-actions.ts`
- `src/shared/db/schema.ts`
- `drizzle/0009_email_verification_tokens.sql`
- `src/app/page.tsx`
- `src/app/verify-email/[token]/page.tsx`
- `src/features/auth/ui/email-verification-banner.tsx`
- Focused auth tests and slice/planning docs

## Verification

- Checks run:
  - `npm test -- --runTestsByPath src/features/auth/__tests__/register-action.test.ts src/features/auth/__tests__/password-reset-actions.test.ts src/features/auth/__tests__/email-verification-banner.test.tsx src/app/verify-email/[token]/__tests__/verify-email-page.test.tsx src/features/auth/__tests__/register-form.test.tsx --runInBand`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
- Result: passed. Full validation passed with 74 suites and 887 tests; existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Not run: PR checks are pending until PR creation.

## Review Checkpoint

- Scope checked: yes, limited to `T-018` email verification and required docs.
- Acceptance criteria checked: yes, local focused coverage added for
  registration send, verification, resend, expiry/reuse/concurrency, OAuth
  regression, and UI states.
- Regression risk checked: registration auto-login and invite callback behavior
  remain covered by existing form tests.
- Tracker consistency checked: yes.
- Docs checked: slice docs and planning docs updated.
- CI or PR status: PR #32 opened.

## Follow-Ups

- Apply `drizzle/0009_email_verification_tokens.sql` to target databases before
  relying on email verification in deployed environments.
- `T-021`, `T-022`, `T-023`, and `T-024` remain separate production-hardening
  tasks.

## Open Questions

- None.

## Registry Update Requested

- Mark `T-018` as `review` and link this task-run report.

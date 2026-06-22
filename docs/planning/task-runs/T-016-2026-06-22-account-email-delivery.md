# Task Run: T-016 Choose and integrate account email delivery

Date: 2026-06-22

Branch: `task/T-016-account-email-delivery`

Issue: none

PR: #29

Merge commit: `ed7dfe6`

## Summary

Implemented the account email delivery foundation for credentials account
flows. Resend is now the chosen provider, account email sends go through a
server-only wrapper with typed payloads and idempotency keys, and deferred
production-hardening work is captured as follow-up tasks.

## Scope

- Planned: choose and document account email provider, add server-only sender
  abstraction, cover success and failure behavior, and capture deferred email
  infrastructure tasks.
- Out of scope: password reset UI/tokens, email verification flow, email
  outbox, worker retries, Resend webhooks, suppression lists, and rich email
  templates.
- Write scope: `src/shared/lib/**`, shared/auth/api docs, decisions, planning
  docs, and package dependency metadata.

## Changes

- Added `resend` dependency.
- Added `src/shared/lib/account-email.ts` as a direct server-only module with
  `sendAccountEmail`, typed account email payloads, normalized results,
  normalized errors, Resend idempotency key support, and local dev console mode.
- Kept the email module out of the general `@/shared/lib` barrel so Resend is
  not pulled into client-used imports.
- Added focused Jest tests for real Resend sends, reply-to behavior, dev mode,
  missing production configuration, invalid input, provider errors, and missing
  provider message ids.
- Added ADR `0002` for the Resend account email decision and documented env,
  local behavior, verified sending domain requirements, and deferred hardening.
- Captured `T-021` email outbox/retries, `T-022` Resend webhooks/suppression,
  and `T-023` account email templates/production checklist.
- Captured `T-024` as the owner-led task for real Resend keys, DNS, and
  deployment env setup.

## Files Touched

- `package.json`
- `package-lock.json`
- `src/shared/lib/account-email.ts`
- `src/shared/lib/__tests__/account-email.test.ts`
- `src/shared/README.md`
- `src/shared/api/README.md`
- `src/shared/auth/README.md`
- `src/shared/lib/README.md`
- `docs/decisions/0002-account-email-delivery.md`
- `docs/planning/STATUS.md`
- `docs/planning/project-log.md`
- `docs/planning/tasks.md`
- `docs/planning/tasks.yml`

## Verification

- Checks run:
  `npm test -- src/shared/lib/__tests__/account-email.test.ts`,
  `npm run validate`, `python3 scripts/validate_task_tracker.py`.
- Result: passed. Full validate passed with 66 suites and 851 tests. Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Not run: manual Resend send against a real API key/domain; production DNS and
  Resend dashboard setup are operational steps outside this PR.

## Review Checkpoint

- Scope checked: yes; password reset and verification flows remain untouched.
- Acceptance criteria checked: yes; provider decision, server-only config,
  testable abstraction, secret boundary, focused tests, and validation are
  covered.
- Regression risk checked: yes; the server-only email module is not exported
  from the client-used shared barrel.
- Tracker consistency checked: yes; tracker validation passes with 23 tasks.
- Docs checked: yes; ADR, shared docs, project log, and task registry updated.
- CI or PR status: PR #29 merged to `main` as `ed7dfe6`.

## Follow-Ups

- `T-017` can use `sendAccountEmail` for forgot-password delivery.
- `T-018` can use `sendAccountEmail` for email verification delivery.
- `T-021` should add durable outbox and retries when account email reliability
  becomes the next production-hardening priority.
- `T-022` should add signed Resend webhooks and suppression handling.
- `T-023` should add reusable account email templates and production checklist
  refinement.
- `T-024` should configure Resend credentials, verified sending domain, DNS,
  and deployment env before production email verification.

## Open Questions

- None.

## Registry Update Requested

- PR #29 linked in the task registry.

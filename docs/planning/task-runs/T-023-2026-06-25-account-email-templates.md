# Task Run: T-023 Add account email templates and production checklist

Date: 2026-06-25

Branch: `task/T-023-account-email-templates`

Issue: none

PR: #35

Merge commit: `fe3a002`

## Summary

Added reusable plain TypeScript templates for account emails and documented the
production readiness checklist for Resend-backed sending.

## Scope

- Planned: password reset and email verification text/HTML templates,
  implementation decision documentation, production checklist, focused tests,
  and task tracker updates.
- Out of scope: React Email dependency, Resend webhook delivery events,
  suppression lists, schema changes, DNS changes, and Vercel env changes.
- Write scope: `src/shared/lib/**`, `src/shared/api/**`,
  `docs/context/**`, `docs/decisions/**`, and `docs/planning/**`.

## Changes

- Added `account-email-templates` as a server-only helper that returns
  subject, text, and email-safe inline-CSS HTML for reset-password and
  email-verification flows.
- Updated auth Server Actions to consume the shared templates instead of
  assembling email bodies inline.
- Documented the plain TypeScript template decision in ADR 0002.
- Added the account email production checklist for verified sender identity,
  DNS, Vercel env, smoke-tests, and known current limits.
- Updated shared API/lib README notes so account flows use the template and
  outbox modules together.

## Files Touched

- `src/shared/lib/account-email-templates.ts`
- `src/shared/lib/__tests__/account-email-templates.test.ts`
- `src/shared/api/auth-actions.ts`
- `docs/context/ACCOUNT_EMAIL_PRODUCTION_CHECKLIST.md`
- `docs/decisions/0002-account-email-delivery.md`
- `docs/planning/**`

## Verification

- Checks run:
  - `npm test -- account-email-templates.test.ts password-reset-actions.test.ts`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `npx prettier --check ...` for changed docs/template files
  - `git diff --check`
  - `python3 scripts/validate_task_tracker.py`
- Result: focused tests passed; typecheck passed; lint passed; full validation
  passed with 77 suites and 898 tests; formatting checks passed; task tracker
  validation passed.
- Not run: CI and manual real-email smoke-test.

## Review Checkpoint

- Scope checked: yes; no React Email, webhook, suppression, schema, DNS, or
  env work was included.
- Acceptance criteria checked: yes.
- Regression risk checked: auth action payload shape remains subject/text/html
  plus idempotency key.
- Tracker consistency checked: local validation passed.
- Docs checked: checklist, ADR, shared API/lib docs, and task-run report were
  updated.
- CI or PR status: PR #35 passed checks and merged.

## Follow-Ups

- `T-022` should add Resend webhooks and suppression so delivery outcomes are
  visible after provider `sent`.

## Open Questions

- None.

## Registry Update Requested

- Mark `T-023` done after post-merge tracker reconciliation.

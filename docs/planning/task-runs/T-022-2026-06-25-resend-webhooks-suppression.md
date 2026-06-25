# Task Run: T-022 Add Resend webhooks and suppression

Date: 2026-06-25

Branch: `task/T-022-resend-webhooks-suppression`

Issue: none

PR: #36

## Summary

Implemented signed Resend webhook handling for account emails, auditable
delivery event persistence, delivery status updates, and suppression checks
before provider sends.

## Scope

- Planned: webhook signature verification, delivery event persistence,
  delivery status updates, bounce/complaint/provider suppression, focused
  tests, and production setup docs.
- Out of scope: admin UI for events/suppressions, open/click tracking, and
  real Resend Dashboard/Vercel env configuration before merge.
- Write scope: `src/app/**`, `src/shared/db/**`, `src/shared/lib/**`,
  `docs/context/**`, `docs/decisions/**`, and `docs/planning/**`.

## Changes

- Added `account_email_event` and `account_email_suppression` schema plus
  migration `drizzle/0011_account_email_webhooks.sql`.
- Added a Resend webhook route that reads the raw request body, verifies
  `svix-*` headers with `RESEND_WEBHOOK_SECRET`, and processes account email
  delivery events.
- Added webhook processing that stores normalized event fields and full JSON
  payloads, updates matching account email message statuses, and suppresses
  bounced, complained, or provider-suppressed recipients.
- Updated outbox processing to skip provider sends for suppressed recipients
  and mark those messages `suppressed`.
- Updated production docs with webhook URL, required events, secret setup, and
  migration notes.

## Verification

- Checks run:
  - `npm test -- account-email-webhooks.test.ts account-email-outbox.test.ts route.test.ts`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run validate`
  - `python3 scripts/validate_task_tracker.py`
  - `git diff --check`
  - `npm run db:migrate`
- Result: focused tests passed; typecheck passed; lint passed; full validation
  passed with 79 suites and 909 tests; task tracker validation passed; diff
  whitespace check passed; migration `0011` is applied and a rerun reports
  nothing to apply.
- Not run yet: Resend Dashboard webhook setup, Vercel `RESEND_WEBHOOK_SECRET`
  redeploy, and deployed smoke-test.

## Review Checkpoint

- Scope checked: yes; no admin UI, open/click tracking, or external service
  configuration was included.
- Acceptance criteria checked: yes.
- Regression risk checked: account email sending still uses the existing
  outbox path; suppression only blocks addresses recorded in the new table.
- Tracker consistency checked: local validation passed.
- Docs checked: production checklist, ADR, shared lib/db docs, and task-run
  report updated.
- CI or PR status: PR #36 opened.

## Follow-Ups

- Create the Resend webhook pointing at `/api/webhooks/resend` if it was not
  created during secret setup.
- Redeploy Production and confirm real delivery events appear in the database.

## Open Questions

- None.

## Registry Update Requested

- Keep `T-022` in `review` until the PR is reviewed and merged.

# Task Run: T-021 Add email outbox and retries

Date: 2026-06-24

Branch: `task/T-021-email-outbox-retries`

Issue: none

PR: pending

Merge commit: pending

## Summary

Implemented a retryable account email outbox. Password reset and email
verification flows now persist email messages before provider sends, schedule
post-response processing with Next.js `after()`, and keep a Vercel Cron route
as a daily safety net for due retries.

## Decisions

- Primary worker mechanism: Next.js `after()` starts outbox processing after
  the user-facing Server Action returns.
- Safety-net worker mechanism: Vercel Cron runs
  `/api/cron/account-email-outbox` daily because the current Hobby plan only
  allows daily cron jobs. A Pro plan could change this schedule to once per
  minute later.
- Cron protection: require `Authorization: Bearer ${CRON_SECRET}`.
- Retry policy: provider/network failures retry with bounded backoff; input
  and configuration errors fail terminally.
- Out of scope: Resend webhooks, bounce/complaint suppression, and rich email
  templates remain in `T-022` and `T-023`.

## Changes

- Added `account_email_message` schema and migration for queued email bodies,
  provider metadata, idempotency keys, delivery status, and retry fields.
- Added `enqueueAccountEmail` and `processAccountEmailOutbox` server-only
  helpers.
- Changed auth reset and email-verification flows to enqueue account emails
  instead of sending synchronously.
- Added the Vercel Cron route and Hobby-compatible daily `vercel.json`
  schedule.
- Updated shared API/lib/db docs and focused tests.

## Verification

- Passed:
  `npm test -- --runTestsByPath src/shared/lib/__tests__/account-email-outbox.test.ts src/app/api/cron/account-email-outbox/__tests__/route.test.ts src/features/auth/__tests__/password-reset-actions.test.ts src/features/auth/__tests__/register-action.test.ts`
- Passed: `npm run typecheck`
- Passed: `npm run lint`
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed: `npm run validate` (76 suites, 895 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Passed: manual Vercel Preview deploy
  `dpl_CXc4kWPyMorimxpCeEo8M67LP9pB` after changing the cron schedule to the
  Hobby-compatible daily interval.

## Follow-Ups

- Apply `drizzle/0010_account_email_messages.sql` to target databases before
  relying on outbox-backed account emails.
- Configure `CRON_SECRET` in Vercel Production and redeploy.
- Smoke-test a password reset or email verification request after migration
  and cron secret setup.

## Registry Update Requested

- Mark `T-021` as `review` and link this task-run report.

# Status

Last updated: 2026-06-25

## Current Focus

- `T-022` - Add Resend webhooks and suppression remains the next technical
  email reliability follow-up so delivery outcomes are visible beyond
  provider `sent`.

## Active Branch

- None.

## Stable Branch

- `main`

## Next Action

Run a ready-check for `T-022` when webhook/suppression handling becomes the
next email reliability priority.

## Validation

- Passed: `npm run validate` for `T-004`.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-004`.
- PR #8 merged for `T-004` with merge commit `c93d3e8`.
- Passed: `npm run validate` for `T-005`.
- PR #10 merged for `T-005` with merge commit `780b638`.
- Passed: `npm run typecheck` for `T-006`.
- Passed: focused Jest tests for `T-006` shared budget category actions,
  shared budget category copy, and shared expense category validation.
- Passed: `npm run validate` for `T-006` (60 suites, 762 tests).
- Passed: `python3 scripts/validate_task_tracker.py` for `T-006`.
- PR #13 merged for `T-006` with merge commit `d3dc1a4`.
- Passed: `npm run validate` for `T-007` (62 suites, 772 tests).
- PR #15 merged for `T-007` with merge commit `d071d8b`.
- PR #16 merged tracker reconciliation for `T-007` with merge commit
  `6d62117`.
- PR #18 merged for `T-012` with merge commit `ba60151`.
- Passed: `python3 scripts/validate_task_tracker.py` after capturing shared
  budget tasks `T-004` through `T-011`.
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed: `npm run validate` for `T-008` (63 suites, 785 tests).
- PR #19 merged for `T-008` with merge commit `57238af`.
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- PR #1 merged to `main` with merge commit `a255d91`.
- GitHub issue #3 synced into local task tracker as `T-002`.
- GitHub issue #5 captured into local task tracker as backlog task `T-003`.
- PR #20 merged process refresh and Conventional Commit enforcement to `main`
  with squash commit `b2c4df4`.
- Passed for PR #20: `validate-task-tracker`, `commitlint`, `Vercel`, and
  `Vercel Preview Comments`.
- Passed: `npm run validate` for `T-009` (63 suites, 792 tests).
- Passed: `python3 scripts/validate_task_tracker.py` for `T-009`.
- PR #21 merged for `T-009` with merge commit `7374f89`.
- Passed: focused Jest tests for `T-010` selectors, analysis, dynamics, and
  calendar scope filters.
- Passed: `npm run validate` for `T-010` (63 suites, 802 tests).
- PR #22 opened for `T-010`.
- PR #22 merged for `T-010` with merge commit `d2d2a2a`.
- Manual QA closed `T-011`: shared budget v1 mechanics are usable, with
  category UX follow-ups captured as `T-013` and `T-014`.
- PR #23 merged for `T-013` with merge commit `9199d4b`.
- Passed: `npm run validate` for `T-014` (64 suites, 820 tests).
- Passed: `python3 scripts/validate_task_tracker.py` for `T-014`.
- PR #24 merged for `T-014` with merge commit `3c0acfa`.
- Passed: focused Jest tests for `T-002` session store and app freshness
  controller.
- Passed: `npm run validate` for `T-002` (65 suites, 830 tests).
- Passed: `python3 scripts/validate_task_tracker.py` for `T-002`.
- PR #25 opened for `T-002`.
- PR #25 merged for `T-002` with merge commit `88fecbd`.
- Captured account/auth and money precision backlog tasks `T-015` through
  `T-020`; `T-020` is the recommended next high-priority bugfix.
- Passed: `python3 scripts/validate_task_tracker.py` after capturing `T-015`
  through `T-020`.
- Passed: focused Jest tests for `T-020` MathInput precision normalization
  (40 tests).
- Passed: `npm run validate` for `T-020` (65 suites, 836 tests).
- Passed: `python3 scripts/validate_task_tracker.py` for `T-020`.
- PR #27 opened for `T-020`.
- PR #27 merged for `T-020` with merge commit `862670b`.
- Passed: `python3 scripts/validate_task_tracker.py` after reconciling
  `T-020`.
- Passed: focused Jest tests for `T-015` credentials and registration auth
  forms (15 tests).
- Passed: `npm run validate` for `T-015` (65 suites, 838 tests).
- PR #28 merged for `T-015` with merge commit `73b22c4`.
- Passed: `python3 scripts/validate_task_tracker.py` after reconciling
  `T-015`.
- Passed: focused Jest tests for `T-016` account email delivery (13 tests).
- Passed: `npm run validate` for `T-016` (66 suites, 851 tests).
- Passed: `python3 scripts/validate_task_tracker.py` after capturing `T-021`
  through `T-023` and moving `T-016` to review.
- PR #29 opened for `T-016`.
- Captured `T-024` for owner-led Resend secret, DNS, and deployment environment
  setup.
- PR #29 merged for `T-016` with merge commit `ed7dfe6`.
- Passed: focused Jest tests for `T-017` password reset actions and auth UI
  forms (6 suites, 36 tests).
- Passed: `npm run validate` for `T-017` (69 suites, 868 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-017`.
- PR #30 opened for `T-017`.
- PR #30 checks passed for `T-017`: Vercel, Vercel Preview Comments,
  commitlint, and validate-task-tracker.
- PR #30 merged for `T-017` with merge commit `f18cc77`.
- Passed: focused Jest tests for `T-019` account profile and logout
  (4 suites, 21 tests).
- Passed: `npm run validate` for `T-019` (72 suites, 876 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-019`.
- PR #31 opened for `T-019`.
- PR #31 merged for `T-019` with merge commit `440f463`.
- Passed: `python3 scripts/validate_task_tracker.py` after reconciling open
  task statuses and stale `T-016` follow-up text.
- Passed: focused Jest tests for `T-018` registration, email verification,
  resend banner, verify page, and registration form behavior (5 suites,
  35 tests).
- Passed: `npm run typecheck` for `T-018`.
- Passed: `npm run lint` for `T-018`.
- Passed: `npm run validate` for `T-018` (74 suites, 887 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- PR #32 opened for `T-018`.
- PR #32 merged for `T-018` with merge commit `63f4bf8`.
- Passed: `python3 scripts/validate_task_tracker.py` for the `T-024` runbook.
- PR #33 merged for the `T-024` runbook with merge commit `af895c1`; real
  Resend service, DNS, Vercel env, redeploy, and UI smoke-test are still
  pending owner setup.
- Completed external `T-024` setup: `spendtracker.online` is connected to
  Vercel, `mail.spendtracker.online` is verified in Resend, Production
  `APP_ORIGIN`, `ACCOUNT_EMAIL_FROM`, and `RESEND_API_KEY` are configured in
  Vercel, Production was redeployed, and the owner confirmed a real email
  verification message arrived.
- Passed: focused Jest tests for `T-021` account email outbox, cron route,
  password reset, and registration auth actions (4 suites, 30 tests).
- Passed: `npm run typecheck` for `T-021`.
- Passed: `npm run lint` for `T-021`.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-021`.
- Passed: `npm run validate` for `T-021` (76 suites, 895 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Passed: manual Vercel Preview deploy for `T-021`
  (`dpl_CXc4kWPyMorimxpCeEo8M67LP9pB`) after switching the cron schedule to a
  Hobby-compatible daily safety net.
- PR #34 merged for `T-021` with merge commit `bf15f81`.
- Post-merge `T-021` operational setup completed on Production:
  `drizzle/0010_account_email_messages.sql` is applied,
  `CRON_SECRET` is configured in Vercel, Production was redeployed, and
  outbox-backed account email delivery was smoke-tested.
- Direct owner-approved `main` hotfix `43fddf4` allowed unauthenticated access
  to `/forgot-password`, `/reset-password/[token]`, and
  `/verify-email/[token]`; Production redeploy
  `dpl_6a5YALmt5BsHK9AUS6Bxztnz1NAs` returned `200` for all three routes.
- Real reset-password requests created `auth.reset_password` outbox messages
  and Resend accepted them with provider status `sent`; one Gmail delivery
  landed in spam, reinforcing `T-023` and `T-022` as the next email follow-ups.
- Passed: focused Jest tests for `T-023` account email templates and password
  reset auth actions (2 suites, 18 tests).
- Passed: `npm run typecheck` for `T-023`.
- Passed: `npm run lint` for `T-023`.
- Passed: `npm run validate` for `T-023` (77 suites, 898 tests). Existing
  `MobileWidgetModal` React `act(...)` warnings still appear and are unrelated
  to this task.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-023`.
- PR #35 merged for `T-023` with squash commit `fe3a002`.

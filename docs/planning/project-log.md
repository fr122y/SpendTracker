# Project Log

## 2026-06-23

- Implemented `T-018` email verification on
  `task/T-018-email-verification`: credentials registration now issues
  24-hour verification links through the account email wrapper, unverified
  credentials users see a dashboard resend banner without being blocked from
  the app, `/verify-email/[token]` consumes one-time hashed tokens, and the
  `0009_email_verification_tokens.sql` migration is required.
- Reconciled open task status text directly on `main`: restored `T-003` to
  `backlog` and clarified that `T-016` is already complete for dependent email
  follow-ups.
- Merged PR #31 for `T-019` into `main` as `440f463` and reconciled the task
  to `done`.

## 2026-06-22

- Implemented `T-019` account profile and logout on
  `task/T-019-account-profile-logout`: added `/account`, server-side account
  provider lookup, form-based logout redirecting to `/login`, dashboard header
  account navigation, focused tests, and slice docs.
- Implemented `T-017` forgot password flow on
  `task/T-017-forgot-password`: added hashed one-time reset tokens, neutral
  reset requests, Resend-backed account email delivery, reset-token status UI,
  atomic token claiming before password update, focused tests, and full
  `npm run validate`.
- Merged PR #30 for `T-017` into `main` as `f18cc77`; the
  `0008_password_reset_tokens.sql` migration has been applied to the configured
  Supabase database.
- Started `T-016` account email delivery on
  `task/T-016-account-email-delivery`: chose Resend, added a server-only
  account email contract with idempotency keys, documented production email
  requirements, and captured deferred email outbox, webhook/suppression, and
  template follow-ups as `T-021` through `T-023`.
- Captured `T-024` as the owner-led Resend secret, DNS, and deployment
  environment setup task so production email credentials are not forgotten.
- Merged PR #29 for `T-016` into `main` as `ed7dfe6`.
- Implemented `T-015` auth form password visibility controls on
  `task/T-015-auth-form-ux`: login and registration password fields now have
  accessible show/hide toggles, existing Auth.js credentials and callback URL
  behavior is covered by focused tests, and full `npm run validate` passed.
- Merged PR #28 for `T-015` into `main` as `73b22c4` and reconciled the task to
  `done`.
- Implemented `T-020` MathInput precision normalization on
  `task/T-020-money-math-precision`: evaluated values now round to at most two
  decimal places, whole-number results drop trailing zeroes, floating-point
  tails are covered by regression tests, and full `npm run validate` passed.
- Merged PR #27 for `T-020` into `main` as `862670b` and reconciled the task to
  `done`.

## 2026-06-19

- Implemented `T-002` app-resume freshness on
  `task/T-002-refresh-stale-tabs`: active query refresh on focus/reconnect,
  follow-today date rollover, local midnight scheduling, long-resume toast
  feedback, manual date preservation, focused tests, and full
  `npm run validate`.
- Merged PR #25 for `T-002` into `main` as `88fecbd` and reconciled the task
  to `done`.
- Implemented `T-014` shared budget category management in the existing
  categories widget: personal/shared category modes, shared budget selection,
  member add/edit/archive flows, duplicate-name checks, retroactive linked
  shared expense label updates, cache invalidation, and focused tests.
- Merged PR #24 for `T-014` into `main` as `3c0acfa` and reconciled the task
  to `done`.
- Implemented `T-013` shared expense autocategorization on
  `task/T-013-shared-expense-autocategorization`: shared budget keyword mapping
  schema, Server Actions, optimistic query hooks, shared expense suggestions,
  manual choice learning, and focused tests.
- Merged PR #23 for `T-013` into `main` as `9199d4b`; target databases now
  need the `0007_shared_budget_keyword_mappings.sql` migration.
- Closed `T-011` shared budget release QA from manual owner verification:
  shared budget creation, invitation, shared expense usage, visibility, and
  analytics behavior are broadly working in real use.
- Captured shared budget category UX follow-ups as `T-013` and `T-014`:
  automatic category selection for shared expenses and management of shared
  budget categories.

## 2026-06-18

- Implemented `T-010` shared budget analytics scopes on
  `task/T-010-shared-budget-analytics-scopes`: shared scope selectors, analysis
  scope filter, dynamics chart scope filter, calendar marker scope filter,
  focused tests, slice README updates, and full `npm run validate`.
- Merged PR #22 for `T-010` into `main` as `d2d2a2a` and reconciled the task
  to `done`.
- Implemented `T-009` shared budget expense-log UX on
  `task/T-009-shared-budget-expense-log`: shared expense selection in the
  add-expense form, shared category submission, personal/shared journal scope
  filters, shared expense card metadata, focused tests, and slice README
  updates.
- Merged PR #21 for `T-009` into `main` as `7374f89` and reconciled the task to
  `done`.
- Merged PR #20 into `main` as `b2c4df4`, completing the owner-approved
  project workflow refresh with engineering process docs, adoption audit,
  expanded PR template, Conventional Commit enforcement through Husky
  `commit-msg`, and GitHub Actions validation for PR commits and titles.
- Deleted the obsolete `task/process-rules-refresh` branch after the squash
  merge and reconciled planning docs under the direct docs reconciliation
  exception.

## 2026-06-16

- Adopted the refreshed project-task-tracking process rules under an
  owner-approved process exception without adding a new ledger task: added
  engineering workflow docs, adoption audit, PR/squash title guidance,
  self-review rules, and an expanded PR template while preserving the existing
  GitHub PR flow, Compact Merge Flow, direct docs reconciliation exception, and
  `github_issue` ledger fields.
- Added technical Conventional Commit enforcement to the process refresh:
  commitlint validates local commit messages through Husky `commit-msg`, and
  GitHub Actions validates PR commit messages plus PR titles.
- Started `T-012` to reduce token/time overhead in routine merge and tracker
  reconciliation while preserving scoped branches, PR history, and task
  tracking.
- Merged PR #18 for `T-012` into `main` as `ba60151` and reconciled the task
  to `done` using the new direct docs reconciliation exception.
- Implemented `T-008` weekly shared budget widget UX with shared budget entity
  hooks, active shared budget selection, shared limit editing, invite link UI,
  owner archival, focused tests, and full `npm run validate`.
- Merged PR #19 for `T-008` into `main` as `57238af` and reconciled the task
  to `done`.

## 2026-06-15

- Implemented `T-004` historical personal weekly budget limits with
  effective-week records, migration/backfill from `user_settings.weeklyLimit`,
  weekly budget widget integration, focused tests, and full `npm run validate`.
- Merged PR #8 for `T-004` into `main` as `c93d3e8` and reconciled the task to
  `done`.
- Captured the shared weekly budget product direction as phased tracker tasks
  `T-004` through `T-011`.
- Fixed the intended shared budget model: personal budgets remain private,
  shared budgets use invite links and membership, visible expense aggregates
  include only the current user's personal expenses plus shared expenses where
  the user is a member, and projects remain out of scope for the first shared
  budget wave.
- Implemented `T-005` shared budget domain foundation with database schema,
  migration, server actions, expense visibility rules, focused tests, ADR, and
  full `npm run validate`.
- Merged PR #10 for `T-005` into `main` as `780b638` and reconciled the task to
  `done`.
- Implemented `T-006` shared budget category foundation with independent shared
  category sets, creator-category snapshot, shared expense category validation,
  client query hooks, migration, and focused tests.
- Merged PR #13 for `T-006` into `main` as `d3dc1a4` and reconciled the task
  to `done`.
- Implemented `T-007` shared budget invite links with hashed one-time tokens,
  seven-day expiry, public invite acceptance flow, safe auth callback redirects,
  migration, focused tests, and full `npm run validate`.
- Merged PR #15 for `T-007` into `main` as `d071d8b` and reconciled the task
  to `done`.

## 2026-05-14

- Started integrating the repository-local `project-task-tracking` framework
  into SmartSpend Tracker.
- Adapted the framework with SmartSpend Tracker project context, task ledger,
  GitHub templates, validation scripts, and local Codex skill.
- Merged PR #1 and reconciled `T-001` to `done`.
- Synced GitHub issue #3 into the local task tracker as ready task `T-002`.
- Captured GitHub issue #5 into the local task tracker as backlog task `T-003`.

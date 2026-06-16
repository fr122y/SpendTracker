# Project Log

## 2026-06-16

- Started `T-012` to reduce token/time overhead in routine merge and tracker
  reconciliation while preserving scoped branches, PR history, and task
  tracking.
- Merged PR #18 for `T-012` into `main` as `ba60151` and reconciled the task
  to `done` using the new direct docs reconciliation exception.

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

# Project Log

## 2026-06-15

- Implemented `T-004` historical personal weekly budget limits with
  effective-week records, migration/backfill from `user_settings.weeklyLimit`,
  weekly budget widget integration, focused tests, and full `npm run validate`.
- Captured the shared weekly budget product direction as phased tracker tasks
  `T-004` through `T-011`.
- Fixed the intended shared budget model: personal budgets remain private,
  shared budgets use invite links and membership, visible expense aggregates
  include only the current user's personal expenses plus shared expenses where
  the user is a member, and projects remain out of scope for the first shared
  budget wave.

## 2026-05-14

- Started integrating the repository-local `project-task-tracking` framework
  into SmartSpend Tracker.
- Adapted the framework with SmartSpend Tracker project context, task ledger,
  GitHub templates, validation scripts, and local Codex skill.
- Merged PR #1 and reconciled `T-001` to `done`.
- Synced GitHub issue #3 into the local task tracker as ready task `T-002`.
- Captured GitHub issue #5 into the local task tracker as backlog task `T-003`.

# Status

Last updated: 2026-06-18

## Current Focus

- `T-010` - Add analytics scopes for visible expenses.

## Active Branch

- `task/T-010-shared-budget-analytics-scopes`

## Stable Branch

- `main`

## Next Action

Open PR and complete self-review for `T-010` analytics scope switching.

Shared budget product discussion has been captured as phased backlog tasks
`T-004` through `T-011`; `T-010` is in review.

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

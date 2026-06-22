# Status

Last updated: 2026-06-22

## Current Focus

- `T-017` forgot password flow is implemented locally and ready for PR review.

## Active Branch

- `task/T-017-forgot-password`

## Stable Branch

- `main`

## Next Action

Open a PR for `T-017` and wait for checks.

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

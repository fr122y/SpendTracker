# Status

Last updated: 2026-06-15

## Current Focus

- `T-007` - Add one-time invite links for shared budgets is implemented and
  ready for PR review.

## Active Branch

- `task/T-007-shared-budget-invites`

## Stable Branch

- `main`

## Next Action

Commit and push `T-007`, then open a PR for review.

Shared budget product discussion has been captured as phased backlog tasks
`T-004` through `T-011`; `T-008` is the next shared budget UX task after
`T-007` is reviewed and merged.

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
- Passed: `python3 scripts/validate_task_tracker.py` after capturing shared
  budget tasks `T-004` through `T-011`.
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- PR #1 merged to `main` with merge commit `a255d91`.
- GitHub issue #3 synced into local task tracker as `T-002`.
- GitHub issue #5 captured into local task tracker as backlog task `T-003`.

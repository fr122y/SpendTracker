# Status

Last updated: 2026-06-15

## Current Focus

- `T-005` - Define shared budget domain model and access rules.

## Active Branch

- `task/T-005-shared-budget-domain`

## Stable Branch

- `main`

## Next Action

Review PR for `T-005` shared budget server-side domain model and access rules,
then merge and reconcile task state.

Shared budget product discussion has been captured as phased backlog tasks
`T-004` through `T-011`; `T-005` is now the active foundation task.

## Validation

- Passed: `npm run validate` for `T-004`.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-004`.
- PR #8 merged for `T-004` with merge commit `c93d3e8`.
- Passed: `npm run validate` for `T-005`.
- Passed: `python3 scripts/validate_task_tracker.py` after capturing shared
  budget tasks `T-004` through `T-011`.
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- PR #1 merged to `main` with merge commit `a255d91`.
- GitHub issue #3 synced into local task tracker as `T-002`.
- GitHub issue #5 captured into local task tracker as backlog task `T-003`.

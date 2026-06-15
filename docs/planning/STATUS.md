# Status

Last updated: 2026-06-15

## Current Focus

- None. `T-004` is done; `T-005` is the next shared budget foundation task when
  promoted.

## Active Branch

- None.

## Stable Branch

- `main`

## Next Action

Select the next task. `T-005` is unblocked by the merge of `T-004`.

Shared budget product discussion has been captured as phased backlog tasks
`T-004` through `T-011`; `T-004` is done.

## Validation

- Passed: `npm run validate` for `T-004`.
- Passed: `python3 scripts/validate_task_tracker.py` for `T-004`.
- PR #8 merged for `T-004` with merge commit `c93d3e8`.
- Passed: `python3 scripts/validate_task_tracker.py` after capturing shared
  budget tasks `T-004` through `T-011`.
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- PR #1 merged to `main` with merge commit `a255d91`.
- GitHub issue #3 synced into local task tracker as `T-002`.
- GitHub issue #5 captured into local task tracker as backlog task `T-003`.

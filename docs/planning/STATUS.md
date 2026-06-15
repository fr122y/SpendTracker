# Status

Last updated: 2026-06-15

## Current Focus

- `T-002` - Refresh stale long-running app tabs.

## Active Branch

- None. Next implementation branch remains `task/T-002-refresh-stale-tabs`
  unless the human owner promotes another task.

## Stable Branch

- `main`

## Next Action

Start implementation for `T-002` on branch
`task/T-002-refresh-stale-tabs`.

Shared budget product discussion has been captured as phased backlog tasks
`T-004` through `T-011`.

## Validation

- Passed: `python3 scripts/validate_task_tracker.py` after capturing shared
  budget tasks `T-004` through `T-011`.
- Passed: `python3 scripts/validate_task_tracker.py`
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- PR #1 merged to `main` with merge commit `a255d91`.
- GitHub issue #3 synced into local task tracker as `T-002`.
- GitHub issue #5 captured into local task tracker as backlog task `T-003`.

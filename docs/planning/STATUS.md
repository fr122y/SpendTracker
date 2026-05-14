# Status

Last updated: 2026-05-14

## Current Focus

- `T-001` - Adapt project task tracking framework.

## Active Branch

- `task/T-001-integrate-task-tracking`

## Stable Branch

- `main`

## Next Action

Review the repository-local task tracking framework integration, push the
scoped branch, and create a pull request.

## Validation

- Passed: `python3 scripts/validate_task_tracker.py`
- Passed for changed docs/templates:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`

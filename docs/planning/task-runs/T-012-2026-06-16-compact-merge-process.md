# Task Run: T-012 Optimize merge and tracker reconciliation process

Date: 2026-06-16

Branch: `task/T-012-compact-merge-process`

Issue: #TBD

PR: #18

## Summary

Documented Compact Merge Flow and a narrow direct docs reconciliation exception
to reduce token/time overhead while preserving task tracking, PR history, and
project memory.

## Scope

- Planned: update repository process rules, task-tracking source of truth, and
  local project-task-tracking skill.
- Out of scope: changing branch protection, CI configuration, or task
  validation scripts.
- Write scope: `AGENTS.md`, `.codex/skills/project-task-tracking/**`, and
  `docs/planning/**`.

## Changes

- Added Compact Merge Flow as the default meaning of "merge by the rules".
- Added a direct-main exception for post-merge `docs/planning/**`
  reconciliation only.
- Bounded external check waiting to 60 seconds unless the human explicitly asks
  to wait.
- Kept strict merge flow available by explicit request.
- Captured this process change as `T-012`.

## Files Touched

- `AGENTS.md`
- `docs/planning/task-tracking.md`
- `.codex/skills/project-task-tracking/SKILL.md`
- `docs/planning/tasks.md`
- `docs/planning/tasks.yml`
- `docs/planning/STATUS.md`
- `docs/planning/project-log.md`

## Verification

- Checks run: `python3 scripts/validate_task_tracker.py`, `git diff --check`.
- Result: passed.
- Not run: application test suite; docs/process-only change.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: process-only; direct-main exception is restricted to
  `docs/planning/**`.
- Tracker consistency checked: yes.
- Docs checked: yes.
- CI or PR status: PR #18 opened.

## Follow-Ups

- Use Compact Merge Flow as the default for the next "merge by the rules"
  request.

## Open Questions

- None.

## Registry Update Requested

- `T-012` moved to `review`; PR #18 opened.

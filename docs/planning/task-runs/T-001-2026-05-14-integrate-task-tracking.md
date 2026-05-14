# Task Run: T-001 Adapt project task tracking framework

Date: 2026-05-14

Branch: `task/T-001-integrate-task-tracking`

Issue: #TBD

PR: TBD

## Summary

Installed and adapted the repository-local `project-task-tracking` framework
for SmartSpend Tracker.

## Scope

- Planned: adapt framework docs, scripts, templates, task ledger, and local
  Codex skill.
- Out of scope: migrate temporary `plans/` notes into project memory.
- Write scope: `AGENTS.md`, `.codex/skills/project-task-tracking/**`,
  `.github/**`, `docs/**`, `scripts/**`.

## Changes

- Merged existing repository rules with task-tracking workflow in `AGENTS.md`.
- Added SmartSpend Tracker project brief, planning docs, task ledger, ADR, and
  task-run containers.
- Added tracker generator and validator scripts.
- Added GitHub task issue template, PR template, and tracker integrity workflow.
- Installed the local Codex project-task-tracking skill.

## Files Touched

- `AGENTS.md`
- `.codex/skills/project-task-tracking/SKILL.md`
- `.github/ISSUE_TEMPLATE/task.md`
- `.github/pull_request_template.md`
- `.github/workflows/tracker-integrity.yml`
- `docs/**`
- `scripts/generate.py`
- `scripts/validate_task_tracker.py`

## Verification

- Checks run: `python3 scripts/validate_task_tracker.py`
- Checks run:
  `npx prettier --check AGENTS.md docs/**/*.md .github/ISSUE_TEMPLATE/task.md .github/pull_request_template.md .github/workflows/tracker-integrity.yml`
- Result: passed.
- Not run: full `npm run validate`, because runtime application code was not
  changed.

## Review Checkpoint

- Scope checked: yes.
- Acceptance criteria checked: yes.
- Regression risk checked: low; process/docs/scripts only.
- Tracker consistency checked: yes.
- Docs checked: yes.
- CI or PR status: local branch not pushed yet.

## Follow-Ups

- Push the scoped branch and create a pull request.

## Open Questions

- None.

## Registry Update Requested

- Move `T-001` to `review`.

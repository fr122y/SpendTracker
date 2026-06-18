# Task Tracking

This document defines the repository-local operating system for planning, task
tracking, and progress control in SmartSpend Tracker.

## Core Rule

Every important thought should end up in the right durable container:

- Concrete executable task -> `docs/planning/tasks.yml` and usually a GitHub
  Issue.
- Future idea -> `docs/planning/backlog.md`.
- Current focus -> `docs/planning/current-sprint.md`.
- Accepted decision -> ADR in `docs/decisions/`.
- Open question -> `docs/context/OPEN_QUESTIONS.md`.
- Meaningful completed milestone -> `docs/planning/project-log.md`.

## Sources Of Truth

- `docs/context/PROJECT_BRIEF.md` - compact project memory.
- `docs/planning/STATUS.md` - token-efficient current status entrypoint.
- `docs/planning/tasks.yml` - machine-readable task ledger.
- `docs/planning/tasks.md` - human-readable task registry.
- `docs/planning/project-log.md` - chronological progress memory.
- `docs/context/OPEN_QUESTIONS.md` - unsettled assumptions and questions.
- `docs/decisions/` - accepted decisions.
- `docs/engineering/` - workflow, pull request, review, adoption audit, and
  platform rules.
- `docs/planning/adoption-audits/` - target repository adoption facts.

## Startup Protocol

For project status or meaningful work:

1. Read `docs/planning/STATUS.md`.
2. Read `docs/planning/tasks.md`.
3. Read `docs/planning/tasks.yml` when task state, dependencies, write scope,
   or validation matter.
4. Read only the required context listed on the active task.

Do not scan every project document by default.

## Task Ledger Rules

`docs/planning/tasks.yml` is the complete local task ledger.
`docs/planning/tasks.md` is its human-readable view.

Every executable task, subtask, follow-up, and meaningful pending item should
be represented in the ledger before implementation starts.

An owner-approved process exception may skip adding a new ledger task only when
the human owner explicitly grants that exception for the exact change. The
exception still needs a scoped branch, pull request, validation, and project
memory updates unless the owner explicitly narrows those gates too.

Tasks use these statuses:

```text
captured
backlog
ready
in_progress
review
done
blocked
parked
superseded
```

A task can be `ready` only when it has acceptance criteria, required context,
and a write scope. A task can be `in_progress` only when it has a branch. A
task can move to `review` only after implementation, verification, and a
task-run report are complete or any verification gaps are stated. A task can
move to `done` only after review, merge state, and project-memory
reconciliation are clear.

First-time framework installation or substantial framework adaptation tasks
must include an adoption audit report in `required_context`. If the report does
not exist yet, create it from the structure in
`docs/engineering/adoption-audit.md` before implementation starts.

Run `python3 scripts/validate_task_tracker.py` after task tracker changes.

## Branch And PR Gates

- Use a scoped branch with the `task/` branch prefix for project changes.
- Do not commit, merge, or push directly to `main` unless an explicit process
  exception is approved.
- If a scoped branch is pushed, create or update the PR before reporting review
  or merge readiness.
- Pull request titles and squash commit titles must follow
  `docs/engineering/change-request.md`.
- For non-trivial work, run the self-review in
  `docs/engineering/code-review.md` before reporting completion.
- Do not leave meaningful edits in a dirty worktree unless the human owner asks
  for WIP.
- After merge, delete or reconcile obsolete branches when safe.

## Compact Merge Flow

Compact Merge Flow is the default meaning of a human request such as "merge by
the rules".

Use this flow for routine task merges:

1. Verify the PR is open, mergeable, and required checks are successful.
2. Do a focused review of PR state and changed-file scope; do not repeat a full
   code review if review already happened.
3. Merge the PR and delete the task branch through GitHub when possible.
4. Update local `main`, prune obsolete remote-tracking refs, and confirm the
   worktree is clean.
5. Reconcile tracker/project-memory state once and report the outcome.

Do not create additional reconciliation PRs for non-blocking stale status text.
Fix tracker and status text in the same reconciliation step, or carry minor
stale text into the next task if the ledger remains valid.

Do not wait on pending external checks for more than 60 seconds unless the
human explicitly asks to complete that merge in the same turn. If required
checks remain pending after that window, report the PR/check state and stop.

## Direct Docs Reconciliation Exception

After a feature or process PR has merged, the agent may commit directly to
`main` for post-merge tracker reconciliation only when all changed files are
under `docs/planning/**`.

Allowed files include:

- `docs/planning/tasks.yml`
- `docs/planning/tasks.md`
- `docs/planning/STATUS.md`
- `docs/planning/project-log.md`
- `docs/planning/task-runs/**`

This exception must not change application code, migrations, tests, configs,
documentation outside `docs/planning/**`, or automation scripts.

Required gate:

- Run `python3 scripts/validate_task_tracker.py` before and after the direct
  docs reconciliation commit.
- If validation fails, stop and report instead of pushing.

Strict merge flow remains available when the human explicitly asks for a strict
merge, full review, separate reconciliation PR, or full check wait.

## Issue Shape

Use this structure for meaningful tasks:

```md
## Goal

## Task ID

## Context

## Related Docs

## Requirements

## Out of Scope

## Acceptance Criteria

## Technical Notes
```

## Definition Of Ready

A task is ready to start when:

- The goal is clear.
- The scope is bounded.
- Acceptance criteria are written.
- Related docs are linked.
- Affected layers are known.
- There is no blocking open question.
- Out-of-scope work is explicit when the task is likely to expand.

## Definition Of Done

Before marking work done, verify:

- Acceptance criteria are satisfied.
- Relevant checks were run, or the gap is stated.
- Self-review or reviewer review checked scope, acceptance criteria,
  regressions, tracker consistency, docs, verification, CI, and task-run
  report.
- A PR exists or the task explicitly does not require one.
- The task is merged to the stable branch, unless the task explicitly does not
  require a PR and the reason is documented.
- Relevant docs and project memory were updated.
- New open questions were recorded.
- ADRs were added or updated if important decisions were made.
- `project-log.md` was updated for meaningful milestones.
- Obsolete branches were cleaned up or a cleanup reason is stated.

## Agent Handoff

When preparing work for another agent, include:

- Task or issue title.
- Task ID.
- Related docs.
- Requirements.
- Out of scope.
- Acceptance criteria.
- Affected layers.
- Branch and write scope.
- Dependencies and conflicting tasks.
- Known risks or open questions.

When finishing work, report:

- What changed.
- Files or layers touched.
- What was verified.
- What was not verified.
- Follow-up tasks or open questions.
- Task-run report path.

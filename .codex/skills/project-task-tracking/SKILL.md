---
name: project-task-tracking
description: Reusable workflow for project task tracking, issue authoring, change request control, roadmap control, project review, Definition of Ready/Done checks, and AI agent handoffs.
---

# Project Task Tracking

Use this skill for task tracking, change request control, and project control
inside a repository that has installed the `project-task-tracking` framework.

## First Steps

1. Locate the repository root.
2. Read `docs/planning/STATUS.md`.
3. Read `docs/planning/tasks.md`.
4. Read `docs/planning/tasks.yml` when task state, dependencies, write scopes,
   or validation matter.
5. Read `docs/planning/task-tracking.md` only when process rules are needed.
6. Read only the extra docs needed for the request:
   - Current focus: `docs/planning/current-sprint.md`
   - Progress history: `docs/planning/project-log.md`
   - Open assumptions: `docs/context/OPEN_QUESTIONS.md`
   - Accepted decisions: `docs/decisions/`
   - Adoption audit: `docs/engineering/adoption-audit.md`
   - Agent workflow: `docs/engineering/agent-workflow.md`
   - Pull request rules: `docs/engineering/change-request.md`
   - Code review: `docs/engineering/code-review.md`
   - Platform settings: `docs/engineering/platform-settings.md`

Do not scan every project doc by default. Use the active task's required
context to keep token use small.

Treat `docs/planning/task-tracking.md` and `docs/engineering/` as process
sources of truth. Treat `docs/planning/tasks.yml` as the task state source of
truth.

## Operating Modes

- `intake`: classify new discussion into task, backlog, ADR, open question, or
  project log.
- `adoption-audit`: collect target repository facts before installing or
  substantially adapting the framework.
- `draft-issue`: turn a scoped idea into a GitHub Issue.
- `ready-check`: evaluate whether a task meets Definition of Ready.
- `done-check`: evaluate whether work meets Definition of Done.
- `change-request-readiness`: check whether PR title, description, scope, and
  verification are ready for review.
- `self-review`: review the full diff against task scope before completion.
- `scope-taxonomy`: help define or audit the project's controlled PR title
  scope list.
- `project-review`: summarize current phase, completed work, next tasks,
  blockers, and open questions.
- `handoff`: prepare a task brief for another agent.
- `task-run`: prepare or review an agent task-run report.
- `tracker-sync`: reconcile status, task ledger, planning docs, and GitHub
  tracker state.

If the user does not name a mode, infer the smallest mode that satisfies the
request.

Before first-time framework installation or substantial framework adaptation,
stop and create an adoption audit report if one is not already linked from the
active task's required context. Owner-approved process exceptions without a
ledger task must record the exception in project memory.

## Ready And Done Checks

For `ready-check`, return:

- Ready: yes/no.
- Missing information.
- Suggested edits.
- Blocking open questions.

For `done-check`, return:

- Done: yes/no.
- Acceptance criteria status.
- Verification status.
- Review status.
- PR and merge status.
- Docs/project-memory updates needed.
- ADR or open-question updates needed.
- Dirty worktree status.
- Branch cleanup status.

Stop and report instead of proceeding when:

- meaningful file edits are unstaged or uncommitted and WIP was not requested;
- project changes outside the direct docs reconciliation exception are being
  made directly on the stable branch;
- a scoped branch has been pushed but no PR exists;
- merge readiness is unclear;
- a direct stable-branch merge or push would be needed without explicit
  approval.

## Compact Merge Flow

When the human asks to "merge by the rules", use the repository's Compact
Merge Flow unless they explicitly ask for strict handling:

- verify the PR is open, mergeable, and required checks are successful;
- do a focused PR state/scope review instead of repeating a full code review
  when review already happened;
- merge the PR, delete the task branch, update local `main`, and prune obsolete
  refs;
- reconcile tracker/project-memory state once and report concisely.

For post-merge tracker reconciliation, a narrow direct-main exception is
approved for `docs/planning/**` only. Run
`python3 scripts/validate_task_tracker.py` before and after the direct docs
commit. Do not use this exception for code, migrations, tests, configs,
automation scripts, or docs outside `docs/planning/**`.

Do not wait on pending external checks for more than 60 seconds unless the
human explicitly asks to complete the merge in the same turn.

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
- Risks and open questions.

When finishing work, report:

- What changed.
- Files or layers touched.
- What was verified.
- What was not verified.
- Follow-up tasks or open questions.
- Task-run report path.

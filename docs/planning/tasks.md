# Tasks

## T-001 - Adapt project task tracking framework

- Status: `done`
- Phase: Foundation
- Type: process
- Priority: high
- Branch: `task/T-001-integrate-task-tracking`
- GitHub issue: none
- PR: #1
- Merge commit: `a255d91`
- Owner mode: human-led
- Required context:
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `AGENTS.md`

Install and adapt the repository-local task tracking framework for
SmartSpend Tracker while preserving existing architecture and validation rules.

Acceptance criteria:

- Project placeholders are replaced with SmartSpend Tracker details.
- Existing repository architecture and validation rules remain in `AGENTS.md`.
- The task ledger starts with the real framework-adaptation task.
- Task tracker validation passes.

Task-run report:

- `docs/planning/task-runs/T-001-2026-05-14-integrate-task-tracking.md`

## T-002 - Refresh stale long-running app tabs

- Status: `ready`
- Phase: Reliability
- Type: fix
- Priority: high
- Branch: `task/T-002-refresh-stale-tabs`
- GitHub issue: #3
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - <https://github.com/fr122y/SpendTracker/issues/3>

Implement an app-resume freshness strategy so long-lived browser tabs refresh
date-dependent defaults and server-backed data after focus, reconnect, or
calendar day rollover.

Acceptance criteria:

- A tab left open overnight updates date-dependent defaults without manual
  reload.
- Returning to a backgrounded tab triggers refresh of expenses, balances, or
  other relevant server-backed queries.
- Changes made from another device become visible after the original tab
  regains focus or reconnects.
- If a user manually selected a date in a form, app-resume logic does not
  silently replace that manual selection.
- Behavior is covered by focused tests where practical.
- `npm run validate` passes.

## T-003 - Open monthly category expenses from analysis chart

- Status: `backlog`
- Phase: Analytics UX
- Type: feature
- Priority: medium
- Branch: `task/T-003-analysis-category-drilldown`
- GitHub issue: #5
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - <https://github.com/fr122y/SpendTracker/issues/5>

Allow users to click a category in the Analysis widget chart and open the list
of expenses in that category for the current month.

Acceptance criteria:

- Clicking a category in the Analysis widget chart opens a list of expenses for
  that category in the current month.
- The list filters by the selected category and current month boundaries.
- Empty category/month results show an explicit empty state.
- The user can return from the list to the Analysis view without losing the
  current month context.
- The feature is covered by focused UI/unit tests where practical.
- `npm run validate` passes.

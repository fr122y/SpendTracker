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

## T-004 - Add historical weekly personal budget limits

- Status: `done`
- Phase: Shared Budget Foundation
- Type: feature
- Priority: high
- Branch: `task/T-004-historical-weekly-limits`
- GitHub issue: none
- PR: #8
- Merge commit: `c93d3e8`
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/widgets/weekly-budget/ui/weekly-budget.tsx`
  - `src/shared/db/schema.ts`
  - `src/shared/lib/finance-selectors.ts`

Store weekly personal budget limits by effective week so changing the current
limit does not recalculate past weeks.

Acceptance criteria:

- Changing the personal weekly limit for the selected week does not recalculate
  earlier weeks.
- New weeks inherit the latest effective personal weekly limit.
- Existing users keep their current `user_settings.weeklyLimit` as the
  migration/default source.
- The weekly budget widget continues to show correct personal spent, remaining,
  project top-up, and over-budget states.
- Focused tests cover current-week changes, past-week preservation, and
  new-week inheritance.
- `npm run validate` passes.

Task-run report:

- `docs/planning/task-runs/T-004-2026-06-15-historical-weekly-limits.md`

## T-005 - Define shared budget domain model and access rules

- Status: `done`
- Phase: Shared Budget Foundation
- Type: feature
- Priority: high
- Branch: `task/T-005-shared-budget-domain`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/shared/db/schema.ts`
  - `src/shared/api/expense-actions.ts`
  - `src/shared/types/index.ts`

Add the server-side domain model for shared weekly budgets, membership, active
budget selection, shared weekly limits, and expense visibility.

Acceptance criteria:

- Shared budget, shared budget member, active shared budget selection, and
  shared weekly limit concepts exist in the domain model.
- Expense reads return only the current user's personal expenses plus shared
  expenses from budgets where the user is a member.
- Private expenses from another user are never returned through shared budget
  queries.
- Server-side authorization protects creating, reading, updating, and deleting
  shared budget data.
- Roles support owner and member, with both roles allowed to manage shared
  expenses and only owner allowed to archive the shared budget.
- Existing personal expenses remain personal after migration.
- An ADR or durable context note records the shared budget ownership and
  visibility model.
- `npm run validate` passes.

Task-run report:

- `docs/planning/task-runs/T-005-2026-06-15-shared-budget-domain.md`

Merge:

- PR #10 merged to `main` with merge commit `780b638`.

## T-006 - Add shared budget categories

- Status: `review`
- Phase: Shared Budget Foundation
- Type: feature
- Priority: high
- Branch: `task/T-006-shared-budget-categories`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/entities/category/README.md`
  - `src/shared/db/schema.ts`

Give each shared budget its own shared category set so both members see the same
category names and analytics.

Acceptance criteria:

- A shared budget has a category set independent from any member's private
  categories.
- Creating a shared budget copies the creator's categories as the initial
  shared category set.
- Shared expenses can only use categories from their shared budget.
- Both members see the same shared category names and emojis for shared
  expenses.
- Private categories of one member are not exposed to another member.
- Focused tests cover category copy, shared expense category selection, and
  access boundaries.
- `npm run validate` passes.

Task-run report:

- `docs/planning/task-runs/T-006-2026-06-15-shared-budget-categories.md`

## T-007 - Add one-time invite links for shared budgets

- Status: `captured`
- Phase: Shared Budget Collaboration
- Type: feature
- Priority: high
- Branch: `task/T-007-shared-budget-invites`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/shared/auth/README.md`
  - `src/shared/db/schema.ts`

Allow a shared budget owner to generate a one-time invite link that expires
after seven days and adds the accepting user as a member.

Acceptance criteria:

- An owner can generate an invite URL for a shared budget.
- Invite tokens are generated with a cryptographically secure random source,
  stored securely, expire after seven days, and are invalidated after
  acceptance.
- A logged-out user can open an invite link, authenticate or register, and then
  accept the invite.
- Used, expired, invalid, archived-budget, and duplicate-member invites show
  explicit failure states and do not create memberships.
- Invite URLs are built from a trusted configured origin rather than an
  arbitrary request Host header.
- Focused tests cover successful acceptance, token reuse, expiry, duplicate
  membership, and unauthorized generation.
- `npm run validate` passes.

## T-008 - Extend weekly budget widget for shared budgets

- Status: `captured`
- Phase: Shared Budget UX
- Type: feature
- Priority: high
- Branch: `task/T-008-weekly-shared-budget-ui`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/widgets/weekly-budget/README.md`
  - `src/widgets/weekly-budget/ui/weekly-budget.tsx`

Update the weekly budget widget so users can create, select, invite to, view,
and archive shared weekly budgets alongside the personal budget.

Acceptance criteria:

- The widget shows the personal weekly budget separately from shared weekly
  budgets.
- A user can create a shared weekly budget, set its weekly limit, and select it
  as the active shared budget.
- The widget can generate and display/copy an invite link for a shared budget.
- The active shared budget shows limit, spent, remaining, and members.
- Both members see the same shared weekly limit and shared remaining amount.
- The owner can archive a shared budget, and archived budgets are not offered
  for new expenses.
- Focused UI tests cover create, select active, invite link display, archive,
  and shared summary rendering.
- `npm run validate` passes.

## T-009 - Add shared budget selection to expense entry and journal

- Status: `captured`
- Phase: Shared Budget UX
- Type: feature
- Priority: high
- Branch: `task/T-009-shared-budget-expense-log`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/features/add-expense/ui/expense-form.tsx`
  - `src/widgets/expense-log/ui/expense-log.tsx`
  - `src/entities/expense/ui/expense-card.tsx`

Keep one expense journal while allowing users to add and filter expenses by
personal or shared budget scope.

Acceptance criteria:

- The add-expense form lets a user choose personal budget or an available
  shared budget for a real expense.
- Shared expenses use shared budget categories, and personal expenses use
  personal categories.
- A shared expense created by either member appears in both members' journals.
- A personal expense appears only for its author.
- The existing journal remains the single operation list and adds scope filters
  for all, personal, and shared expenses.
- Existing filters for expenses, projects, and movement remain available.
- Shared expense cards show shared budget name and author.
- Project scenarios keep their current behavior.
- Focused tests cover scope selection, journal filters, shared visibility,
  personal privacy, and project regression behavior.
- `npm run validate` passes.

## T-010 - Add analytics scopes for visible expenses

- Status: `captured`
- Phase: Shared Budget Analytics
- Type: feature
- Priority: medium
- Branch: `task/T-010-shared-budget-analytics-scopes`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `src/widgets/analysis/ui/analysis-dashboard.tsx`
  - `src/widgets/dynamics-chart/README.md`
  - `src/shared/lib/finance-selectors.ts`

Let analytics and spending charts switch between all visible, personal, and
shared expense scopes.

Acceptance criteria:

- Analytics supports all, personal, and shared scopes.
- All means the current user's personal expenses plus shared expenses from
  budgets where the user is a member.
- Personal excludes shared expenses.
- Shared excludes personal expenses.
- Private partner expenses are not included in any scope.
- Shared category aggregation is identical for both members of the same shared
  budget.
- Dynamics chart follows the same scope model.
- Calendar scope behavior is either implemented consistently or explicitly
  captured as a follow-up.
- Focused selector and UI tests cover all three scopes and privacy boundaries.
- `npm run validate` passes.

## T-011 - Run end-to-end shared budget QA and tracker sync

- Status: `captured`
- Phase: Shared Budget Release
- Type: process
- Priority: medium
- Branch: `task/T-011-shared-budget-qa`
- GitHub issue: none
- PR: none
- Owner mode: agent-led
- Required context:
  - `AGENTS.md`
  - `docs/context/PROJECT_BRIEF.md`
  - `docs/planning/task-tracking.md`
  - `docs/planning/tasks.yml`
  - `docs/context/OPEN_QUESTIONS.md`

Verify the full shared budget journey across two users and reconcile
documentation, task reports, tracker state, and release readiness.

Acceptance criteria:

- End-to-end coverage verifies creating a shared budget, accepting an invite
  with a second user, adding a shared expense, shared visibility, and analytics
  scope behavior.
- Historical personal weekly budget migration is checked against prior-week and
  current-week scenarios.
- Privacy verification confirms partner-private expenses are not visible or
  aggregated.
- Relevant README, ADR/context notes, task-run reports, and project log entries
  are reconciled.
- `npm run validate` passes.
- `python3 scripts/validate_task_tracker.py` passes.

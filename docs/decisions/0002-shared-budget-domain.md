# 0002. Shared Budget Domain Model

Date: 2026-06-15

## Status

Accepted

## Context

The app is moving from personal-only budgeting to a model where a user can keep
their private weekly budget and also participate in a partner/shared weekly
budget. The first implementation step needs durable database and access rules
that later UI and invitation work can build on.

Private partner expenses must not become visible just because two users share a
budget. Project money behavior is intentionally left unchanged for now.

## Decision

Add a shared budget domain beside the existing personal budget model:

- `shared_budget` stores the shared budget record, owner, creation time, and
  archival state.
- `shared_budget_member` stores membership, role, join time, and the current
  user's active shared budget selection.
- `shared_budget_weekly_limit` stores historical shared weekly limits by
  effective week start.
- `expense.sharedBudgetId` links an expense to a shared budget while keeping
  the expense author in `expense.userId`.

Expense visibility is scoped as follows:

- A user sees their own private expenses where `sharedBudgetId` is null.
- A user sees shared expenses for shared budgets where they are a member.
- A user does not see another member's private expenses.

Shared expenses are deliberately separate from project operations. A shared
expense cannot reference `projectId` and cannot use project movement operation
types.

## Consequences

- Analytics can later offer "all", "personal", and "shared" modes without
  leaking private partner expenses.
- Invitation UI can add members to the existing membership table without
  changing the core expense visibility model.
- Historical shared weekly limits follow the same effective-week pattern as
  personal weekly limits.
- Project-to-shared-budget transfers remain out of scope until the product
  model for shared project money is designed.

# Tasks

## 1. Persist pockets and secure operations

- [x] 1.1 Add owner-scoped pocket and unique per-month budget tables, plus the pocket link and transfer operation type on existing money operations; generate and review the Drizzle migration artifact without applying it to any database, and verify the schema/migration diff matches the design.
- [x] 1.2 Add authenticated Server Actions and entity queries/mutations for creating, renaming, archiving pockets; initializing and editing monthly budgets; and creating/editing purchases and transfers. Add action tests for ownership boundaries, incompatible operation links, archived-pocket restrictions, prior-month selection, no-future fallback, and idempotent month initialization; update each slice README.

## 2. Calculate monthly pocket usage and weekly coverage

- [x] 2.1 Add pure selectors for a pocket's selected-month purchases, transfers, used amount, and possibly negative remaining amount; add unit tests for month boundaries, editing dates, and no rollover.
- [x] 2.2 Update personal weekly spend and coverage to exclude pocket purchases and count pocket transfers for their own week using the project withdrawal coverage order. Add regression tests proving purchases remain in expense analytics, transfers stay out of expense totals, and pocket/project/shared flows do not double count.

## 3. Add the dashboard widget and editable history

- [x] 3.1 Implement the responsive pockets widget and management/form feature with budget, used, remaining, purchase/transfer breakdown, journal-style auto category suggestions with manual override, amount/category editors opened on demand, editable and deletable monthly history, create/rename/archive controls, and shared `selectedDate`; add UI tests for the specified flows, history edits/deletion, archive behavior, negative remainder, and transfer reduction.
- [x] 3.2 Register the new widget in the widget ID, registry, and default/normalized layouts so existing saved layouts gain it; add tests for legacy layout normalization, widget rendering, and the shared month context.
- [ ] 3.3 Add a dashboard end-to-end scenario that creates a pocket, changes its month budget, records a purchase and transfer, checks the totals and history, and verifies mobile access.

## 4. Integrate and verify

- [ ] 4.1 Review the complete diff for owner scoping, immutable existing monthly snapshots, archived-history preservation, absence of rollover/top-ups/bank balances, and no real-database migration execution; run `npm run spec:check`, `npm run validate`, and the targeted Playwright spec, then record their actual results.

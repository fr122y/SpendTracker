# Design

## Context

`AnalysisDashboard` holds the selected analytics scope locally and reads `selectedDate` from the session store. It calls `getCategoryStats(expenses, selectedDate, scope)`, which groups the loaded expense array by the text `category`. `getMonthlyExpenses` already returns raw expense records for the selected month and scope and excludes project transfers/returns. `personal` scope intentionally includes project-linked expenses with no `sharedBudgetId`.

`useExpenses` loads the current user's private expenses and shared expenses for budgets where they are a member. The current Server Action returns the full accessible list across dates without pagination. A drill-down can therefore reuse the client query data and existing month/scope selector rather than adding a new API or database query.

Expense descriptions are freeform strings. There is no canonical expense-name table or ID. The existing `createMatcher` uses Fuse.js to map one description to a category keyword and returns one best mapping; it is not a grouping API. `ExpenseList` requires an `onDelete` callback and `ExpenseCard` renders a delete action, so the detail view needs read-only rows rather than using that list unchanged.

## Goals / Non-Goals

**Goals:**

- Preserve the current category analysis and open an accessible responsive detail dialog from each category.
- Reuse the loaded, authorized expense array, selected month, and current scope.
- Show raw, read-only expense records by descending date and let users filter by automatic description groups.
- Make grouping deterministic for a given base set, independent of record order, while leaving source descriptions untouched.

**Non-Goals:**

- No alias catalog, stored canonical name, database/API change, new dependency, AI, or network service.
- No semantic synonym support or promise that fuzzy similarity always captures human meaning.
- No changes to category totals, month navigation, shared-budget access, or expense mutation behavior.

## Decisions

The behavior requirements follow the active vault T-003 card. The collapsed list size, filter reset policy, representative label, tie-breaking, and variant-inspection control below are explicit proposal defaults for review, not claims of verbatim user choices.

### Derive a base set from the current analysis context

When a category opens, take the same `selectedDate` and scope already used by the analysis, call the existing monthly selector, and retain rows whose `category` string equals the activated category's displayed name. Name groups, base count, and base sum are computed from this unfiltered set. Applying name selections is a later client-side OR filter over that set.

No Server Action, pagination, or second fetch is added. The query already contains all rows the current user may see; its authorization boundary remains unchanged. Project-linked expenses remain in `personal`, shared rows remain limited to current memberships, and non-expense project movements stay excluded by the existing selector.

### Use a responsive, read-only dialog

Keep dialog state in the analysis widget. Category tiles become keyboard-operable controls as well as pointer/touch controls. Desktop uses a centered dialog; phone layouts use a full-screen dialog with independently scrollable content. The dialog has an accessible name, traps and restores focus, closes with Escape and a visible close control, and does not let the existing category touch tooltip intercept activation.

The modal inherits month and scope; it does not add its own scope selector. Closing preserves the analysis month and scope. The current month picker shows an existing desktop dialog pattern and the mobile widget modal shows the full-screen pattern, but neither is a complete reusable responsive read-only dialog, so keep this feature's content and responsive behavior explicit.

### Render read-only rows grouped by date

Group matching rows by their stored `date` and order date groups descending. Show each source description and amount. Do not expose edit or delete controls. Reuse the existing visual conventions where useful, but do not mount `ExpenseCard`/`ExpenseList` unchanged because their API requires deletion and the card includes a delete action.

### Normalize and group descriptions conservatively

Use the current source strings and normalize for comparison with trim plus lowercase, matching the existing category-matcher convention. First combine exact normalized names. Do not edit the original `Expense.description` values.

For fuzzy comparisons, split normalized names into whitespace-delimited tokens and require the same word count and the same ordered numeric-token sequence. Compare corresponding tokens: tokens shorter than six Unicode code points must match exactly; longer tokens may match fuzzily only when each token contains letters from one Unicode script and both tokens use the same script. Mixed-script tokens are exact-only. Score each eligible token pair in both directions using the existing Fuse.js dependency and the project's current `threshold: 0.4` configuration; require both scores to be below `0.4`. Different-number candidates remain separate unless their whole normalized names are exact matches. This protects short distinguishing words and numeric qualifiers without trying to identify brands semantically.

Build candidate groups from sorted unique normalized names, not source array order. While unassigned names remain, evaluate each as a possible anchor: start its group with the anchor, then consider its compatible neighbors in normalized code-point order, adding a name only if it is compatible with every current group member. Choose the anchor that yields the largest group; break ties by normalized code-point order, emit the group, remove its members, and repeat. Since every pair inside a group must be compatible, one fuzzy match cannot pull an arbitrarily long chain into the group. It includes the required three-name example because every pair passes the current Fuse threshold, while different short words, `большой`/`дорогой`, and differing number tokens fail the pairwise guards.

The stable filter identity is the sorted set of normalized group-member names, not its display label or source-array position. Count rows by their existing trimmed spelling and show the most frequent spelling as the label; resolve ties by normalized code-point order and then source spelling. If normalization produces an empty name, display `Без описания` as a UI placeholder while retaining the raw source description in the data and in filtering. The displayed variant count is the number of distinct normalized members, while an accessible disclosure exposes the original stored spellings represented in the group. Sort collapsed chips by row frequency descending, then by label. Grouping, labeling, and selection therefore do not depend on row order or expense amount.

### Filter groups and keep base metrics visible

Default to the eight most frequent groups, then sort ties by display label. “Показать все” and “Свернуть” change only the visible options; selected groups outside the collapsed first eight remain visible. Multiple selected groups use OR semantics. No selection means all base rows. Show filtered count and sum beside the count and sum for the base category set.

Name selection is local to the dialog and resets when it closes or when the base category/month/scope changes. This avoids carrying a selection to a different row set.

### Empty states and accessibility

Use separate empty states for an empty base category and for a non-empty base set with no rows matching the selected name groups. Keyboard users can activate categories, move among chips, expand/collapse options, inspect group variants, and close the dialog. On close, focus returns to the category control that opened it.

## Risks / Trade-offs

- **Fuzzy similarity can join unrelated one-word names, including Cyrillic brand spellings →** the length, word-count, numeric-token, script, symmetric-score, and complete-link guards reduce obvious false merges; expose group variants so users can inspect what is represented. Without a semantic catalog, residual false positives cannot be eliminated.
- **Most-frequent label can vary with the selected month or scope →** compute the representative and group identity inside the current base set; do not persist the label or alias group.
- **The full accessible expense list is already client-loaded →** this adds only local comparisons but keeps the existing all-history query behavior and its scaling limits.
- **The category tile currently uses touch handlers for its tooltip →** test that activating it opens the dialog cleanly on a phone and does not leave the tooltip visible.

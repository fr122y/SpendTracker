# Tasks

## 1. Base expense set and name groups

- [x] 1.1 Add a pure selector for the activated category's base rows using the existing month/scope expense selector; add tests for category, month, all/personal/shared scope, project-linked personal expenses, and excluded project movements.
- [x] 1.2 Add deterministic description normalization and grouping with symmetric Fuse comparison, token/number/script guards, complete-link membership, stable group identity, most-frequent existing label, and inspectable variants; add unit tests for the required trio, case/trim equivalence, empty-name display fallback with preserved source, both different-word examples, number/script guards, transitive-chain prevention, input-order independence, and representative frequency/lexical tie-breaking.

## 2. Accessible category details dialog

- [x] 2.1 Make analysis categories keyboard- and pointer/touch-operable and open a centered desktop or full-screen phone dialog; add UI tests for opening, context preservation, Escape/close, focus return, and touch tooltip interaction.
- [x] 2.2 Render matching rows as read-only daily groups ordered by descending date, with original descriptions and amounts; add UI tests for month/scope/category filtering, multiple date groups with newest first, project inclusion, movement exclusion, and absence of edit/delete actions.
- [x] 2.3 Show distinct empty states for an empty base set and a name filter with no matches, plus filtered/base counts and sums; add UI tests for both states and metric updates.
- [x] 2.4 Document the analysis detail view in `src/widgets/analysis/README.md` and verify the slice description matches the implemented public behavior.

## 3. Name-group filters and integration

- [x] 3.1 Add accessible selectable group chips with the initial eight-group view, expand/collapse, always-visible selected groups, immediate OR filtering, no-selection-as-all, and reset on close/base change; add UI/a11y tests for keyboard selection, inspecting group variants, and each filter/display behavior.
- [x] 3.2 Verify `npm run spec:check` and `npm run validate` pass on the integrated feature and inspect the final diff for read-only behavior, preserved source descriptions, and scope boundaries.

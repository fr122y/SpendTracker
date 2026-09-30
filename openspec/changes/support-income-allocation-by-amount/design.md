# Design

## Context

The savings widget currently persists only each bucket's percentage. A client component owns editable values, while an authenticated Server Action replaces the user's bucket rows transactionally. See `proposal.md` and `specs/income-allocation/spec.md` for the user-visible contract.

## Goals / Non-Goals

**Goals:** preserve each category's last edited basis, retain exact amount values in kopecks, keep legacy rows percentage-based, and calculate warnings and the operations remainder consistently.

**Non-Goals:** create transactions or transfer money; change salary or unrelated financial settings; introduce new runtime dependencies or API routes.

## Decisions

- Store `basis` as `percentage` or `amount`, keep the percentage field, and add nullable `amountKopecks`. Existing rows receive a percentage basis by default and require no destructive data rewrite. Amount-basis rows store a safe integer kopeck value; their displayed percentage is derived from current income. Percentage-basis rows store the entered percentage and derive money from it.
- Use integer kopecks for currency input, derived amounts, totals, overage, and operations remainder. Round a percentage-derived amount once to the nearest kopeck. Keep display formatting separate from canonical values; never derive a saved amount from the formatted percentage.
- Preserve the basis during income edits and change it only after a valid user edit to that category's percentage or amount. A missing/zero income produces no derived percentage for an amount-basis category.
- Permit any finite, non-negative category value, including an aggregate above income. Surface one warning from the computed negative remainder; do not clamp or reject the edit. A local invalid/negative/non-finite field remains an input validation error.
- Keep optimistic query updates and the current authenticated transactional replacement action. Validate the DTO at the server boundary before replacing rows so malformed values cannot persist.

## Risks / Trade-offs

- [Legacy rows have no basis field] → An additive migration supplies the percentage default and leaves their existing percentages intact.
- [JavaScript floating-point arithmetic can drift at currency boundaries] → Convert inputs and salary to kopecks and perform currency sums as safe integers; add boundary tests such as 1.005 and repeated fractional allocations.
- [Two editable fields can be cramped on phones] → Use a compact responsive layout that stacks or wraps fields on narrow screens, with explicit labels and a visible basis hint.
- [Client-only validation can be bypassed] → Validate basis, percentage, and amount on the authenticated Server Action before its transaction.

## Migration Plan

Add a nullable amount-in-kopecks column and a non-null basis column with the `percentage` default. Deploy the additive migration before relying on the new action shape. No production database is changed during implementation. Rollback can revert application code while leaving the additive columns in place; do not drop or rewrite user data.

## Open Questions

None.

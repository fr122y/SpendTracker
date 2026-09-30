# Design

## Context

The savings widget edits monthly income allocations. Its active contract is percentage-canonical: users may type either a percentage or a money amount, but an amount is converted to a percentage for the current income. See `proposal.md` and `specs/income-allocation/spec.md` for the user-visible behavior.

The earlier implementation introduced `basis` and `amountKopecks` and was deployed. The shared database currently contains five legacy amount-basis rows, all with positive salary. The user has approved removing fixed-amount behavior while preserving those current allocations.

## Goals / Non-Goals

**Goals:** keep percentage as the only current DTO and canonical allocation value; accept amount input as a conversion; preserve prior amount-based rows during transition; retain cent-level arithmetic and exact percentage persistence; keep over-budget warnings.

**Non-Goals:** retain fixed amounts across income changes; drop legacy database columns; rewrite applied migration `0012`; create transactions or move money.

## Decisions

- The client DTO contains only bucket `id`, `label`, and canonical `percentage`. The displayed amount is always calculated from percentage and current income. Editing an amount converts it to a full-precision percentage using current income; changing income never changes that percentage.
- Keep money in safe integer kopecks and round each percentage-derived amount once to the nearest kopeck. `formatPercentage` is display-only and shows no more than two decimal places without trailing zeroes.
- Widen the existing percentage column from PostgreSQL `real` to `double precision` using a new additive migration `0013`. Keep already-applied migration `0012` immutable and leave its `basis` and `amountKopecks` columns in place; do not drop user data.
- For rows left by the deployed fixed-amount implementation, the server privately derives a percentage from saved amount divided by the current positive salary. Before a salary update, it materializes that derived percentage using the old salary; before a full-list bucket replacement, it converts any remaining legacy amount rows. An amount row with no positive salary must fail closed and retain its old data.
- No standalone data rewrite is needed: the adapter preserves the current amount for the five known rows until their first salary update or full-list save. Migration `0013` changes only the column type.
- Permit any finite non-negative category percentage, including totals above 100%. Save direct edits and salary reductions, and show the exact overage through the negative «Операции» remainder.
- Keep the existing transactional server writes and serialized optimistic bucket mutations. Validate canonical percentages and resulting safe-kopek arithmetic at their current boundaries.
- If salary is zero, disable amount input with an explanation, leave percentage editable, and calculate zero money.

## Risks / Trade-offs

- [Legacy rows still contain fixed-amount fields during rollout] → Keep a server-only compatibility adapter until no legacy rows remain; refuse to overwrite unresolved rows without positive salary.
- [PostgreSQL `real` loses precision for derived percentages] → Widen to `double precision`; regression-test an amount such as 333,333.33 ₽ at a 1,000,000 ₽ income.
- [JavaScript floating-point arithmetic can drift at currency boundaries] → Convert money to integer kopecks and test decimal input such as 1.005 and persisted amount-derived percentages.
- [Two input methods can be confusing] → Explain next to the editor that percent is saved and amount input recalculates it; retain explicit labels and a compact two-column layout.

## Migration Plan

Migration `0013` widens `allocation_bucket.percentage` to `double precision`; it does not change allocation rows or remove legacy columns. The deployment workflow's guarded preflight must confirm that only `0013` is pending before applying it. The application adapter preserves old amount-basis allocations and normalizes them only during ordinary salary or bucket saves. Do not apply data-changing operations outside those user-triggered writes, and do not drop columns in this change.

## Open Questions

None.

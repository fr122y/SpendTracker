# Tasks

## 1. Tests first

- [ ] 1.1 In `src/entities/expense/__tests__/ExpenseCard.test.tsx`, add failing tests: with `pocketName` a purchase shows «Из кармана: <имя>» and a transfer shows «Перевод из кармана: <имя>»; a card without a pocket link ignores `pocketName`. Keep the existing tests for the badge without a name.
- [ ] 1.2 Add `src/entities/expense/__tests__/ExpenseList.test.tsx` with failing tests: `pocketNames` gives each pocket operation the name of its own pocket; an operation whose pocket is missing from `pocketNames`, and a list without `pocketNames`, keep the badge without a name.
- [ ] 1.3 In `src/widgets/expense-log/__tests__/expense-log.test.tsx`, mock `@/entities/pocket` and add failing tests: the journal passes the names of active and archived pockets to the list; while pockets are not loaded the journal still renders its operations and passes no names.
- [ ] 1.4 Confirm the new tests fail for the expected reason and the existing tests still pass.

## 2. Implementation

- [ ] 2.1 Add the optional `pocketName` prop to `ExpenseCard` and the optional `pocketNames` prop to `ExpenseList`; do not import `@/entities/pocket` in `entities/expense`.
- [ ] 2.2 In `ExpenseLog`, read pockets through `usePockets()` and pass the id-to-name map, archived pockets included, to `ExpenseList`; do not wait for the pocket query. FSD: `widgets/expense-log` now imports `@/entities/pocket`.
- [ ] 2.3 Update `src/entities/expense/README.md` and `src/widgets/expense-log/README.md`: new props, data source, and the new dependency.

## 3. Verify

- [ ] 3.1 Run `npm run spec:check` and `npm run validate`; record the actual results, including any check that was not run and why.
- [ ] 3.2 Review the full diff against `docs/engineering/code-review.md`: only the change folder, `src/entities/expense`, and `src/widgets/expense-log` are touched; the pockets widget history keeps its badges; the delta spec matches the behavior.
- [ ] 3.3 Manually verify on Vercel Preview: a pocket purchase and a pocket transfer in the journal show «Из кармана: <имя>» and «Перевод из кармана: <имя>»; an operation of an archived pocket shows its name; other cards are unchanged.

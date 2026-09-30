# Tasks

## 1. Persistence Contract

- [x] 1.1 Add a backward-compatible basis and amount-in-kopecks DTO and server validation; verify legacy decoding and valid/invalid payloads with Server Action tests.
- [x] 1.2 Add the basis and amount-in-kopecks Drizzle columns plus an additive migration; verify schema generation and inspect the SQL diff without applying it to a live database.

## 2. Allocation Calculations

- [x] 2.1 Implement pure kopeck conversion, percentage-to-amount rounding, derived percentage formatting, totals, and remainder; verify boundary and mixed-basis unit tests.
- [x] 2.2 Update bucket entity fixtures and any required query contracts for the DTO; verify entity query and store tests pass.

## 3. Savings Editor

- [x] 3.1 Add simultaneous editable amount and percentage fields with canonical basis switching and durable save behavior; verify edit, income-change, and reload-shaped editor tests.
- [x] 3.2 Show zero-income placeholders, amount/percentage basis hints, exact overage warning, and negative operations remainder responsively; verify component tests at the relevant states and inspect mobile/desktop layouts.
- [x] 3.3 Update manage-buckets and savings slice documentation; verify documented public contracts match the implementation.

## 4. Integration Verification

- [x] 4.1 Run `npm run spec:check` and `npm run validate`, then visually verify the widget on mobile and desktop without mutating production data.

# Settings Entity

Manages user financial settings with persistent storage.

## Public API (`index.ts`)

- `useSettingsStore`: Reatom store hook for settings state management
- `FinancialSettings`: Form component for editing financial settings

## State & Data

- **Store:** `useSettingsStore` (Persistence Key: `smartspend-settings`)
- **State:**
  - `weeklyLimit`: Weekly spending limit in rubles
  - `salaryDay`: Day of month for salary (1-31)
  - `advanceDay`: Day of month for advance payment (1-31)
- **Actions:**
  - `setWeeklyLimit(limit)`: Update weekly spending limit
  - `setSalaryDay(day)`: Update salary day
  - `setAdvanceDay(day)`: Update advance day

## Test Coverage

Comprehensive test suite located at `__tests__/store.test.ts` covering:

- **Initial State**: Verifies default values and action method availability
- **Action Testing**: All three actions (setWeeklyLimit, setSalaryDay, setAdvanceDay) with:
  - Normal value updates
  - Boundary conditions (0, 1, 31, large numbers)
  - Edge cases (negative values, decimals)
  - Multiple sequential updates
- **Multiple Actions Interaction**: Tests concurrent and sequential updates
- **Selector Support**: Validates custom selectors and reactivity
- **Store Stability**: Ensures stable action references and proper memoization
- **Direct Atom Access**: Tests direct atom reading and synchronization
- **Subscription & Reactivity**: Verifies re-renders on state changes

## Dependencies

- Uses: `@/shared/ui` (Input component)

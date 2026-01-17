# Settings Entity

Manages user financial settings with persistent storage.

## Public API (`index.ts`)

- `useSettingsStore`: Zustand store for settings state management
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

## Dependencies

- Uses: `@/shared/ui` (Input component)

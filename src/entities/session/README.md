# Session Entity

Manages ephemeral dashboard session state (not persisted, resets on reload).

## Public API (`index.ts`)

- `useSessionStore`: Reatom store hook for session state management

## State & Data

- **Store:** `useSessionStore` (Persistence: **None** - resets on reload)
- **State:**
  - `selectedDate`: Currently selected date (default: today)
- **Actions:**
  - `setSelectedDate(date)`: Set selected date
  - `nextDay()`: Move selected date forward by one day
  - `prevDay()`: Move selected date backward by one day
  - `nextMonth()`: Move selected date to the next month, preserving day or clamping to the nearest valid day
  - `prevMonth()`: Move selected date to the previous month, preserving day or clamping to the nearest valid day
  - `setToday()`: Reset selected date to today

## Dependencies

- None

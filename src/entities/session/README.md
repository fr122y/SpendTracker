# Session Entity

Manages ephemeral dashboard session state (not persisted, resets on reload).

## Public API (`index.ts`)

- `useSessionStore`: Zustand store for session state management

## State & Data

- **Store:** `useSessionStore` (Persistence: **None** - resets on reload)
- **State:**
  - `selectedDate`: Currently selected date (default: today)
  - `viewDate`: Current month being viewed in calendar (default: today)
- **Actions:**
  - `setSelectedDate(date)`: Set selected date
  - `setViewDate(date)`: Set view date for calendar
  - `nextMonth()`: Increment viewDate month
  - `prevMonth()`: Decrement viewDate month

## Dependencies

- None

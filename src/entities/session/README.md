# Session Entity

Manages ephemeral dashboard session state (not persisted, resets on reload).

## Public API (`index.ts`)

- `useSessionStore`: Reatom store hook for session state management

## State & Data

- **Store:** `useSessionStore` (Persistence: **None** - resets on reload)
- **State:**
  - `selectedDate`: Currently selected date (default: today)
  - `isFollowingToday`: Whether date rollover may keep `selectedDate` aligned
    with the current local day
- **Actions:**
  - `setSelectedDate(date)`: Set selected date
  - `nextDay()`: Move selected date forward by one day
  - `prevDay()`: Move selected date backward by one day
  - `nextMonth()`: Move selected date to the next month, preserving day or clamping to the nearest valid day
  - `prevMonth()`: Move selected date to the previous month, preserving day or clamping to the nearest valid day
  - `setToday()`: Reset selected date to today
  - `syncTodayIfFollowing()`: Refresh selected date to today only while
    follow-today mode is active
- **Date rollover:** The app may auto-update the selected date after midnight
  only while `isFollowingToday` is true. Manual date navigation disables this
  mode until `setToday()` is called.

## Dependencies

- None

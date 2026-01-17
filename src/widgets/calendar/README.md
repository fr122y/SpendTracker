# Calendar Widget

Interactive calendar displaying daily expense totals with visual indicators for expenses, salary, and advance days.

## Public API (`index.ts`)

- `Calendar`: Calendar grid component with expense day markers and month navigation

## State & Data

- **Stores:**
  - `useSessionStore`: viewDate, selectedDate, navigation actions
  - `useExpenseStore`: expenses for day markers
  - `useSettingsStore`: salaryDay, advanceDay for special day markers

## Features

- 7-column grid with Russian weekday headers (Пн-Вс)
- Month navigation (prev/next)
- Selected date highlight (blue)
- Today highlight (dark grey)
- Visual indicators:
  - Green dot: has expense
  - Emerald dot: salary day
  - Amber dot: advance day

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/entities/settings`, `@/shared/lib`

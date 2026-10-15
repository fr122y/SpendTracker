# Calendar Widget

Interactive calendar displaying daily operation markers with visual indicators
for expenses, salary, and advance days.

## Public API (`index.ts`)

- `Calendar`: Calendar grid component with expense day markers and month navigation

## State & Data

- `useSessionStore`: selectedDate and navigation actions
- `useExpenseStore`: visible operations for day markers
- `useSettingsStore`: salaryDay, advanceDay for special day markers
- Local scope state: all visible, personal, or shared operations

## Features

- 7-column grid with Russian weekday headers (Пн-Вс)
- Month navigation derived from `selectedDate` (prev/next month)
- Local `Все` / `Личные` / `Общие` operation scope filter for day markers
- Selected date highlight (blue)
- Today highlight (dark grey)
- Visual indicators for expense/salary/advance days
- Salary/advance marker on day `min(saved day, days in month)` via
  `getPaydayInMonth`: day 31 marks the last day of a short month; weekends are
  not shifted; corner dots per payday and an accessible name per cell
  (`10, Зарплата`); salary and advance on the same day show both colors and
  `Зарплата и аванс`
- Inline legend editor for salary/advance day: label stays visible, shows the
  1–31 range and Enter/Esc hint; out-of-range input shows an error and is not
  saved (blur discards it)

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/entities/settings`, `@/shared/lib` (incl. `payday`)

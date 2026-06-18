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

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/entities/settings`, `@/shared/lib`

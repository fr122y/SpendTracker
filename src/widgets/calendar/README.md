# Calendar Widget

Interactive calendar displaying daily expense totals with visual indicators for
expenses, salary, and advance days.

## Public API (`index.ts`)

- `Calendar`: Calendar grid component with expense day markers and month navigation

## State & Data

- `useSessionStore`: selectedDate and navigation actions
- `useExpenses`: expenses for day markers
- `useSettings`: salaryDay, advanceDay for special day markers

## Features

- 7-column grid with Russian weekday headers (Пн-Вс)
- Month navigation derived from `selectedDate` (prev/next month)
- Selected date highlight (blue)
- Today highlight (dark grey)
- Visual indicators for expense/salary/advance days

## Dependencies

- Uses: `@/entities/session`, `@/entities/expense`, `@/entities/settings`, `@/shared/lib`

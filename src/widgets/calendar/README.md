# Calendar Widget

Interactive calendar displaying daily expense totals with visual indicators.

## Public API (`index.ts`)

- `CalendarWidget`: Calendar grid component with expense day markers

## State & Data

- **Store:** Reads from `useExpenseStore`
- **Actions:** Date selection, month navigation

## Dependencies

- Uses: `@/entities/expense`, `@/shared/lib`

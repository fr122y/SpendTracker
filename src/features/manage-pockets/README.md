# Manage Pockets Feature

Forms for creating and renaming pockets and recording pocket purchases and transfers.

## Public API (`index.ts`)

- `CreatePocketForm`: creates a named pocket.
- `PocketOperationForm`: records a purchase or transfer for a pocket.
- `RenamePocketForm`: renames an existing pocket.

## State & Data

- Uses pocket mutations from `@/entities/pocket`.
- Uses expense mutations and categories for pocket operations.
- New operation dates default to the dashboard's shared `selectedDate`.

## Dependencies

- Uses: `@/entities/pocket`, `@/entities/expense`, `@/entities/category`, `@/entities/session`, `@/shared/ui`, `@/shared/lib`.

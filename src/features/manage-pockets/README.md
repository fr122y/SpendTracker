# Manage Pockets Feature

Forms for creating and renaming pockets and recording pocket purchases and transfers.

## Public API (`index.ts`)

- `CreatePocketForm`: creates a named pocket.
- `PocketOperationForm`: records a purchase or transfer for a pocket.
- `RenamePocketForm`: renames an existing pocket.

## State & Data

- Uses pocket mutations from `@/entities/pocket`.
- Submits go through `useSubmitLock`, so rapid repeated clicks send one request.
- Create and rename reject a name of another active pocket (trimmed,
  case-insensitive) with «Карман с таким названием уже есть», both from the
  cached list and from the server's `name_conflict` result.
- A pocket operation keeps one client id across retries of a failed request.
- Uses expense mutations and categories for pocket operations.
- New operations have no date field; they are saved on the dashboard's shared `selectedDate`.

## Dependencies

- Uses: `@/entities/pocket`, `@/entities/expense`, `@/entities/category`, `@/entities/session`, `@/shared/ui`, `@/shared/lib`.

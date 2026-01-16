# Projects Widget

Manages expense projects with budget tracking per project.

## Public API (`index.ts`)

- `ProjectsWidget`: Project list with expense summaries and budget progress

## State & Data

- **Store:** Reads from `useProjectStore`, `useExpenseStore`
- **Actions:** Project selection, budget overview

## Dependencies

- Uses: `@/entities/project`, `@/entities/expense`, `@/features/manage-projects`, `@/shared/ui`

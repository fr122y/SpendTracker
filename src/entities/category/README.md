# Category Entity

Manages expense categories through DB-backed query hooks and mutation actions.

## Public API (`index.ts`)

- `useCategories`: Query hook for the category list
- `useAddCategory`: Mutation hook for adding a category
- `useDeleteCategory`: Mutation hook for deleting a category
- `CategoryBadge`: Pill/badge component displaying emoji + name

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Default categories:** Seeded in the database for new users

## Validation

- Duplicate category names are enforced in the data layer and mirrored in the UI when needed

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Category type)

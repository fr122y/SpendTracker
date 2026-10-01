# Category Entity

Manages expense categories through DB-backed query hooks and mutation actions.

## Public API (`index.ts`)

- `useCategories`: Query hook for the category list
- `useAddCategory`: Mutation hook for adding a category
- `useDeleteCategory`: Mutation hook for deleting a category
- `useSharedBudgetCategories`: Query hook for active shared budget categories
- `useAddSharedBudgetCategory`: Mutation hook for adding a shared category
- `useUpdateSharedBudgetCategory`: Mutation hook for renaming a shared category
- `useArchiveSharedBudgetCategory`: Mutation hook for archiving a shared category
- `useCategorize` and `useSharedCategorize`: keyword-based category suggestion
  hooks for private and shared operations
- `CategoryBadge`: Pill/badge component displaying emoji + name

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Default categories:** Seeded in the database for new users
- **Shared budget categories:** Copied from the creator's private categories
  when a shared budget is created, then managed as an independent shared set
- **Suggestions:** Local keyword mappings use Fuse.js to match operation
  descriptions to categories

## Validation

- Duplicate category names are enforced in the data layer and mirrored in the UI when needed
- Shared expenses can only use active categories owned by the selected shared
  budget

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/entities/keyword-mapping` for category suggestions
- Uses: `@/shared/types` (Category type)

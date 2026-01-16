# Manage Categories Feature

CRUD operations for expense categories.

## Public API (`index.ts`)

- `CategoryForm`: Form for creating/editing categories
- `useManageCategories`: Hook with mutations for category CRUD

## State & Data

- **Mutation:** Uses TanStack Query mutations for CRUD operations
- **Actions:** Create, update, delete categories

## Dependencies

- Uses: `@/entities/category`, `@/shared/api`, `@/shared/ui`

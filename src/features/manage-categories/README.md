# Manage Categories Feature

CRUD operations for expense categories.

## Public API (`index.ts`)

- `CategoryManager`: Component for listing, adding, and deleting categories

## State & Data

- `useCategories`: Query hook for category data
- `useAddCategory`: Mutation hook for creating categories
- `useDeleteCategory`: Mutation hook for removing categories
- Duplicate-name validation is handled by the data layer and mirrored in the UI

## Features

- Lists all categories with emoji and name
- Delete button for each category
- Form to add new category (name + emoji)
- Validation: Prevents duplicate category names

## Dependencies

- Uses: `@/entities/category`, `@/shared/ui`

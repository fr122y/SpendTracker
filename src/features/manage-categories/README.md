# Manage Categories Feature

CRUD operations for expense categories.

## Public API (`index.ts`)

- `CategoryManager`: Component for listing, adding, and deleting categories

## State & Data

- **Store:** Uses `useCategoryStore` for category management
- **Actions:** Add category, delete category, validate unique names

## Features

- Lists all categories with emoji and name
- Delete button for each category
- Form to add new category (name + emoji)
- Validation: Prevents duplicate category names

## Dependencies

- Uses: `@/entities/category`, `@/shared/ui`

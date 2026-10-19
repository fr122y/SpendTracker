# Manage Categories Feature

CRUD operations for expense categories.

## Public API (`index.ts`)

- `CategoryManager`: Component for listing, adding, editing (name, emoji, palette color), and deleting categories

## State & Data

- `useCategories`: Query hook for category data
- `useAddCategory`: Mutation hook for creating categories
- `useDeleteCategory`: Mutation hook for removing categories with expense reassignment
- `useCategoryExpenseCount`: Query hook for the expense count shown in the delete dialog
- `useUpdateCategory`, `useUpdateSharedBudgetCategory`: Mutation hooks for editing categories
- `useKeywordMappings`, `useSharedKeywordMappings`, `useDeleteKeywordMapping`, `useDeleteSharedKeywordMapping`: rules list and optimistic rule deletion
- Duplicate-name validation is handled by the data layer and mirrored in the UI

## Features

- Lists all categories with emoji and name
- Color dot, edit and delete buttons for each category
- Form to add a category (name + one-grapheme emoji) or edit one (also a palette color picker); the personal and shared forms have distinct labels
- Validation: Prevents duplicate category names
- Each personal and shared category expands its auto-categorization rules (phrase and match type: `вся фраза` for `exact`, `по слову` for `fuzzy`) with a delete button per rule

## Dependencies

- Uses: `@/entities/category`, `@/entities/keyword-mapping`, `@/entities/shared-budget`, `@/shared/lib`, `@/shared/ui`

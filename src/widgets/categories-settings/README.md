# Categories Settings Widget

Wrapper widget for expense category management.

## Public API (`index.ts`)

- `CategoriesSection`: Wrapper around the category management feature

## State & Data

- Delegates to `CategoryManager` from `@/features/manage-categories`
- Category data comes from `useCategories`

## Features

- Header with section title
- Category CRUD operations

## Dependencies

- Uses: `@/features/manage-categories`

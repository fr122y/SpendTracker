# Features Layer

User interactions and business logic. Features orchestrate entities and handle async operations.

## Structure

Each feature folder should contain:

- `ui/` - Interactive components (forms, buttons with actions)
- `model/` - Feature-specific logic (if needed)
- `api/` - Server Actions for this feature
- `index.ts` - Public API exports

## Features

- **add-expense** - Form and logic for adding new expenses with AI categorization
- **manage-categories** - CRUD operations for expense categories
- **manage-projects** - CRUD operations for projects with budget allocation
- **manage-buckets** - CRUD operations for budget buckets (spending limits)
- **layout-editor** - Dashboard layout customization with drag-and-drop
- **widget-registry** - Central registry mapping widget IDs to component metadata

## Rules

1. Features can depend on entities and shared
2. Features MUST NOT depend on other features or widgets
3. All async operations use TanStack Query
4. AI calls use Server Actions with "Other" fallback on error

# Features Layer

User interactions and business logic. Features orchestrate entities and handle async operations.

## Structure

Each feature folder should contain:

- `ui/` - Interactive components (forms, buttons with actions)
- `model/` - Feature-specific logic (if needed)
- `api/` - Server Actions for this feature
- `index.ts` - Public API exports

## Features

- **add-expense** - Form and logic for adding new expenses
- **edit-expense** - Inline editing of expenses
- **delete-expense** - Deletion with confirmation
- **categorize-expense** - AI-powered categorization via Server Action
- **filter-expenses** - Date range and category filtering
- **dashboard-settings** - Widget visibility and layout editing

## Rules

1. Features can depend on entities and shared
2. Features MUST NOT depend on other features or widgets
3. All async operations use TanStack Query
4. AI calls use Server Actions with "Other" fallback on error

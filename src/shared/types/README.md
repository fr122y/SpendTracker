# Shared Types

Global TypeScript type definitions used across the application.

## Public API (`index.ts`)

### Entities

- `Expense`: Expense entity with id, description, amount, date, category, emoji, projectId
- `Category`: Category entity with id, name, emoji
- `Project`: Project entity with id, name, budget, color, createdAt
- `AllocationBucket`: Savings bucket with id, label, percentage

### Dashboard

- `WidgetId`: Union type for widget identifiers
- `ColumnConfig`: Column configuration with id, width, widgets
- `LayoutConfig`: Dashboard layout with columns array

### AI

- `CategorizationResult`: AI categorization result with category and emoji

## Type Conventions

- All entity types have `id: string`
- Dates stored as ISO strings (`string`)
- Currency amounts as `number` (in smallest unit or decimal)
- Optional fields marked with `?`

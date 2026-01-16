# Shared Types

Global TypeScript type definitions used across the application.

## Public API (`index.ts`)

- `Expense`: Expense entity type
- `Category`: Category entity type
- `Project`: Project entity type
- `Bucket`: Bucket entity type
- `LayoutConfig`: Dashboard layout configuration type

## Type Conventions

- All entity types have `id: string`
- Dates stored as ISO strings (`string`)
- Currency amounts as `number` (in smallest unit or decimal)
- Optional fields marked with `?`

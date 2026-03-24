# Add Expense Feature

Handles expense creation with local keyword-based categorization.

## Public API (`index.ts`)

- `ExpenseForm`: Form component for adding new expenses

## State & Data

- `useCategoryStore`: Category list for suggestion/manual override
- `useExpenseStore`: Mutation adapter for saving expense
- `useCategorize`: Shared hook over `keyword-mapping` entity and Fuse.js matcher

## Logic Flow

1. User enters description and amount
2. On description blur, fuzzy matcher suggests a category if keyword mapping exists
3. If no match, user picks category manually from `Select`
4. On manual selection submit, mapping is upserted, then expense is saved

## Dependencies

- Uses: `@/entities/expense`, `@/entities/category`, `@/entities/keyword-mapping`, `@/shared/ui`

# Shared Library

Utility functions and helpers used across the application.

## Public API (`index.ts`)

- `formatCurrency`: Format numbers as Russian ruble currency
- `formatDate`: Date formatting utilities
- `generateId`: UUID generation for entities
- `cn`: Classname utility (tailwind-merge compatible)

## Utilities

### Date Utilities

- `formatDate(date: Date): string`
- `getWeekDates(date: Date): Date[]`
- `getMonthDates(date: Date): Date[]`

### Currency Utilities

- `formatCurrency(amount: number): string`
- `parseCurrency(value: string): number`

### General Utilities

- `generateId(): string`
- `cn(...classes): string`

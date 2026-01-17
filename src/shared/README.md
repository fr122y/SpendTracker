# Shared Layer

Reusable utilities, UI components, and API clients. No business logic.

## Structure

- `ui/` - UI Kit components (Button, Input, TerminalPanel, ProgressBar)
- `api/` - Server Actions (AI categorization)
- `lib/` - Utility functions (cn, finance selectors)
- `types/` - Shared TypeScript types

## API

Server Actions are located in `api/` and use the OpenAI SDK.

```typescript
import { categorizeExpenseAction } from '@/shared/api'

const result = await categorizeExpenseAction('Молоко', 100, categories)
// Returns: { category: "Продукты", emoji: "🛒" }
```

## Library

Finance selectors for data aggregation:

```typescript
import {
  getMonthlyExpenses,
  getCategoryStats,
  getWeeklyStats,
} from '@/shared/lib'

const monthly = getMonthlyExpenses(expenses, new Date())
const stats = getCategoryStats(expenses, new Date())
const weekly = getWeeklyStats(expenses, new Date(), 10000)
```

## UI Kit

Components follow the terminal aesthetic:

```typescript
import { Button, Input, TerminalPanel, ProgressBar } from '@/shared/ui'
```

- Dark theme (zinc-900 background with glassmorphism)
- Emerald accent color
- Minimal, functional design

## Rules

1. Shared MUST NOT depend on entities, features, or widgets
2. All Server Actions live here
3. No `NEXT_PUBLIC_` environment variables
4. All components support ref forwarding

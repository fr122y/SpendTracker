# Shared Layer

Reusable utilities, UI components, and API clients. No business logic.

## Structure

- `ui/` - UI Kit components (Button, Input, TerminalPanel, ProgressBar)
- `api/` - Server Actions for app data (expenses, categories, keyword mappings)
- `lib/` - Utility functions (cn, finance selectors)
- `types/` - Shared TypeScript types

## API

Server Actions are located in `api/` and consumed via TanStack Query entity hooks.

```typescript
import { getKeywordMappings, saveKeywordMapping } from '@/shared/api'

const mappings = await getKeywordMappings()
await saveKeywordMapping('молоко', 'category-id')
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

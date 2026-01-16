# Shared Layer

Reusable utilities, UI components, and API clients. No business logic.

## Structure

- `ui/` - UI Kit components (Button, Input, Card, Modal, etc.)
- `api/` - Server Actions and API utilities
- `lib/` - Utility functions (cn, formatters, validators)
- `config/` - App constants and configuration
- `types/` - Shared TypeScript types

## API

Server Actions are located in `api/` and use the OpenAI SDK configured for DeepSeek.

```typescript
// Example: api/categorize.ts
'use server'

import { openai } from '@/shared/lib/ai-client'

export async function categorizeExpense(description: string) {
  // AI categorization logic
}
```

## UI Kit

Components follow the terminal aesthetic:

- Dark theme (zinc-950 background)
- Monospace accents (JetBrains Mono)
- Minimal, functional design

## Rules

1. Shared MUST NOT depend on entities, features, or widgets
2. All Server Actions live here
3. No `NEXT_PUBLIC_` environment variables

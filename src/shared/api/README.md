# Shared API

Server Actions (`'use server'`) serving as the API layer for the application.

## Public API (`index.ts`)

- `categorizeExpense`: AI-powered expense categorization
- `syncExpenses`: Data synchronization (if needed)

## Architecture

- All server-side logic must use `'use server'` directive
- No API Routes - Server Actions only
- OpenAI SDK for AI integrations (DeepSeek/OpenAI compatible)
- Environment variables in `.env.local` (no `NEXT_PUBLIC_` prefix)

## Error Handling

- AI failures fallback to "Other" category
- All actions return typed results with error states

# Shared API

Server Actions and shared query infrastructure for the application.

## Public API (`index.ts`)

- `categorizeExpenseAction(description, amount, categories)`: AI-powered expense categorization
- `queryClient`: TanStack Query client instance with default options

## Architecture

- All data mutations use Server Actions (`'use server'`)
- DB-backed entities read and write through TanStack Query hooks in their model layer
- No API Routes - Server Actions only
- OpenAI SDK is used for AI integrations
- Environment variables:
  - `AI_API_KEY` - API key for AI provider
  - `AI_BASE_URL` - Base URL for AI API (optional)
  - `AI_MODEL` - Model name (default: gpt-4o-mini)

## Error Handling

- AI failures fall back to "Другое"
- Invalid JSON responses return fallback
- Empty responses return fallback

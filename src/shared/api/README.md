# Shared API

Server Actions (`'use server'`) serving as the API layer for the application.

## Public API (`index.ts`)

- `categorizeExpenseAction(description, amount, categories)`: AI-powered expense categorization

## Actions

### `categorizeExpenseAction`

Categorizes an expense using AI based on description and amount.

**Parameters:**

- `description: string` - Expense description
- `amount: number` - Expense amount
- `categories: Category[]` - Available categories list

**Returns:** `Promise<CategorizationResult>` with `{ category, emoji }`

**Fallback:** Returns `{ category: "Другое", emoji: "📝" }` on any error

## Architecture

- All server-side logic uses `'use server'` directive
- No API Routes - Server Actions only
- OpenAI SDK for AI integrations (DeepSeek/OpenAI compatible)
- Environment variables:
  - `AI_API_KEY` - API key for AI provider
  - `AI_BASE_URL` - Base URL for AI API (optional)
  - `AI_MODEL` - Model name (default: gpt-4o-mini)

## Error Handling

- AI failures fallback to "Другое" category
- Invalid JSON responses return fallback
- Empty responses return fallback

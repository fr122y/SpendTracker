# Shared API

Server Actions and shared query infrastructure for the application.

## Public API (`index.ts`)

- `registerUser({ name, email, password })`: credentials registration with validation and default seeding
- `getKeywordMappings()`: get user keyword mappings joined with category metadata
- `saveKeywordMapping(keyword, categoryId)`: upsert keyword mapping for user
- `deleteKeywordMapping(id)`: delete mapping
- `queryClient`: TanStack Query client instance with default options

## Architecture

- All data mutations use Server Actions (`'use server'`)
- DB-backed entities read and write through TanStack Query hooks in their model layer
- No API Routes - Server Actions only
- Credentials auth uses `bcryptjs` hashing and shared auth seeding helper
- Keyword mappings are stored in DB and consumed client-side by Fuse.js matcher

## Error Handling

- Mutations rely on optimistic updates in entity layer with rollback toast on failure
- Registration returns user-facing validation and duplicate-email messages

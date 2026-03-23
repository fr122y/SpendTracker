# Auth (shared/auth)

NextAuth v5 authentication with Google OAuth and a Drizzle adapter.

## Public API (`index.ts`)

- `auth`: read the current session in Server Actions and Server Components
- `signIn`: server helper for auth flows
- `signOut`: server helper for auth flows
- `handlers`: route handlers exposed as `GET` and `POST`

## State & Actions

- `config.ts`: edge-safe provider and page config for middleware
- `index.ts`: full Node.js auth config with DB adapter and user seeding
- `types.ts`: module augmentation for `session.user.id`

## Dependencies

- Uses: `next-auth`, `@auth/drizzle-adapter`, `@/shared/db`

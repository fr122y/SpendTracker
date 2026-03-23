# Auth (shared/auth)

NextAuth v5 authentication with Google OAuth, credentials auth, and Drizzle adapter.

## Public API (`index.ts`)

- `auth`: read the current session in Server Actions and Server Components
- `signIn`: server helper for auth flows
- `signOut`: server helper for auth flows
- `handlers`: route handlers exposed as `GET` and `POST`

## State & Actions

- `config.ts`: edge-safe provider/page config for middleware
- `index.ts`: full Node.js auth config with adapter, credentials authorize callback, and callbacks/events
- `seed-defaults.ts`: shared new-user seeding helper used by Google and credentials registration
- `types.ts`: module augmentation for `session.user.id`

## Dependencies

- Uses: `next-auth`, `@auth/drizzle-adapter`, `bcryptjs`, `@/shared/db`

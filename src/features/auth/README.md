# Auth Feature (features/auth)

Google OAuth sign-in UI for the login page.

## Public API (`index.ts`)

- `SignInButton`: client-side Google sign-in trigger

## State & Actions

- Uses `next-auth/react` `signIn` on the client
- No local state or server actions

## Dependencies

- Uses: `next-auth/react`, `@/shared/auth` via the login route flow

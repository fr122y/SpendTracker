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

## Account Emails

Password reset and email verification flows should send account emails through
the server-only `sendAccountEmail` wrapper from
`@/shared/lib/account-email`. The selected provider is Resend, configured with
`RESEND_API_KEY`, `ACCOUNT_EMAIL_FROM`, and optional
`ACCOUNT_EMAIL_REPLY_TO`.

In development and tests, missing `RESEND_API_KEY` uses console preview mode
instead of sending real mail. Production must configure a verified sending
domain or subdomain with SPF, DKIM, and DMARC before real account emails are
enabled.

Credentials password reset uses one-time hashed tokens stored in the database.
Request actions return neutral success so unknown addresses and OAuth-only
accounts are not exposed.

## Dependencies

- Uses: `next-auth`, `@auth/drizzle-adapter`, `bcryptjs`, `@/shared/db`,
  `@/shared/lib`

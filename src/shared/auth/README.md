# Auth (shared/auth)

NextAuth v5 authentication with Google OAuth, credentials auth, and Drizzle adapter.

## Public API (`index.ts`)

- `auth`: read the current session in Server Actions and Server Components
- `authFresh`: `auth()` that checks the session against the database at once;
  for /account, the password change, and /login
- `keepCurrentSessionAfterVersionBump`: keep the current browser signed in
  after a password change ended the user's other sessions
- `nextSessionVersion`, `forgetUserSessionChecks`: bump the session version in
  a password update and drop this instance's cached checks of the user
- `getAccountProfile`: read minimal account profile data for the current user
- `signIn`: server helper for auth flows
- `signOut`: server helper for auth flows
- `handlers`: route handlers exposed as `GET` and `POST`

## State & Actions

- `config.ts`: edge-safe provider/page config for middleware
- `account-profile.ts`: server-only account profile lookup for the account page
- `index.ts`: full Node.js auth config with adapter, credentials authorize callback, and callbacks/events
- `seed-defaults.ts`: shared new-user seeding helper used by Google and credentials registration
- `session-revocation.ts`: session ids, versions, the 5-minute re-check, and
  revocation on sign-out (ADR 0004)
- `session-store.ts`: the database queries behind it
- `types.ts`: module augmentation for `session.user.id` and the JWT claims

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

Credentials password reset and email verification use one-time hashed tokens
stored in the database. Password reset requests return neutral success so
unknown addresses and OAuth-only accounts are not exposed. Email verification is
advisory in v1: credentials users can sign in before verification, but
unverified users see a dashboard banner with resend.

## Account Profile

The `/account` page reads session data through `auth()` and uses
`getAccountProfile(userId)` to show the current user's name, email, and
sign-in provider. Credentials users are identified by a stored password hash;
OAuth users use their linked account provider. Logout is handled by a route
server action that calls `signOut({ redirectTo: '/login' })`; the
`events.signOut` handler revokes the token's session id on the server.

## Session Revocation

JWT sessions are checked against the database in the Node.js `jwt` callback
(ADR 0004): a revoked `sid`, an outdated session version, or a missing user
ends the session. Routine requests re-check at most every 5 minutes per token;
`authFresh()` checks at once. The edge middleware does not check the database.

## Dependencies

- Uses: `next-auth`, `@auth/drizzle-adapter`, `bcryptjs`, `@/shared/db`,
  `@/shared/lib`

# Auth Feature (features/auth)

Authentication UI for the login page (credentials + Google OAuth).

## Public API (`index.ts`)

- `SignInButton`: client-side Google sign-in trigger
- `AuthTabs`: tab switcher for sign-in/registration
- `CredentialsSignInForm`: email/password sign-in form
- `RegisterForm`: credentials registration form

## State & Actions

- Uses `next-auth/react` `signIn` for Google and credentials
- Uses `registerUser` Server Action for registration
- Local UI state: active tab, form fields, loading/error states

## Dependencies

- Uses: `next-auth/react`, `@/shared/api`, `@/shared/auth` via route flow

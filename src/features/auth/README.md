# Auth Feature (features/auth)

Authentication UI for the login page (credentials + Google OAuth).

## Public API (`index.ts`)

- `SignInButton`: client-side Google sign-in trigger
- `AuthTabs`: tab switcher for sign-in/registration
- `CredentialsSignInForm`: email/password sign-in form
- `ForgotPasswordForm`: neutral password reset request form
- `RegisterForm`: credentials registration form
- `ResetPasswordForm`: new-password form for valid reset tokens

## State & Actions

- Uses `next-auth/react` `signIn` for Google and credentials
- Uses `registerUser`, `requestPasswordReset`, and `resetPassword` Server
  Actions for credentials account flows
- Preserves safe relative `callbackUrl` values so invite links can continue
  after login or registration
- Local UI state: active tab, form fields, password visibility, loading/error
  states
- Password reset request UI always shows neutral success for valid email input
  so account existence and provider type are not exposed

## Dependencies

- Uses: `next-auth/react`, `@/shared/api`, `@/shared/auth` via route flow

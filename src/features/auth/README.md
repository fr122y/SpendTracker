# Auth Feature (features/auth)

Authentication UI for the login page (credentials + Google OAuth).

## Public API (`index.ts`)

- `SignInButton`: client-side Google sign-in trigger
- `AuthTabs`: tab switcher for sign-in/registration
- `CredentialsSignInForm`: email/password sign-in form
- `EmailVerificationBanner`: dashboard banner for unverified credentials users
- `ForgotPasswordForm`: neutral password reset request form
- `RegisterForm`: credentials registration form
- `ResetPasswordForm`: new-password form for valid reset tokens

## State & Actions

- Uses `next-auth/react` `signIn` for Google and credentials
- Uses `registerUser`, `requestPasswordReset`, `resetPassword`,
  `resendEmailVerification`, and `verifyEmail` Server Actions for credentials
  account flows
- Preserves safe relative `callbackUrl` values so invite links can continue
  after login or registration
- Local UI state: active tab, form fields, password visibility, loading/error
  states
- Password reset request UI always shows neutral success for valid email input
  so account existence and provider type are not exposed
- Email verification is advisory in v1: registration still auto-signs in,
  unverified credentials users see a dashboard banner, and resend can issue a
  fresh 24-hour verification link

## Dependencies

- Uses: `next-auth/react`, `@/shared/api`, `@/shared/auth` via route flow

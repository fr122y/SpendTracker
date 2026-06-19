# Providers

Application-level providers that wire TanStack Query and Reatom into the app.

## Public API (`index.tsx`)

- `Providers`: Root provider component wrapping children with required context providers

## Providers Included

### ReatomProvider

Provides the Reatom frame for ephemeral UI state such as session and edit mode.

### QueryClientProvider

Provides the shared TanStack Query client for DB-backed async state.

- Uses shared `queryClient` instance from `@/shared/api`
- Default staleTime: 60000ms (1 minute)

### AppFreshnessController

Keeps long-running tabs fresh without forcing a full page reload.

- Refreshes active TanStack Query data after tab focus or browser reconnect
- Schedules a local midnight check for date-dependent defaults
- Preserves manually selected dates by syncing today only while session state is
  following today
- Shows a lightweight toast after long resume or day rollover refreshes

### Toaster (`sonner`)

Provides global toast notifications for async mutation failures and rollback
feedback.

- Mounted once in root providers
- Position: bottom-right
- Default toast duration: 4000ms

## Usage

```tsx
// src/app/layout.tsx
import { Providers } from '@/providers'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## Notes

- Reatom is used only for ephemeral UI state and does not require manual setup
- This component is a client component (`'use client'`)

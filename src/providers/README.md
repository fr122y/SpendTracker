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
- Default staleTime: 30000ms; stale queries refetch on tab focus and reconnect
  unless a mutation is pending

### AppFreshnessController

Keeps long-running tabs fresh without forcing a full page reload.

- Refreshes all active TanStack Query data after a new day or a pause of at
  least 5 minutes (a short return is left to the focus refetch)
- Schedules a local midnight check for date-dependent defaults
- Preserves manually selected dates by syncing today only while session state is
  following today
- Shows a lightweight toast after long resume or day rollover refreshes

### UnsavedChangesGuard

Asks to confirm leaving while a form holds typed text or a save is running or
paused offline. Deferred deletes do not count; neither does the redirect after
an expired session.

### NetworkStatus

A small status line: «Нет сети — изменения сохранятся, когда связь вернётся»
while offline, «Сохраняется…» for a paused save or one longer than 1 s.

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

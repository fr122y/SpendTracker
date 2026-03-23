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

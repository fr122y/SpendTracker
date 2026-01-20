# Providers

React context providers wrapping the application.

## Public API (`index.tsx`)

- `Providers`: Root provider component wrapping children with required context providers

## Providers Included

### QueryClientProvider

Provides TanStack Query client for async/server state management.

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

- Reatom stores use implicit context via `@reatom/react` and do NOT require manual providers
- This component is a client component (`'use client'`)

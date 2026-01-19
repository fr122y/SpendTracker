# Phase 2: Create Reatom Infrastructure

**Context:** Refer to `00_RULES.md` for architecture standards.

## Objective

Establish the global Reatom Context and Persistence utilities required for the stores.

## Steps

### 1. Create Context Provider

Create file: `src/shared/lib/reatom/provider.tsx`

**Requirements:**

- Must be a Client Component (`'use client'`).
- Use `createCtx` from `@reatom/core`.
- Use `reatomContext` from `@reatom/npm-react`.
- Instantiate the context inside a `useRef` (or similar stable reference) so it persists across re-renders.

```tsx
'use client'

import { createCtx } from '@reatom/core'
import { reatomContext } from '@reatom/npm-react'
import { type ReactNode, useRef } from 'react'

export function ReatomProvider({ children }: { children: ReactNode }) {
  const ctxRef = useRef<ReturnType<typeof createCtx> | null>(null)

  if (!ctxRef.current) {
    ctxRef.current = createCtx()
  }

  return (
    <reatomContext.Provider value={ctxRef.current}>
      {children}
    </reatomContext.Provider>
  )
}
```

### 2. Create Persistence Helper

Create file: `src/shared/lib/reatom/persist.ts`

**Requirements:**

- Import `withLocalStorage` from `@reatom/persist-web-storage`.
- Export a wrapper function `createPersist(key: string)` to enforce consistency.

```ts
import { withLocalStorage } from '@reatom/persist-web-storage'

export const createPersist = (key: string) => withLocalStorage({ key })
```

### 3. Create Barrel Export

Create file: `src/shared/lib/reatom/index.ts`

```ts
export { ReatomProvider } from './provider'
export { createPersist } from './persist'
```

### 4. Integrate into Root Layout

Update file: `src/app/layout.tsx` (or your root layout file).

- Import `ReatomProvider` from `@/shared/lib/reatom`.
- Wrap the entire application (children of body) with `<ReatomProvider>`.

## Verification

- Start the dev server.
- Ensure the app renders (no blank screen).
- Check the console for any Context-related errors.

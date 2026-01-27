# Migration Rules: Zustand to Reatom

## 1. Core Objective

Migrate existing state management from **Zustand** to **Reatom v4**.
**CRITICAL CONSTRAINT:** maintain full backward compatibility for React components. Do not modify components during the store migration phase.

## 2. Tech Stack & Dependencies

- **Core:** `@reatom/core` (`atom`, `action`, `createCtx`)
- **React:** `@reatom/npm-react` (`useAtom`, `useAction`, `reatomContext`)
- **Persistence:** `@reatom/persist-web-storage` (`withLocalStorage`)

## 3. Architecture Standards

### A. Atom Definition

- **NO** monolithic stores. Break state into atomic pieces where logical.
- **Explicit imports** only. Do not use `import *`.

### B. Persistence (Critical)

- **MUST** use the existing LocalStorage keys defined in the Registry below. Changing keys = data loss for users.
- Use the helper: `import { createPersist } from '@/shared/lib/reatom'` (setup in Phase 1).

### C. The "Adapter Pattern" (Backward Compatibility)

To keep the existing application working, you must export a hook with the **exact same signature** as the original Zustand store.

**Pattern:**

```typescript
import { atom, action } from '@reatom/core'
import { useAtom, useAction } from '@reatom/npm-react'

// 1. Define Primitives
export const countAtom = atom(0, 'countAtom')
export const increment = action(
  (ctx) => countAtom(ctx, (s) => s + 1),
  'increment'
)

// 2. Export Adapter Hook (Matches old Zustand API)
export function useCounterStore() {
  const [count] = useAtom(countAtom)
  const handleIncrement = useAction(increment)

  return {
    count,
    increment: handleIncrement,
  }
}
```

## 4. Migration Registry

Refer to this table for file paths and persistence keys.

| Store Name           | File Path                                          | Persistence Key         | Notes                          |
| -------------------- | -------------------------------------------------- | ----------------------- | ------------------------------ |
| **useSessionStore**  | `src/entities/session/model/store.ts`              | _(None)_                | Pure state, no persist         |
| **useSettingsStore** | `src/entities/settings/model/store.ts`             | `smartspend-settings`   | Simple fields                  |
| **useBucketStore**   | `src/entities/bucket/model/store.ts`               | `smartspend-buckets`    | Simple fields                  |
| **useCategoryStore** | `src/entities/category/model/store.ts`             | `smartspend-categories` | Array CRUD                     |
| **useProjectStore**  | `src/entities/project/model/store.ts`              | `smartspend-projects`   | Array CRUD                     |
| **useExpenseStore**  | `src/entities/expense/model/store.ts`              | `smartspend-expenses`   | **Core Entity**, generic types |
| **useLayoutStore**   | `src/features/layout-editor/model/layout-store.ts` | `smartspend-layout`     | Complex nested state           |

## 5. Coding Constraints

1. **Types:** Preserve all existing TypeScript interfaces (e.g., `Expense`, `Category`).
2. **Context:** All logic inside actions must use the `ctx` (Reatom Context).
3. **Naming:** Atoms = `nameAtom`, Actions = `verbNoun` (e.g., `addExpense`).
4. **Validation:** Ensure the exported hook returns an object, not a tuple/array.

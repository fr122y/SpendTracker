# Zustand to Reatom Migration Guide

This document provides step-by-step instructions for migrating SmartSpend Tracker from Zustand to Reatom.

---

## Table of Contents

1. [Current State Analysis](#1-current-state-analysis)
2. [Phase 1: Setup & Dependencies](#2-phase-1-setup--dependencies)
3. [Phase 2: Create Reatom Infrastructure](#3-phase-2-create-reatom-infrastructure)
4. [Phase 3: Migrate Stores One by One](#4-phase-3-migrate-stores-one-by-one)
5. [Phase 4: Update Components](#5-phase-4-update-components)
6. [Phase 5: Update Tests](#6-phase-5-update-tests)
7. [Phase 6: Update Documentation](#7-phase-6-update-documentation)
8. [Phase 7: Cleanup](#8-phase-7-cleanup)
9. [Rollback Plan](#9-rollback-plan)

---

## 1. Current State Analysis

### Existing Zustand Stores

| Store              | File                                               | Persisted | Key                     |
| ------------------ | -------------------------------------------------- | --------- | ----------------------- |
| `useExpenseStore`  | `src/entities/expense/model/store.ts`              | Yes       | `smartspend-expenses`   |
| `useSettingsStore` | `src/entities/settings/model/store.ts`             | Yes       | `smartspend-settings`   |
| `useLayoutStore`   | `src/features/layout-editor/model/layout-store.ts` | Yes       | `smartspend-layout`     |
| `useProjectStore`  | `src/entities/project/model/store.ts`              | Yes       | `smartspend-projects`   |
| `useBucketStore`   | `src/entities/bucket/model/store.ts`               | Yes       | `smartspend-buckets`    |
| `useCategoryStore` | `src/entities/category/model/store.ts`             | Yes       | `smartspend-categories` |
| `useSessionStore`  | `src/entities/session/model/store.ts`              | No        | -                       |

### Key Differences: Zustand vs Reatom

| Aspect                | Zustand                   | Reatom                        |
| --------------------- | ------------------------- | ----------------------------- |
| **Architecture**      | Single store with actions | Atoms (primitives) + Actions  |
| **State Definition**  | `create<State>()`         | `atom()`                      |
| **Actions**           | Inside store              | Separate `action()` functions |
| **Persistence**       | `persist` middleware      | `@reatom/persist-web-storage` |
| **React Integration** | Built-in hooks            | `@reatom/npm-react`           |
| **Bundle Size**       | ~1.5kb                    | ~2kb (core + react)           |

---

## 2. Phase 1: Setup & Dependencies

### Step 1.1: Install Reatom packages

```bash
npm install @reatom/core @reatom/npm-react @reatom/persist-web-storage
```

### Step 1.2: Remove Zustand (DO THIS LAST, after migration)

```bash
# Only run after all stores are migrated and tested
npm uninstall zustand
```

### Step 1.3: Create a new git branch

```bash
git checkout -b refactor/zustand-to-reatom
```

---

## 3. Phase 2: Create Reatom Infrastructure

### Step 2.1: Create Reatom context provider

Create file: `src/shared/lib/reatom/provider.tsx`

```tsx
'use client'

import { createCtx } from '@reatom/core'
import { reatomContext } from '@reatom/npm-react'
import { type ReactNode, useRef } from 'react'

export function ReatomProvider({ children }: { children: ReactNode }) {
  const ctx = useRef(createCtx())

  return (
    <reatomContext.Provider value={ctx.current}>
      {children}
    </reatomContext.Provider>
  )
}
```

### Step 2.2: Create persistence helpers

Create file: `src/shared/lib/reatom/persist.ts`

```ts
import { withLocalStorage } from '@reatom/persist-web-storage'

export const createPersist = (key: string) => withLocalStorage({ key })
```

### Step 2.3: Export from shared

Update file: `src/shared/lib/reatom/index.ts`

```ts
export { ReatomProvider } from './provider'
export { createPersist } from './persist'
```

### Step 2.4: Wrap app with ReatomProvider

Update file: `src/app/layout.tsx`

```tsx
import { ReatomProvider } from '@/shared/lib/reatom'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ReatomProvider>{children}</ReatomProvider>
      </body>
    </html>
  )
}
```

---

## 4. Phase 3: Migrate Stores One by One

### Migration Order (recommended)

1. `useSessionStore` (no persistence - simplest)
2. `useSettingsStore` (simple state)
3. `useBucketStore` (simple state)
4. `useCategoryStore` (array with CRUD)
5. `useProjectStore` (array with CRUD)
6. `useExpenseStore` (core entity)
7. `useLayoutStore` (complex state)

---

### 3.1: Migrate `useSessionStore`

**Before (Zustand):**

```ts
// src/entities/session/model/store.ts
import { create } from 'zustand'

interface SessionState {
  selectedDate: Date
  viewDate: Date
  setSelectedDate: (date: Date) => void
  setViewDate: (date: Date) => void
  nextMonth: () => void
  prevMonth: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
  selectedDate: new Date(),
  viewDate: new Date(),
  setSelectedDate: (selectedDate) => set({ selectedDate }),
  setViewDate: (viewDate) => set({ viewDate }),
  nextMonth: () =>
    set((state) => ({
      viewDate: new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth() + 1,
        1
      ),
    })),
  prevMonth: () =>
    set((state) => ({
      viewDate: new Date(
        state.viewDate.getFullYear(),
        state.viewDate.getMonth() - 1,
        1
      ),
    })),
}))
```

**After (Reatom):**

```ts
// src/entities/session/model/store.ts
import { atom, action } from '@reatom/core'

// Atoms (state)
export const selectedDateAtom = atom(new Date(), 'selectedDateAtom')
export const viewDateAtom = atom(new Date(), 'viewDateAtom')

// Actions
export const setSelectedDate = action((ctx, date: Date) => {
  selectedDateAtom(ctx, date)
}, 'setSelectedDate')

export const setViewDate = action((ctx, date: Date) => {
  viewDateAtom(ctx, date)
}, 'setViewDate')

export const nextMonth = action((ctx) => {
  const current = ctx.get(viewDateAtom)
  viewDateAtom(ctx, new Date(current.getFullYear(), current.getMonth() + 1, 1))
}, 'nextMonth')

export const prevMonth = action((ctx) => {
  const current = ctx.get(viewDateAtom)
  viewDateAtom(ctx, new Date(current.getFullYear(), current.getMonth() - 1, 1))
}, 'prevMonth')

// Backward-compatible hook (temporary, for gradual migration)
import { useAtom, useAction } from '@reatom/npm-react'

export function useSessionStore() {
  const [selectedDate] = useAtom(selectedDateAtom)
  const [viewDate] = useAtom(viewDateAtom)

  return {
    selectedDate,
    viewDate,
    setSelectedDate: useAction(setSelectedDate),
    setViewDate: useAction(setViewDate),
    nextMonth: useAction(nextMonth),
    prevMonth: useAction(prevMonth),
  }
}
```

---

### 3.2: Migrate `useSettingsStore`

**After (Reatom):**

```ts
// src/entities/settings/model/store.ts
import { atom, action } from '@reatom/core'
import { withLocalStorage } from '@reatom/persist-web-storage'

// Atoms with persistence
export const weeklyLimitAtom = atom(10000, 'weeklyLimitAtom').pipe(
  withLocalStorage('smartspend-settings-weeklyLimit')
)
export const salaryDayAtom = atom(10, 'salaryDayAtom').pipe(
  withLocalStorage('smartspend-settings-salaryDay')
)
export const advanceDayAtom = atom(25, 'advanceDayAtom').pipe(
  withLocalStorage('smartspend-settings-advanceDay')
)

// Actions
export const setWeeklyLimit = action((ctx, limit: number) => {
  weeklyLimitAtom(ctx, limit)
}, 'setWeeklyLimit')

export const setSalaryDay = action((ctx, day: number) => {
  salaryDayAtom(ctx, day)
}, 'setSalaryDay')

export const setAdvanceDay = action((ctx, day: number) => {
  advanceDayAtom(ctx, day)
}, 'setAdvanceDay')

// Backward-compatible hook
import { useAtom, useAction } from '@reatom/npm-react'

export function useSettingsStore() {
  const [weeklyLimit] = useAtom(weeklyLimitAtom)
  const [salaryDay] = useAtom(salaryDayAtom)
  const [advanceDay] = useAtom(advanceDayAtom)

  return {
    weeklyLimit,
    salaryDay,
    advanceDay,
    setWeeklyLimit: useAction(setWeeklyLimit),
    setSalaryDay: useAction(setSalaryDay),
    setAdvanceDay: useAction(setAdvanceDay),
  }
}
```

---

### 3.3: Migrate `useExpenseStore`

**After (Reatom):**

```ts
// src/entities/expense/model/store.ts
import { atom, action } from '@reatom/core'
import { withLocalStorage } from '@reatom/persist-web-storage'
import type { Expense } from '@/shared/types'

// Main atom with persistence
export const expensesAtom = atom<Expense[]>([], 'expensesAtom').pipe(
  withLocalStorage('smartspend-expenses')
)

// Actions
export const addExpense = action((ctx, expense: Expense) => {
  const current = ctx.get(expensesAtom)
  expensesAtom(ctx, [...current, expense])
}, 'addExpense')

export const deleteExpense = action((ctx, id: string) => {
  const current = ctx.get(expensesAtom)
  expensesAtom(
    ctx,
    current.filter((e) => e.id !== id)
  )
}, 'deleteExpense')

export const updateExpense = action(
  (ctx, id: string, data: Partial<Omit<Expense, 'id'>>) => {
    const current = ctx.get(expensesAtom)
    expensesAtom(
      ctx,
      current.map((e) => (e.id === id ? { ...e, ...data } : e))
    )
  },
  'updateExpense'
)

// Backward-compatible hook
import { useAtom, useAction } from '@reatom/npm-react'

export function useExpenseStore() {
  const [expenses] = useAtom(expensesAtom)

  return {
    expenses,
    addExpense: useAction(addExpense),
    deleteExpense: useAction(deleteExpense),
    updateExpense: useAction(updateExpense),
  }
}
```

---

### 3.4: Migrate `useLayoutStore`

**After (Reatom):**

```ts
// src/features/layout-editor/model/layout-store.ts
import { atom, action } from '@reatom/core'
import { withLocalStorage } from '@reatom/persist-web-storage'
import type { LayoutConfig, WidgetId } from '@/shared/types'

const DEFAULT_LAYOUT: LayoutConfig = {
  columns: [
    { id: 'col-1', width: 33, widgets: ['CALENDAR', 'EXPENSE_LOG'] },
    { id: 'col-2', width: 33, widgets: ['ANALYSIS', 'DYNAMICS'] },
    { id: 'col-3', width: 34, widgets: ['WEEKLY_BUDGET', 'SAVINGS'] },
  ],
}

// Atoms
export const layoutConfigAtom = atom<LayoutConfig>(
  DEFAULT_LAYOUT,
  'layoutConfigAtom'
).pipe(withLocalStorage('smartspend-layout'))
export const isEditModeAtom = atom(false, 'isEditModeAtom')

// Actions
export const toggleEditMode = action((ctx) => {
  const current = ctx.get(isEditModeAtom)
  isEditModeAtom(ctx, !current)
}, 'toggleEditMode')

export const moveWidget = action(
  (ctx, widgetId: WidgetId, fromColumnId: string, toColumnId: string) => {
    const config = ctx.get(layoutConfigAtom)
    const newColumns = config.columns.map((column) => {
      if (column.id === fromColumnId) {
        return {
          ...column,
          widgets: column.widgets.filter((w) => w !== widgetId),
        }
      }
      if (column.id === toColumnId) {
        return {
          ...column,
          widgets: [...column.widgets, widgetId],
        }
      }
      return column
    })
    layoutConfigAtom(ctx, { columns: newColumns })
  },
  'moveWidget'
)

export const moveWidgetInColumn = action(
  (ctx, columnId: string, fromIndex: number, toIndex: number) => {
    const config = ctx.get(layoutConfigAtom)
    const newColumns = config.columns.map((column) => {
      if (column.id !== columnId) return column
      const newWidgets = [...column.widgets]
      const [removed] = newWidgets.splice(fromIndex, 1)
      newWidgets.splice(toIndex, 0, removed)
      return { ...column, widgets: newWidgets }
    })
    layoutConfigAtom(ctx, { columns: newColumns })
  },
  'moveWidgetInColumn'
)

export const resizeColumn = action((ctx, columnId: string, width: number) => {
  const config = ctx.get(layoutConfigAtom)
  const clampedWidth = Math.min(100, Math.max(0, width))
  const newColumns = config.columns.map((column) =>
    column.id === columnId ? { ...column, width: clampedWidth } : column
  )
  layoutConfigAtom(ctx, { columns: newColumns })
}, 'resizeColumn')

// Backward-compatible hook
import { useAtom, useAction } from '@reatom/npm-react'

export function useLayoutStore() {
  const [layoutConfig] = useAtom(layoutConfigAtom)
  const [isEditMode] = useAtom(isEditModeAtom)

  return {
    layoutConfig,
    isEditMode,
    toggleEditMode: useAction(toggleEditMode),
    moveWidget: useAction(moveWidget),
    moveWidgetInColumn: useAction(moveWidgetInColumn),
    resizeColumn: useAction(resizeColumn),
  }
}
```

---

### 3.5: Migrate remaining stores

Apply the same pattern to:

- `useCategoryStore` → `categoriesAtom` + `addCategory`, `deleteCategory`
- `useProjectStore` → `projectsAtom` + `addProject`, `deleteProject`
- `useBucketStore` → `bucketsAtom` + `updateBuckets`

---

## 5. Phase 4: Update Components

### Component Migration Strategy

The backward-compatible hooks (`useExpenseStore()`, etc.) allow gradual migration. Components will work without changes initially.

**Optional: Direct atom usage in components**

```tsx
// Before (hook-based)
const { expenses, addExpense } = useExpenseStore()

// After (direct atoms - more granular)
import { useAtom, useAction } from '@reatom/npm-react'
import { expensesAtom, addExpense } from '@/entities/expense'

function ExpenseList() {
  const [expenses] = useAtom(expensesAtom)
  const handleAdd = useAction(addExpense)
  // ...
}
```

---

## 6. Phase 5: Update Tests

### Test Migration Example

**Before (Zustand):**

```ts
import { useExpenseStore } from '../store'

describe('ExpenseStore', () => {
  beforeEach(() => {
    useExpenseStore.setState({ expenses: [] })
  })

  it('adds expense', () => {
    const { addExpense } = useExpenseStore.getState()
    addExpense({ id: '1', amount: 100, ... })
    expect(useExpenseStore.getState().expenses).toHaveLength(1)
  })
})
```

**After (Reatom):**

```ts
import { createCtx } from '@reatom/core'
import { expensesAtom, addExpense } from '../store'

describe('ExpenseStore', () => {
  let ctx: ReturnType<typeof createCtx>

  beforeEach(() => {
    ctx = createCtx()
  })

  it('adds expense', () => {
    addExpense(ctx, { id: '1', amount: 100, ... })
    expect(ctx.get(expensesAtom)).toHaveLength(1)
  })
})
```

---

## 7. Phase 6: Update Documentation

### Files to Update

1. **CLAUDE.md** - Update state management section:

   ```markdown
   3. **State Management:**
      - **Reatom** (with `@reatom/persist-web-storage`) for Client State.
      - **TanStack Query v5** for Async/Server State.
   ```

2. **All slice README.md files** - Update store references

3. **src/entities/README.md** - Update entity patterns

---

## 8. Phase 7: Cleanup

### Step 7.1: Remove backward-compatible hooks (optional)

Once all components use atoms directly, remove the `useXxxStore()` wrapper functions.

### Step 7.2: Remove Zustand

```bash
npm uninstall zustand
```

### Step 7.3: Clean up imports

Search and remove all Zustand imports:

```bash
grep -r "from 'zustand'" src/
grep -r "from \"zustand\"" src/
```

---

## 9. Rollback Plan

If migration fails:

1. **Git reset:**

   ```bash
   git checkout main
   git branch -D refactor/zustand-to-reatom
   ```

2. **Restore dependencies:**
   ```bash
   npm install zustand
   npm uninstall @reatom/core @reatom/npm-react @reatom/persist-web-storage
   ```

---

## Migration Checklist

- [ ] Phase 1: Install Reatom packages
- [ ] Phase 2: Create ReatomProvider and persist helpers
- [ ] Phase 3.1: Migrate `useSessionStore`
- [ ] Phase 3.2: Migrate `useSettingsStore`
- [ ] Phase 3.3: Migrate `useBucketStore`
- [ ] Phase 3.4: Migrate `useCategoryStore`
- [ ] Phase 3.5: Migrate `useProjectStore`
- [ ] Phase 3.6: Migrate `useExpenseStore`
- [ ] Phase 3.7: Migrate `useLayoutStore`
- [ ] Phase 4: Verify all components work
- [ ] Phase 5: Update and run all tests
- [ ] Phase 6: Update CLAUDE.md and READMEs
- [ ] Phase 7: Remove Zustand dependency
- [ ] Final: Run `npm run validate`

---

## Estimated Scope

| Task               | Files Affected       |
| ------------------ | -------------------- |
| New infrastructure | 3 new files          |
| Store migrations   | 7 files              |
| Component updates  | ~15 files (optional) |
| Test updates       | ~5 files             |
| Documentation      | ~10 files            |

---

## Notes

- The backward-compatible hook pattern allows **incremental migration**
- You can keep both Zustand and Reatom during transition
- Persistence keys remain the same, so **user data is preserved**
- Run `npm run validate` after each store migration

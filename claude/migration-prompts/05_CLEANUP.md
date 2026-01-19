# Phase 5: Cleanup, Tests & Documentation

**Context:**

- All stores must be migrated before starting this phase.
- We are removing the dependency on `zustand`.

## Objective

Finalize the migration by updating tests, documentation, and removing the old library.

---

## Task 1: Update Documentation

**Files to check:** `CLAUDE.md`, `README.md`, `src/**/README.md`.

1. **CLAUDE.md:**
   - Locate the "State Management" section.
   - Replace "Zustand" with "**Reatom v3** (with `@reatom/npm-react` & `@reatom/persist-web-storage`)".

2. **Entity Documentation:**
   - If internal READMEs describe how to add new stores, update them to show the `atom` + `action` pattern instead of `createStore`.

---

## Task 2: Migrate Unit Tests

**Target:** Search for tests (`.test.ts` or `.spec.ts`) that import existing stores.

1. **Identify Breakages:**
   - Look for usage of `.getState()`, `.setState()`, or `.subscribe()`. These methods do not exist on the new Reatom hooks.

2. **Refactor Strategy:**
   - **If testing the Hook:** The hook API is compatible, so `renderHook(() => useStore())` might still work if you mocked the internal state correctly.
   - **If testing logic (Preferred):** Switch to testing Atoms directly using a Test Context.

     ```ts
     // OLD (Zustand)
     // store.setState({ count: 1 })
     // store.getState().increment()

     // NEW (Reatom)
     import { createCtx } from '@reatom/core'
     import { countAtom, increment } from './store'

     const ctx = createCtx()
     countAtom(ctx, 1) // Set initial state
     increment(ctx) // Run action
     expect(ctx.get(countAtom)).toBe(2)
     ```

---

## Task 3: Remove Zustand

**Crucial Step:** Ensure no file imports `zustand` anymore.

1. **Search & Destroy:**
   Run the following search to find leftovers:
   ```bash
   grep -r "from 'zustand'" src/
   ```

_If any files remain, migrate them or remove the import if unused._

2. **Uninstall:**
   ```bash
   npm uninstall zustand
   ```

---

## Task 4: Final Validation

1. **Type Check:**
   Run `npm run type-check` (or `tsc --noEmit`) to ensure all `useAction` / `useAtom` types resolve correctly.

2. **Lint:**
   Run `npm run lint` to catch unused variables.

3. **Build:**
   Run `npm run build` to verify the production bundle can be generated with the new Reatom dependencies.

## Rollback Plan (Emergency Only)

If the build fails catastrophically:

1. Revert git changes: `git checkout main` (or previous commit).
2. Re-install zustand: `npm install zustand`.

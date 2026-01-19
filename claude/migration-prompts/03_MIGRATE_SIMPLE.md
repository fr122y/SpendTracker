# Phase 3: Migrate Standard Stores

**Context:**

- Read `00_RULES.md` for the **Adapter Pattern** and **Registry Keys**.
- Read `src/shared/lib/reatom/index.ts` to import `createPersist`.

## Objective

Migrate 5 standard stores from Zustand to Reatom while keeping the public API (hook) identical.

---

## Task 1: Migrate Session Store (No Persistence)

**Target File:** `src/entities/session/model/store.ts`

1. **Read the file** to understand the current state (`selectedDate`, `viewDate`) and actions (`nextMonth`, etc.).
2. **Refactor:**
   - Create `selectedDateAtom` and `viewDateAtom` (initialize with `new Date()`).
   - Create actions for logic (e.g., `nextMonth` should read `viewDateAtom` via `ctx.get` and update it).
   - **Do not use persistence** for this store.
3. **Export Adapter Hook:**
   - Re-implement `useSessionStore` using `useAtom` and `useAction`.
   - Ensure it returns the exact same object structure as before.

---

## Task 2: Migrate Settings Store (Simple Persistence)

**Target File:** `src/entities/settings/model/store.ts`
**Key:** `smartspend-settings`

1. **Read the file** to see settings fields (e.g., `weeklyLimit`, `salaryDay`).
2. **Refactor:**
   - Define atoms for each setting.
   - Apply persistence:
     ```ts
     export const weeklyLimitAtom = atom(10000, 'weeklyLimitAtom').pipe(
       createPersist('smartspend-settings-weeklyLimit') // Note: Append suffix if needed, or persist object
     )
     ```
     _Note: If the original Zustand store persisted the whole object under one key, try to match that structure or migrate to granular atoms if cleaner._
3. **Export Adapter Hook.**

---

## Task 3: Migrate Entity Stores (Arrays/CRUD)

**Targets:**

1. `src/entities/bucket/model/store.ts` (Key: `smartspend-buckets`)
2. `src/entities/category/model/store.ts` (Key: `smartspend-categories`)
3. `src/entities/project/model/store.ts` (Key: `smartspend-projects`)

**Instructions for each file:**

1. **Read existing code.**
2. **Create Atoms:** usually one main atom for the array (e.g., `categoriesAtom`).
3. **Persist:** Use `createPersist` with the **EXACT key** from `00_RULES.md`.
4. **Create Actions:** Implement `add`, `update`, `delete` logic.
   - Remember: `ctx.get(atom)` to read current state inside an action.
   - Remember: `atom(ctx, newState)` to update.
5. **Adapter Hook:** Bind everything together.

## Verification

For each store:

- Check that `npm run dev` still works.
- Click around the UI components that use these stores to verify reactivity.
- Refresh the page to verify Persistence (except Session store).

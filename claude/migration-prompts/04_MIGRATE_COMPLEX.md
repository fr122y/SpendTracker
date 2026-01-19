# Phase 4: Migrate Complex Stores (Reatom v4)

**Context:**

- These stores contain complex logic (nested updates, array manipulation).
- **Reatom v4 Specifics:** Use the "Signal-like" API. Atoms are callable functions for reading/writing. `ctx` is implicit.

## Objective

Migrate the core business logic stores while preserving exact behavior.

---

## Task 1: Expense Store (Core Entity)

**Target:** `src/entities/expense/model/store.ts`
**Persistence Key:** `smartspend-expenses`

1. **Analyze Existing Logic:**
   - Read the file. Note existing types (e.g., `Expense` interface).
   - Look for actions like `addExpense`, `deleteExpense`, `updateExpense`.

2. **Refactor to Reatom v4:**
   - **Atom:** Create `expensesAtom` initialized with an empty array `[]`.
   - **Persistence:** Apply `createPersist('smartspend-expenses')` to this atom (using `.pipe` or `.extend`).
   - **Actions:** Re-implement the logic using immutable patterns.
     - **Read:** Call `expensesAtom()` (e.g., `const current = expensesAtom()`).
     - **Write:** Call `expensesAtom(newValue)`.
     - _Example:_
       ```ts
       export const addExpense = action((newExpense: Expense) => {
         expensesAtom([...expensesAtom(), newExpense])
       }, 'addExpense')
       ```

3. **Adapter Hook:**
   - Export `useExpenseStore`.
   - Map the new actions to the old API names using `useAction`.

---

## Task 2: Layout Store (Complex State)

**Target:** `src/features/layout-editor/model/layout-store.ts`
**Persistence Key:** `smartspend-layout`

1. **Analyze Existing Logic:**
   - This store likely manages `columns`, `widgets`, and `isEditMode`.
   - Notice that `isEditMode` usually should NOT be persisted, while the Layout Config MUST be.

2. **Refactor - Split State:**
   - **Config Atom:** Create `layoutConfigAtom` for the structure.
     - **Apply Persistence** (`smartspend-layout`).
   - **UI Atom:** Create `isEditModeAtom` (boolean).
     - **Do NOT persist** this (unless it was persisted in Zustand).

3. **Refactor - Complex Actions (v4 Style):**
   - **Move Widget:** Implement logic to remove a widget ID from one column and add to another.
     - **Read:** `const config = layoutConfigAtom()`
     - **Logic:** Perform deep clone/update on `config`.
     - **Write:** `layoutConfigAtom(newConfig)`
   - **Resize/Reorder:** Port the logic identically using the getter/setter pattern.

4. **Adapter Hook:**
   - Combine both atoms into one returned object to match the original `useLayoutStore` return type.
   - `const [config] = useAtom(layoutConfigAtom)`
   - `const [isEdit] = useAtom(isEditModeAtom)`

## Verification

1. **Critical:** Check the "Expense Log" or main list view. Add an item, refresh page. It must remain.
2. **Critical:** Enter "Edit Mode" in layout (if available). Move a widget. Refresh. The widget should stay in the new position.

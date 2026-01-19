# Phase 4: Migrate Complex Stores

**Context:**

- These stores contain complex logic (nested updates, array manipulation).
- Strict adherence to `00_RULES.md` regarding **Persistence Keys** is mandatory to prevent data loss.

## Objective

Migrate the core business logic stores while preserving exact behavior.

---

## Task 1: Expense Store (Core Entity)

**Target:** `src/entities/expense/model/store.ts`
**Persistence Key:** `smartspend-expenses`

1. **Analyze Existing Logic:**
   - Read the file. Note existing types (e.g., `Expense` interface).
   - Look for actions like `addExpense`, `deleteExpense`, `updateExpense`.

2. **Refactor to Reatom:**
   - **Atom:** Create `expensesAtom` initialized with an empty array `[]`.
   - **Persistence:** Apply `createPersist('smartspend-expenses')` to this atom.
   - **Actions:** Re-implement the logic using immutable patterns.
     - _Add:_ `[...current, new]`
     - _Delete:_ `current.filter(...)`
     - _Update:_ `current.map(...)`

3. **Adapter Hook:**
   - Export `useExpenseStore`.
   - Map the new actions to the old API names.

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

3. **Refactor - Complex Actions:**
   - **Move Widget:** Implement logic to remove a widget ID from one column and add to another.
     - Use `ctx.get(layoutConfigAtom)` to read.
     - Perform deep clone/update.
     - Write back to `layoutConfigAtom`.
   - **Resize/Reorder:** Port the logic identically.

4. **Adapter Hook:**
   - Combine both atoms into one returned object to match the original `useLayoutStore` return type.

## Verification

1. **Critical:** Check the "Expense Log" or main list view. Add an item, refresh page. It must remain.
2. **Critical:** Enter "Edit Mode" in layout (if available). Move a widget. Refresh. The widget should stay in the new position, but Edit Mode should likely be off (or on, depending on original logic).

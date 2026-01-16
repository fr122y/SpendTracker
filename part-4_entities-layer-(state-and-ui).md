# Part 4: Entities Layer (State & UI)

**Architecture Rule:**
All global client-side state must be implemented using **Zustand**.

- Use `persist` middleware to automatically save to `localStorage`.
- Do NOT use `useEffect` for syncing state.
- Store files location: `src/entities/{name}/model/store.ts`.

## Step 4.1: Expense Entity

**1. Define State (Zustand)**
Create `src/entities/expense/model/store.ts`.

- **State:** `expenses: Expense[]`
- **Actions:** `addExpense(expense)`, `deleteExpense(id)`, `updateExpense(id, data)`
- **Persistence:** Key `smartspend-expenses`.

**2. Test UI (TDD)**
Create `src/entities/expense/__tests__/ExpenseCard.test.tsx`.
Write tests to verify:

1.  **Rendering:** Ensure Emoji, Description, Amount, and Category are visible.
2.  **Interaction:** Ensure clicking the delete button fires the `onDelete` prop with the correct ID.
3.  **Accessibility:** The delete button must have an accessible label (e.g., `aria-label="delete"`).

**3. Implement UI**

- `ExpenseCard.tsx`: Presentational component matching the tests.
- `ExpenseList.tsx`: Map through expenses. Sort by `date` (descending). Show "No expenses" message if empty.

## Step 4.2: Category Entity

**1. Define State (Zustand)**
Create `src/entities/category/model/store.ts`.

- **State:** `categories: Category[]`
- **Persistence:** Key `smartspend-categories`.
- **Initialization:** If storage is empty, initialize with 6 default Russian categories (Groceries 🛒, Transport 🚕, Food ☕, Health 💊, Fun 🎬, Other 📝).
- **Actions:** `addCategory`, `deleteCategory`.

**2. Implement UI**

- `CategoryBadge.tsx`: Simple pill/badge display of emoji + name.

## Step 4.3: Project Entity

**1. Define State (Zustand)**
Create `src/entities/project/model/store.ts`.

- **State:** `projects: Project[]`
- **Persistence:** Key `smartspend-projects`.
- **Actions:** `addProject` (generate random color), `deleteProject`.

**2. Implement UI**

- `ProjectCard.tsx`: Show Name, Budget, and a visual progress bar of Spend vs Budget.

## Step 4.4: Bucket Entity (Savings)

**1. Define State (Zustand)**
Create `src/entities/bucket/model/store.ts`.

- **State:** `buckets: AllocationBucket[]`
- **Persistence:** Key `smartspend-buckets`.
- **Defaults:** Savings (20%), Investments (10%).
- **Actions:** `updateBuckets` (full replace or CRUD).

## Step 4.5: Settings Entity

**1. Define State (Zustand)**
Create `src/entities/settings/model/store.ts`.

- **State:** `weeklyLimit` (number), `salaryDay` (number 1-31), `advanceDay` (number 1-31).
- **Persistence:** Key `smartspend-settings`.
- **Actions:** `setWeeklyLimit`, `setSalaryDay`, `setAdvanceDay`.

**2. Implement UI**

- `FinancialSettings.tsx`: Simple form inputs connected to this store.

## Step 4.6: Session Entity (Dashboard State)

**1. Define State (Zustand)**
Create `src/entities/session/model/store.ts`.

- **Persistence:** `null` (Do not persist, resets on reload).
- **State:**
  - `selectedDate`: Date (default: today).
  - `viewDate`: Date (default: today, represents the current month being viewed).
- **Actions:**
  - `setSelectedDate(date)`
  - `setViewDate(date)`
  - `nextMonth()`: increments `viewDate` month.
  - `prevMonth()`: decrements `viewDate` month.

**Action:** Implement the Zustand stores and UI components using TDD methodology.

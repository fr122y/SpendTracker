# Part 6: Widgets Layer (Composition)

**Architecture Note:**
Widgets combine Entities (Stores) and Features (Mutations). They contain the logic of connecting global state to UI layouts.

## Step 6.1: Calendar Widget

**ui/Calendar.tsx**:

- **Connect:** `useSessionStore` (dates), `useExpenseStore` (events markers), `useSettingsStore` (salary/advance markers).
- **Layout:** 7-column grid with Russian headers (Пн-Вс).
- **Logic:**
  - Render days for the `viewDate` month.
  - Highlight `selectedDate` (Blue) and `today` (Dark Grey).
  - Visuals: Green Dot (has expense), Emerald Dot (salary day), Amber Dot (advance day).
  - Interaction: Clicking a day updates `selectedDate` in Session Store.

## Step 6.2: Expense Log Widget

**ui/ExpenseLog.tsx**:

- **Connect:** `useSessionStore` (selectedDate), `useExpenseStore` (list).
- **Components:**
  - Header: "Operations for [Formatted Date]" + Daily Total.
  - Feature: `<ExpenseForm />` (from `features/add-expense`).
  - List: `<ExpenseList />` (from `entities/expense`).
- **Logic:** Filter expenses by `selectedDate`. Exclude expenses with a `projectId` (personal expenses only).

## Step 6.3: Analysis Widget

**ui/AnalysisDashboard.tsx**:

- **Connect:** `useExpenseStore`, `useSessionStore` (viewDate).
- **Logic:** Use `getCategoryStats` selector to aggregate data for the current view month.
- **UI:** Grid of category boxes. Size/Opacity based on spending percentage. Tooltip shows exact amount.

## Step 6.4: Dynamics Chart Widget

**ui/DailySpendingChart.tsx**:

- **Connect:** `useExpenseStore`, `useSessionStore`.
- **UI:** Recharts `BarChart`.
  - X: Day of month. Y: Amount.
  - Highlight bar for `selectedDate`.
  - Click bar -> `setSelectedDate`.

## Step 6.5: Weekly Budget Widget

**ui/WeeklyBudget.tsx**:

- **Connect:** `useSettingsStore` (limit), `useExpenseStore`.
- **UI:** Progress bar (Blue -> Red). Input to edit `weeklyLimit` directly.

## Step 6.6: Savings & Settings Wrappers

Create simple widget wrappers:

1.  **Savings:** Renders `<BucketEditor />` (feature).
2.  **Categories:** Renders `<CategoryManager />` (feature).
3.  **Financial Settings:** Renders inputs linked to `useSettingsStore`.

## Step 6.7: Projects Widget

**ui/ProjectsSection.tsx**:

- **Connect:** `useProjectStore`.
- **UI:** Grid of `<ProjectCard />`.
- **Logic:** "Create Project" button opens a modal. Clicking a card expands it to show the project's specific `<ExpenseList />` and `<ProjectExpenseForm />`.

**Action:** Implement these widgets, strictly importing stores from `@/entities` and features from `@/features`.

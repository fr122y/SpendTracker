# Part 3: Shared Layer & API

## Step 3.1: Global Types

Create `src/shared/types/index.ts`.

```typescript
// Expense entity
interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  category: string; // Name of the category
  emoji: string;
  projectId?: string; // Optional
}

// Category entity
interface Category {
  id: string;
  name: string;
  emoji: string;
}

// Project entity
interface Project {
  id: string;
  name: string;
  budget: number;
  color: string;
  createdAt: string;
}

// Savings bucket
interface AllocationBucket {
  id: string;
  label: string;
  percentage: number;
}

// Dashboard Config
type WidgetId =
  | "CALENDAR"
  | "EXPENSE_LOG"
  | "ANALYSIS"
  | "DYNAMICS"
  | "WEEKLY_BUDGET"
  | "SAVINGS"
  | "PROJECTS"
  | "CATEGORIES"
  | "SETTINGS";

interface ColumnConfig {
  id: string;
  width: number;
  widgets: WidgetId[];
}

interface LayoutConfig {
  columns: ColumnConfig[];
}
```

## Step 3.2: AI Server Action (Secure)

Create `src/shared/api/ai-action.ts` marked with `'use server'`.
This replaces the direct client-side API call.

**Implementation Requirements:**

1.  **Directives:** File must start with `'use server'`.
2.  **SDK:** Use `openai` package initialized with `AI_API_KEY` (server-side env).
3.  **Function:** `categorizeExpenseAction(description: string, amount: number, categories: Category[])`.
4.  **Prompting:**
    - Ask AI to select one category from the provided list.
    - Output format: **JSON** (`{ "category": "...", "emoji": "..." }`).
    - Handle errors: Return a generic fallback (`{ category: "Другое", emoji: "📝" }`) if AI fails.

**TDD (Mocking Server Actions):**
Create `src/shared/api/__tests__/ai-action.test.ts`.
Since we cannot easily test Server Actions in Jest environment directly without integration setup, write a unit test that mocks the `openai` library behavior.

```typescript
// Example test expectation
it("should return valid JSON category on success", async () => {
  // Mock OpenAI response
  const result = await categorizeExpenseAction("Milk", 100, mockCategories);
  expect(result.category).toBe("Groceries");
});
```

## Step 3.3: Finance Utilities (Selectors)

Create `src/shared/lib/finance-selectors.ts`.
Implement pure functions for data aggregation (Test-First):

- `getMonthlyExpenses(expenses, date)`
- `getDailyExpenses(expenses, date)`
- `getCategoryStats(expenses, date)`: Returns `{ name, value, emoji, percent }[]` sorted by value.
- `getWeeklyStats(expenses, date)`: Returns `{ spent, limit, start, end }`.

## Step 3.4: Shared UI Components

Create `src/shared/ui/` with **shadcn-like** or custom Tailwind components.
**Note:** Ensure all interactive components pass `...props` and handle refs if possible.

1.  **Button:** Variants (primary, ghost, danger). Support `isLoading` prop.
2.  **Input:** Dark theme styling.
3.  **Card/TerminalPanel:**
    - The main container for widgets.
    - Props: `title`, `icon`, `isEditMode`, `onDelete`.
    - Style: Thin borders, glassmorphism effect or solid dark background.
4.  **ProgressBar:** Visual indicator for budgets. Green -> Yellow -> Red color transition.

**Action:** Implement these shared layers using TDD.

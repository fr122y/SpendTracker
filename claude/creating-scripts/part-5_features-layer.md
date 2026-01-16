# Part 5: Features Layer

## Step 5.1: Add Expense Feature (Async)

**1. Create Component (`src/features/add-expense/ui/ExpenseForm.tsx`)**
Implement a form using **TanStack Query** `useMutation`.

**Logic Flow:**

1.  User enters `description` and `amount`.
2.  On Submit:
    - Call `mutate({ description, amount })`.
    - Mutation Function: Calls the Server Action `categorizeExpenseAction`.
    - On Success:
      - Receive `{ category, emoji }` from server.
      - Call `expenseStore.addExpense(...)` with the result.
      - Reset form.
    - On Error:
      - Fallback to category "Other" (Другое) and save.

**2. Tests (Interaction)**
Create `src/features/add-expense/__tests__/ExpenseForm.test.tsx`.
Mock `useMutation` to verify that submitting the form triggers the mutation with correct parameters.

```typescript
// Conceptual test
it("should trigger mutation on submit", async () => {
  const { user } = render(<ExpenseForm />);
  await user.type(screen.getByPlaceholderText(/description/i), "Milk");
  await user.type(screen.getByPlaceholderText(/amount/i), "100");
  await user.click(screen.getByRole("button", { name: /add/i }));

  // Expect mutation to be called (mock implementation dependent)
});
```

## Step 5.2: Manage Categories

**1. Component (`CategoryManager.tsx`)**

- Connect to `useCategoryStore`.
- List categories with a "Delete" button.
- Add new category form (Name + Emoji Picker).
- Validation: Ensure name is unique.

## Step 5.3: Manage Projects

**1. Component (`CreateProjectForm.tsx`)**

- Connect to `useProjectStore`.
- Fields: Name, Budget limit.
- Action: Create project (auto-generate color).

**2. Component (`ProjectExpenseForm.tsx`)**

- Similar to main expense form but accepts a `projectId`.
- Skips AI categorization (optional) or uses it with a project context.

## Step 5.4: Manage Buckets (Savings)

**1. Component (`BucketEditor.tsx`)**

- Connect to `useBucketStore`.
- Interface to edit allocation percentages.
- Logic: Ensure total doesn't exceed 100%. Remainder is "Operations".

## Step 5.5: Layout Editor (Drag & Drop)

**1. Define State (`model/layout-store.ts`)**
Create a Zustand store for UI state: `useLayoutStore`.

- State: `layoutConfig` (columns, widgets), `isEditMode`.
- Persistence: Key `smartspend-layout`.
- Actions: `moveWidget`, `resizeColumn`, `toggleEditMode`.

**2. Components**

- `ColumnResizer.tsx`: Handle drag events to update column width %.
- `WidgetPlaceholder.tsx`: Drop zone logic.

**Action:** Implement these features connecting UI components to Zustand stores and React Query mutations.

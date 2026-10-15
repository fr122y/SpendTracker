# Expense Entity

Manages money operation records through DB-backed query hooks and mutation
actions. The database table is still named `expense`, but records may represent
real expenses, project withdrawals, project returns, or pocket transfers.

## Public API (`index.ts`)

- `useExpenses`: Query hook for the expense list
- `useAddExpense`: Mutation hook for creating a new expense
- `useDeleteExpense`: Mutation hook for deleting an expense by ID
- `useUpdateExpense`: Mutation hook for partial expense updates
- `ExpenseCard`: Presentational component displaying a single operation with
  optional date, type badge, shared budget metadata, and inline amount editing
  for real expenses. The optional `pocketName` prop adds the pocket name to
  the badge of a pocket operation: «Из кармана: <имя>» for a purchase and
  only «<имя>» for a transfer, whose category line already reads «Перевод из
  кармана»; without it the badge reads «Покупка из кармана» or «Перевод из
  кармана». `isPocketNameLoading` replaces that generic badge with a
  fixed-width placeholder. Transfer cards have a dashed violet border and a
  violet amount. Without `onDelete` the card
  has no delete action. `isPocketArchived` removes edit and delete actions and
  shows the hint «Карман в архиве — восстановите, чтобы изменить»
- `ExpenseList`: Component rendering a sorted list of operations with optional
  date display. The optional `pocketNames` prop (pocket id to name) supplies
  `pocketName` to the cards of pocket operations; `arePocketNamesLoading`
  passes `isPocketNameLoading`; `archivedPocketIds` marks
  operations of archived pockets read-only

## State & Data

- **Source of truth:** Database via Server Actions
- **Client cache:** TanStack Query
- **Data shape:** Records include amount, category, date, optional project link,
  optional pocket/shared budget links, author metadata, and `operationType`
- **Operation types:** `expense`, `project_withdrawal`, `project_return`,
  `pocket_transfer`
- **Visibility:** The list contains the current user's private expenses and
  shared expenses from budgets where the current user is a member
- **Scope rule:** Shared expenses cannot be linked to projects or project money
  operations. Pocket operations cannot be linked to projects or shared budgets.
- **Pocket behavior:** Purchases remain `expense` records; transfers are
  non-expense records with a pocket link.
- **Pocket names:** The entity does not read pockets. A widget resolves names
  and passes them through `pocketNames` / `pocketName`.
- **Shared metadata:** Shared expense cards display the shared budget name and
  author when server data includes them

## Dependencies

- Uses: `@/shared/api` (server actions + query client)
- Uses: `@/shared/types` (Expense type)
- Uses: `@/shared/ui` (ConfirmDialog and MathInput components)
- Uses: `lucide-react` (Trash2 icon)

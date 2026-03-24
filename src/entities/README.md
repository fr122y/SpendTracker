# Entities Layer

Business entities and their data access hooks. DB-backed entities use TanStack
Query on top of Server Actions; only ephemeral UI state stays in Reatom.

## Structure

Each entity folder should contain:

- `model/` - Query hooks, server-action adapters, and local validation helpers
- `ui/` - Presentational components for the entity
- `index.ts` - Public API exports
- `README.md` - Micro-documentation

## Entities

| Entity              | Public API                                                               | Data source                            | Description                                                     |
| ------------------- | ------------------------------------------------------------------------ | -------------------------------------- | --------------------------------------------------------------- |
| **expense**         | `useExpenses`, `useAddExpense`, `useDeleteExpense`, `useUpdateExpense`   | DB via Server Actions + TanStack Query | Expense records with amount, category, date, project link       |
| **category**        | `useCategories`, `useAddCategory`, `useDeleteCategory`                   | DB via Server Actions + TanStack Query | Expense categories (6 Russian defaults)                         |
| **keyword-mapping** | `useKeywordMappings`, `useSaveKeywordMapping`, `useDeleteKeywordMapping` | DB via Server Actions + TanStack Query | User keyword-to-category mappings for local auto-categorization |
| **project**         | `useProjects`, `useAddProject`, `useDeleteProject`                       | DB via Server Actions + TanStack Query | Projects for grouping expenses with budget                      |
| **bucket**          | `useBuckets`, `useUpdateBuckets`                                         | DB via Server Actions + TanStack Query | Allocation buckets (Savings 20%, Investments 10%)               |
| **settings**        | `useSettings`, `useUpdateSettings`                                       | DB via Server Actions + TanStack Query | Financial settings (weekly limit, salary/advance days)          |
| **session**         | `useSessionStore`                                                        | Reatom only                            | Ephemeral dashboard state (selected date, view date)            |

## Rules

1. Entities MUST NOT depend on features or widgets
2. DB-backed entities use TanStack Query for reads and mutations
3. Query hooks should expose `data` and `mutate` style APIs
4. Session entity remains Reatom-only and has no persistence

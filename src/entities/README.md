# Entities Layer

Business entities and their data models. Each entity owns its Reatom store and types.

## Structure

Each entity folder should contain:

- `model/` - Reatom store (atoms + actions), types, and selectors
- `ui/` - Presentational components for the entity
- `index.ts` - Public API exports
- `README.md` - Micro-documentation

## Entities

| Entity       | Store              | Persistence Key         | Description                                               |
| ------------ | ------------------ | ----------------------- | --------------------------------------------------------- |
| **expense**  | `useExpenseStore`  | `smartspend-expenses`   | Expense records with amount, category, date, project link |
| **category** | `useCategoryStore` | `smartspend-categories` | Expense categories (6 Russian defaults)                   |
| **project**  | `useProjectStore`  | `smartspend-projects`   | Projects for grouping expenses with budget                |
| **bucket**   | `useBucketStore`   | `smartspend-buckets`    | Allocation buckets (Savings 20%, Investments 10%)         |
| **settings** | `useSettingsStore` | `smartspend-settings`   | Financial settings (weekly limit, salary/advance days)    |
| **session**  | `useSessionStore`  | _none_                  | Ephemeral dashboard state (selected date, view date)      |

## Rules

1. Entities MUST NOT depend on features or widgets
2. Each entity has its own Reatom store (with localStorage persistence where applicable)
3. Store naming: `use[Entity]Store`
4. Persistence keys: `smartspend-[entity]`
5. Session entity has no persistence (resets on reload)

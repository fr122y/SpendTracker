# Entities Layer

Business entities and their data models. Each entity owns its Zustand store and types.

## Structure

Each entity folder should contain:

- `model/` - Zustand store, types, and selectors
- `ui/` - Presentational components for the entity
- `index.ts` - Public API exports

## Entities

- **expense** - Expense entity with amount, category, date, and optional project link
- **category** - Expense categories (predefined + custom)
- **project** - Project entity for grouping expenses with budget
- **bucket** - Budget buckets for spending limits per category

## Rules

1. Entities MUST NOT depend on features or widgets
2. Each entity has its own Zustand store with `persist` middleware
3. Store naming: `use[Entity]Store`
4. Persistence keys: `smartspend-[entity]`

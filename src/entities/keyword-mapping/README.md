# Keyword Mapping Entity

Хранит keyword-маппинги для автокатегоризации расходов.

## Public API (`index.ts`)

- `useKeywordMappings`
- `useSaveKeywordMapping`
- `useDeleteKeywordMapping`
- `useKeywordMappingStore`
- `useSharedKeywordMappings`
- `useSaveSharedKeywordMapping`
- `createMatcher`

## State & Actions

- Личные query-данные: список `KeywordMapping[]` из Server Action
  `getKeywordMappings`
- Общие query-данные: список `SharedKeywordMapping[]` из Server Action
  `getSharedKeywordMappings(sharedBudgetId)`
- Личные мутации: `saveKeywordMapping` (upsert) и `deleteKeywordMapping`
- Общие мутации: `saveSharedKeywordMapping` (upsert внутри общего бюджета)
- Все user-visible мутации используют optimistic update + rollback + invalidate
- Общие маппинги принадлежат shared budget, доступны всем его участникам и
  могут ссылаться только на активные категории этого же shared budget

## Dependencies

- `@/shared/api` (`keyword-actions`, `queryKeys`)
- `@/shared/types`
- `fuse.js` для fuzzy matching

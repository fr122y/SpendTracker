# Keyword Mapping Entity

Хранит пользовательские keyword-маппинги для автокатегоризации расходов.

## Public API (`index.ts`)

- `useKeywordMappings`
- `useSaveKeywordMapping`
- `useDeleteKeywordMapping`
- `useKeywordMappingStore`
- `createMatcher`

## State & Actions

- Query-данные: список `KeywordMapping[]` из Server Action `getKeywordMappings`
- Мутации: `saveKeywordMapping` (upsert) и `deleteKeywordMapping`
- Все user-visible мутации используют optimistic update + rollback + invalidate

## Dependencies

- `@/shared/api` (`keyword-actions`, `queryKeys`)
- `@/shared/types`
- `fuse.js` для fuzzy matching

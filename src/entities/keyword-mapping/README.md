# Keyword Mapping Entity

Хранит keyword-маппинги для автокатегоризации расходов.

## Public API (`index.ts`)

- `useKeywordMappings`
- `useSaveKeywordMapping`
- `useDeleteKeywordMapping`
- `useKeywordMappingStore`
- `useSharedKeywordMappings`
- `useSaveSharedKeywordMapping`
- `useDeleteSharedKeywordMapping`
- `createMatcher`: порядок — правило `exact`, равное всей нормализованной фразе; затем `fuzzy` целыми словами; затем однословное `fuzzy` с окончанием или опечаткой у целого слова (без подстрок внутри слова)

## State & Actions

- Личные query-данные: список `KeywordMapping[]` из Server Action
  `getKeywordMappings`
- Общие query-данные: список `SharedKeywordMapping[]` из Server Action
  `getSharedKeywordMappings(sharedBudgetId)`
- Личные мутации: `saveKeywordMapping` (upsert) и `deleteKeywordMapping`
- Общие мутации: `saveSharedKeywordMapping` (upsert внутри общего бюджета) и `deleteSharedKeywordMapping`
- Ручной выбор категории сохраняет правило `exact` (`matchType`); дефолтные и старые правила — `fuzzy`
- Все user-visible мутации используют optimistic update + rollback + invalidate
- Общие маппинги принадлежат shared budget, доступны всем его участникам и
  могут ссылаться только на активные категории этого же shared budget

## Dependencies

- `@/shared/api` (`keyword-actions`, `queryKeys`)
- `@/shared/types`
- `@/shared/lib` (`normalizeKeywordPhrase`)

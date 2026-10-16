# Proposal

## Why

Уникальность имён активных карманов сейчас проверяет только приложение (T-037): `createPocket`, `renamePocket` и `restorePocket` читают активные карманы под блокировкой строки пользователя. Запись в обход этих действий (другой код, ручной SQL) всё ещё может создать два активных кармана с одним именем. Задача T-058: база данных гарантирует то же правило.

## What Changes

- Миграция `drizzle/0015_pocket_active_name_unique.sql`: частичный уникальный индекс `pocket_active_name_unique_idx` на `pocket ("userId", lower(btrim("name"))) WHERE "archivedAt" IS NULL`. Прецедент — `shared_budget_category_active_name_idx`.
- `schema.ts` отражает индекс у таблицы `pocket`.
- `createPocket`, `renamePocket`, `restorePocket` сохраняют проверку под блокировкой и дополнительно превращают нарушение этого индекса (`23505`) в тот же результат `name_conflict`.

Вне объёма: очистка существующих дубликатов на production (до применения миграции на production её выполняет владелец), idempotency расходов.

Риски: миграция падает, если в базе уже есть дубликаты активных имён; на development проверено применением миграции.

## Capabilities

### Modified Capabilities

- `pockets`: требование «Keep active pocket names unique» — правило гарантирует база данных.

## Impact

- `drizzle/0015_pocket_active_name_unique.sql`, `src/shared/db/schema.ts`, `src/shared/api/pocket-actions.ts` и его тесты.

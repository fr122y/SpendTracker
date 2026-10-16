# Tasks

## 1. Тесты

- [x] 1.1 Unit-тесты `pocket-actions`: нарушение `pocket_active_name_unique_idx` в create, rename и restore возвращает `name_conflict`; нарушение другого ограничения пробрасывается.

## 2. Реализация

- [x] 2.1 Миграция `0015_pocket_active_name_unique.sql` и индекс в `schema.ts`.
- [x] 2.2 Обработка `23505` в `withPocketNameLock`.

## 3. Проверка

- [x] 3.1 Применить миграцию к development (`npm run db:migrate`).
- [x] 3.2 Выполнить `npm run spec:check` и `npm run validate`.

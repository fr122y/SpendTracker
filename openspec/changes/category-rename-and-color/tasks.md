# Tasks

## 1. Схема

- [x] 1.1 Миграция `0017_category_color.sql` и колонка `color` в `schema.ts`.

## 2. Тесты

- [x] 2.1 Unit-тесты `updateCategory`: перенос имени на личные операции, другие пользователи и общие операции не затронуты, дубль и пустое имя отклонены, эмодзи-графема, формат цвета.
- [x] 2.2 Unit-тесты `updateSharedBudgetCategory` с цветом, палитры, fallback-цвета, графем и цвета плитки.
- [x] 2.3 UI-тесты настроек категорий и плиток «Анализа».

## 3. Реализация

- [x] 3.1 Палитра, графемы и проверка изменения в `shared/lib`.
- [x] 3.2 Server Actions `updateCategory` и расширенный `updateSharedBudgetCategory`.
- [x] 3.3 Мутация `useUpdateCategory`, `useSharedBudgetCategoryLists`, оптимистичные обновления.
- [x] 3.4 Редактирование, выбор цвета и подписи в `CategoryManager`.
- [x] 3.5 Цвет и подпись типа на плитках «Анализа».

## 4. Проверка

- [x] 4.1 `npm run spec:check` и `npm run validate`.
- [ ] 4.2 Применить миграцию к DEV через `npm run db:migrate` и проверить на Preview.

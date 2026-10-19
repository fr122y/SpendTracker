# Tasks

## 1. Тесты

- [x] 1.1 Unit-тесты `deleteCategoryWithReassign` и `countCategoryExpenses`: перенос и число, фильтр личных операций, чужая и та же цель, последняя категория, каскад правил.
- [x] 1.2 UI-тесты диалога: цель по умолчанию, выбор цели, путь с нулём операций, запрет удаления последней категории.

## 2. Реализация

- [x] 2.1 Server Actions в `category-actions.ts`.
- [x] 2.2 Мутация и запрос числа операций в `entities/category`, инвалидация кэшей.
- [x] 2.3 Диалог удаления в `CategoryManager`.

## 3. Проверка

- [x] 3.1 Выполнить `npm run spec:check` и `npm run validate`.

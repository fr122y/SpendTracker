# Tasks

## 1. Тесты

- [x] 1.1 Unit-тесты `normalizeMoneyAmount` и округления в `addExpense`, `updateExpense`, `addProject`, `setWeeklyLimitForWeek`, `setPocketMonthBudget`.

## 2. Реализация

- [x] 2.1 Миграция `0016_money_columns_numeric.sql`, колонки и ограничения в `schema.ts`.
- [x] 2.2 Округление сумм до копеек в Server Actions.

## 3. Проверка

- [ ] 3.1 Применить миграцию к development (`npm run db:migrate`) — после решения владельца.
- [x] 3.2 Выполнить `npm run spec:check` и `npm run validate`.

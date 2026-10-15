# Design

## Context

`getWeeklyBudgetCoverage` уже возвращает `personalSpent` (реальная сумма), `weeklyLimit`, пополнения и `uncovered`; виджет показывал `personalCovered` (обрезан лимитом) и считал остаток сам. Лимиты хранятся по неделям в `weekly_budget_limit.effectiveWeekStart` (text). Виджет уже передаёт в `setWeeklyLimitForWeek` понедельник выбранной даты, посчитанный в браузере; по часам сервера неделю считала только ветка `weeklyLimit` в `updateSettings`.

## Decisions

- `getWeeklyBudgetSummary(coverage)` в `finance-selectors` выводит `spent`, `baseLimit`, `topUp`, `effectiveLimit`, `remaining ≥ 0`, `overBudget ≥ 0`. Виджет только форматирует, поэтому правила проверяются unit-тестами без UI.
- `isValidWeeklyLimitAmount` (конечное число > 0) и `isWeekStartDate` (реальная дата `YYYY-MM-DD`, понедельник по календарю, без часового пояса) используют и форма, и Server Action.
- `updateSettings` проверяет `weeklyLimit` и `weeklyLimitWeekStart` до любой записи; без недели запрос отклоняется, а не дополняется часами сервера. Текущих вызовов этой ветки в клиенте нет.
- Ошибка формы — `role="alert"` с `aria-invalid`/`aria-describedby`; некорректный ввод остаётся в поле и не отправляется. Общая валидация `min` у `MathInput` для личного лимита снята, чтобы 0 и отрицательное значение не обрезались молча, а давали ошибку.

## Risks

- Уже сохранённые лимиты 0 и строки с неделей не с понедельника остаются; сводка их показывает как есть. Миграция не требуется.
- Внешний вызов `updateSettings({ weeklyLimit })` без недели теперь падает; в коде таких вызовов нет.

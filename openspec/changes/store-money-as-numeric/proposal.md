# Proposal

## Why

Денежные колонки имеют тип `real` (float4) и хранят копейки точно только примерно до 167 тыс. ₽, хотя предел суммы — 100 000 000 ₽ (T-036). Задача T-057: суммы хранятся точно с копейками во всём допустимом диапазоне, а база данных сама не принимает суммы, которые отклоняет приложение.

## What Changes

- Миграция `drizzle/0016_money_columns_numeric.sql` переводит на `numeric(12,2)` семь колонок: `expense.amount`, `pocket_month_budget.budget`, `project.budget`, `weekly_budget_limit.amount`, `shared_budget_weekly_limit.amount`, `user_settings.weeklyLimit`, `user_settings.salary`. Значения округляются до копеек; умолчания `user_settings` пересоздаются.
- Новые CHECK-ограничения `NOT VALID` повторяют правила Server Actions: операция больше 0 (у перевода в карман допустим 0 — полный возврат), бюджет проекта и недельные лимиты больше 0, доход не меньше 0, бюджет кармана не больше предела (нижняя граница уже есть); везде не больше 100 000 000.
- `schema.ts` описывает колонки как `numeric(12, 2)` в режиме `mode: 'number'`: код по-прежнему получает числа.
- Server Actions округляют входящие суммы до копеек (`normalizeMoneyAmount` на основе `roundToKopecks`) перед проверкой и записью, как разбор суммы в форме.

Вне объёма: `allocation_bucket.percentage` и `amountKopecks`; применение миграции к development и production (защищённая операция владельца); очистка старых строк, нарушающих новые ограничения.

Риски: миграция падает на значениях ≥ 1e10. `NOT VALID` не проверяет старые строки, но обновление такой строки (например, расход больше 100 млн ₽) будет отклонено. Положительная сумма меньше 0,005 ₽ теперь округляется до 0 и отклоняется там, где ноль не разрешён.

## Capabilities

### Modified Capabilities

- `amount-input`: требование «Keep amounts within the allowed range» — сервер округляет до копеек, база данных гарантирует диапазон; новое требование о точном хранении.

## Impact

- `drizzle/0016_money_columns_numeric.sql`, `src/shared/db/schema.ts`, `src/shared/lib/money-amount.ts`, Server Actions операций, проектов, карманов, настроек и общих бюджетов, их тесты.

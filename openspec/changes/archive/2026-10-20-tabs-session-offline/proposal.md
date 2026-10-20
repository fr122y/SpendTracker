# Proposal

## Why

Прожарка 2026-10-15 (T-054) нашла четыре проблемы надёжности:

- вкладка B не видит изменений вкладки A при возврате: `refetchOnWindowFocus: false`, а `AppFreshnessController` обновлял всё подряд на каждый фокус — тяжёлый каскад из ~10 последовательных server actions (~3,9 с, T-028) даже при быстром переключении;
- после выхода в другой вкладке сохранение даёт общий toast «Не удалось сохранить», введённое теряется, перехода на вход нет; `/account` без входа ведёт на `/login` без `callbackUrl`;
- офлайн действие выглядит сохранённым без индикатора; долгие сохранения (Slow 3G) идут без обратной связи;
- закрытие страницы с несохранённым вводом проходит без предупреждения.

Решение владельца 2026-10-15: достаточно refetch on focus плюс корректная обработка истёкшей сессии. Синхронизация вкладок и разрешение конфликтов не нужны.

## What Changes

- Запросы: `staleTime` 30 с, `refetchOnWindowFocus` и `refetchOnReconnect` включены для устаревших данных, но пропускаются, пока есть незавершённая (в т. ч. приостановленная офлайн) мутация. `AppFreshnessController` обновляет всё только при смене дня или паузе ≥ 5 мин.
- Истёкшая сессия: любая ошибка запроса или мутации проверяется одним запросом `/api/auth/session`; если сессии нет — toast «Сессия истекла — войдите снова», черновики форм уходят в `sessionStorage`, переход на `/login?callbackUrl=<текущий путь>&reason=session-expired`; после входа черновики возвращаются в формы. Общий toast «Не удалось сохранить» для этого случая не показывается. Middleware отвечает 401 на server action без сессии и добавляет `callbackUrl` при переходе на вход; `/account` ведёт на `/login?callbackUrl=/account`.
- Офлайн: строка статуса «Нет сети — изменения сохранятся, когда связь вернётся»; мутации приостанавливаются (`networkMode: 'online'`, по умолчанию) после оптимистичного обновления и продолжаются при восстановлении сети; «Сохраняется…» показывается для приостановленных и для идущих дольше 1 с сохранений.
- `beforeunload` предупреждает, если в форме есть введённый текст или сохранение ещё идёт/ждёт сети. Отложенные удаления не считаются: они уходят keepalive (ADR 0003).

Вне рамок: BroadcastChannel, проверка `updatedAt`, разрешение конфликтов, постоянная офлайн-очередь.

## Capabilities

### New Capabilities

- `session-and-connectivity`: свежесть данных при возврате во вкладку, истёкшая сессия, офлайн и предупреждение при уходе.

### Modified Capabilities

None.

## Impact

Код: `src/shared/api/query-client.ts`, `src/shared/lib/session-expiry.ts`, `src/shared/lib/mutation-toast.ts`, `src/shared/lib/hooks/use-form-draft.ts`, `src/shared/lib/auth-redirect.ts`, `src/middleware.ts`, `src/app/account/page.tsx`, `src/providers/*` (`NetworkStatus`, `UnsavedChangesGuard`, `AppFreshnessController`), `AuthTabs`, формы с черновиками, `useExpenseStore().addExpense` (возвращает `Promise<boolean>`). Новый e2e `e2e/tabs-session-offline.spec.ts`.

Риски: лишний запрос `/api/auth/session` на каждую ошибку; refetch на фокус после ≥ 30 с запускает тот же каскад чтений, что и загрузка.

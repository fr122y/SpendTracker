# Design

## Pending ids

`src/shared/lib/pending-ids.ts` хранит в памяти вкладки `Map<id, deferred>`.

- `createTempId()` и `isTempId(id)` — единый префикс `temp-`.
- `trackPendingId(id)` вызывается из `onMutate` создания и возвращает `{ resolve(realId), reject(error) }`; `onSuccess` разрешает id и заменяет в кэше временный id настоящим (правки, сделанные над оптимистичной строкой, сохраняются), `onError` отклоняет после отката.
- `resolveId(id)`: id, который не ждёт создания и не временный, возвращается сразу; ожидающий — после ответа сервера; временный без регистрации или с неудачным созданием — `PendingIdLostError`.
- `resolveIdFields(input, keys)` — то же для ссылок внутри входа мутации (`pocketId`, `projectId`, `sharedBudgetId`, `sharedBudgetCategoryId`, `categoryId`).
- `isPendingIdLostError(error)` — мутация, чья запись не сохранилась, не откатывает кэш (иначе вернула бы удалённую создавшим откатом строку) и не показывает второй toast; `onSettled` перечитывает данные как обычно.

Расход создаётся с client UUID, поэтому его id не меняется, но пока вставка не завершилась он тоже зарегистрирован как ожидающий: удаление ждёт вставку и не опережает её.

Запросы по id (`usePocketMonthBudget`, `usePocketMonthBudgets`, `useCategoryExpenseCount`, `useSharedBudgetCategories`, `useSharedKeywordMappings`) выключены, пока id временный.

```mermaid
sequenceDiagram
  participant UI
  participant Create as create mutation
  participant Op as dependent mutation
  participant S as server
  UI->>Create: mutate (optimistic temp row)
  UI->>Op: delete/edit temp id (optimistic)
  Op->>Op: await resolveId(temp)
  Create->>S: create
  S-->>Create: real record
  Create->>Op: resolve(realId)
  Op->>S: operation(realId)
```

## Server defense

Server action при ошибке отвечает 500, а сообщение в prod скрыто, поэтому защита — результат, а не исключение. `isUnsavedRecordId(id)` (`src/shared/api/unsaved-record.ts`, не `'use server'`) проверяет префикс. Чтения отдают `[]`, `null` или `0`; удаления и архивирование — no-op; изменения без возвращаемой записи — no-op; `renamePocket` и `restorePocket` возвращают `{ status: 'unsaved_record' }`; `setPocketMonthBudget` и `updateCategory` возвращают `null`. Клиент такие ответы получает только при ошибке в собственном коде, поэтому отдельный toast не нужен: мутация перечитывает данные.

Создания, в которых временный id — ссылка (`addExpense` с `pocketId`), защищены клиентским `resolveIdFields`; серверная проверка ссылки там уже отклоняет несуществующую запись.

## Reliable deferred delete

Server action, запущенный в `pagehide`, браузер не доводит до конца. `fetch` с `keepalive: true` переживает выгрузку страницы. Поэтому:

1. `scheduleExpenseDelete` пишет `{ id, dueAt }` в `localStorage` (`spendtracker:pending-expense-deletes`), `undo` и успешный commit удаляют запись.
2. `pagehide` или `visibilitychange: hidden` отправляет все ожидающие id одним `POST /api/expenses/flush-deletes` с `keepalive`; записи остаются в хранилище до ответа 2xx.
3. При загрузке приложения записи с `dueAt <= now` отправляются тем же route, до подтверждения скрыты из списка расходов, после — список перечитывается. `dueAt` защищает соседнюю вкладку: её удаление в окне «Отменить» не отправляется чужой загрузкой.

Route handler проверяет сессию (401), принимает JSON `{ ids: string[] }` до 100 id (400 иначе), пропускает `temp-` и не-UUID, для каждого id вызывает общий с `deleteExpense` код удаления: чужой и отсутствующий id — пропуск, архивный карман и отрицательный остаток проекта — отказ этого id без 500. Ответ `200 { deleted, skipped }`. Повтор безопасен.

Альтернативы: `navigator.sendBeacon` не отправляет `Content-Type: application/json` без preflight-ограничений и не даёт ответа — `fetch keepalive` проще и проверяем. Хранить удаление только в памяти — теряется при закрытии вкладки. Новый API Route нарушает правило «бэкенд — server actions», поэтому записан ADR 0003.

## Pockets

`PocketsSection`:

- выбранный карман = явно выбранный, если он есть и не временный; иначе первый активный не временный; иначе первый не временный;
- `CreatePocketForm.onCreated(pocket)` получает сохранённый карман, и секция выбирает его настоящий id;
- чип временного кармана `disabled`, `aria-disabled`, текст «<имя> · сохраняется…».

## Risks

- Операция над несохранённой записью ждёт без индикатора; при долгом создании пользователь видит результат раньше сервера — это решение владельца.
- `keepalive` ограничен 64 KB тела — 100 UUID укладываются.

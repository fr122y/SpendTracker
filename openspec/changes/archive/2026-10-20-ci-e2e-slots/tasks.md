# Tasks

## 1. Workflow

- [x] 1.1 Добавить job `slot` в `.github/workflows/e2e-preview.yml`.
- [x] 1.2 Перевести `e2e` на группу `e2e-preview-slot-<n>` с `queue: max`, передать credentials slot и падать на отсутствующих secrets.

## 2. Документация

- [x] 2.1 Обновить `docs/engineering/protected-operations.md` и `docs/engineering/agent-workflow.md`.

## 3. Проверка

- [x] 3.1 `npm run validate`, `npm run spec:check`.
- [x] 3.2 Pull Request: `e2e` выполнился в своём slot; владелец задаёт secrets slot 1 и 2 до слияния.

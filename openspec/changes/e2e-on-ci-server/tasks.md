# Tasks

## 1. Workflow

- [x] 1.1 Переименовать `e2e-preview.yml` в `e2e.yml`, перейти на `pull_request` и `workflow_dispatch`.
- [x] 1.2 Собрать и запустить сервер в runner с проверкой готовности; убрать Vercel bypass; требовать `CI_DATABASE_URL` и `CI_AUTH_SECRET`.

## 2. ci:wait

- [x] 2.1 Workflow `E2E`, состояние `waiting-run`; обновить тесты и fixtures.

## 3. Документация

- [x] 3.1 `agent-workflow.md`, `protected-operations.md`, `platform-settings.md`, `e2e/README.md`, ADR 0005.

## 4. Проверка

- [x] 4.1 `npm run validate`, `npm run spec:check`, разбор YAML.
- [ ] 4.2 Владелец одобряет secrets `CI_DATABASE_URL`, `CI_AUTH_SECRET`; они установлены; `e2e` зелёный на этом Pull Request; владелец сливает через обход ruleset.

# Tasks

## 1. Workflow проверки приложения

- [x] 1.1 Добавить `.github/workflows/verify.yml` с job `verify` (checkout, Node 22 с npm-кэшем, `npm ci`, typecheck, lint, unit-тесты отдельными шагами) и убедиться, что файл разбирается как корректный YAML и проходит `prettier --check`.
- [x] 1.2 Обновить формулировки о составе PR-проверок в `docs/engineering/agent-workflow.md` и в блоке `context` файла `openspec/config.yaml`; убедиться, что diff этих файлов ограничен этими формулировками и проходит `prettier --check`.

## 2. Проверка интеграции

- [x] 2.1 Выполнить `npm run spec:check` и убедиться, что изменение с `skip_specs: true` проходит строгую валидацию.
- [x] 2.2 Открыть Pull Request и убедиться, что проверки `commitlint` и `verify` завершились; зафиксировать в отчёте их результат и длительность шагов `verify`.

# Tasks

## 1. Правило

- [x] 1.1 Добавить раздел «Trailers» с полным примером сообщения коммита и предложение о проверке `change-trailer` в раздел «Enforcement» в `docs/engineering/change-request.md`; исправить раздел «Squash Commit Body».
- [x] 1.2 Добавить строку о трейлере в раздел «OpenSpec» и уточнить указатель на руководство в `AGENTS.md`; дополнить шаги реализации и архивации в `docs/engineering/agent-workflow.md`; добавить напоминание в раздел «References» шаблона `.github/pull_request_template.md`.

## 2. Проверка

- [x] 2.1 Добавить скрипт `.github/scripts/change-trailer.mjs` с чистыми экспортируемыми функциями: идентификатор изменения из пути, сбор затронутых изменений, разбор трейлеров, поиск изменений без трейлера.
- [x] 2.2 Добавить unit-тесты `.github/scripts/change-trailer.test.mjs` и убедиться, что `node --test` проходит для тестов всех трёх скриптов.
- [x] 2.3 Добавить job `change-trailer` в `.github/workflows/protected-paths.yml`, не меняя два существующих job, и убедиться, что workflow разбирается как корректный YAML и проходит `prettier --check`.

## 3. Проверка интеграции

- [x] 3.1 Запустить скрипт локально в режиме чтения на слитых Pull Request #41, #42, #44, #46, #49, #53 и на одном слитом Pull Request без папок OpenSpec; записать для каждого затронутые изменения, найденные трейлеры и вердикт.
- [x] 3.2 Выполнить `npm run spec:check` и убедиться, что изменение с `skip_specs: true` проходит строгую валидацию.
- [x] 3.3 Открыть Pull Request, запустить на нём скрипт локально и убедиться, что он проходит с идентификатором `add-change-trailer-check`, проверки `verify`, `commitlint` и `test-integrity` завершились успешно, `protected-paths` ожидаемо упала на изменённых файлах `.github/**`, а job `change-trailer` на нём ожидаемо не запускался.

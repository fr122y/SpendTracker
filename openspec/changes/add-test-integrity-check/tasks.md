# Tasks

## 1. Проверка целостности тестов

- [x] 1.1 Добавить скрипт `.github/scripts/test-integrity.mjs` с чистыми экспортируемыми функциями классификации путей, подсчёта маркеров и тест-кейсов и применения трёх правил.
- [x] 1.2 Добавить unit-тесты `.github/scripts/test-integrity.test.mjs` и убедиться, что `node --test` проходит для тестов обоих скриптов.
- [x] 1.3 Добавить job `test-integrity` в `.github/workflows/protected-paths.yml` (checkout базового коммита, Node 22, unit-тесты скрипта, запуск скрипта), ограничить шаг unit-тестов job `protected-paths` его собственным файлом и убедиться, что workflow разбирается как корректный YAML и проходит `prettier --check`.
- [x] 1.4 Дополнить раздел «Checks» в `docs/engineering/protected-operations.md` и раздел «Testing Rules» в `docs/engineering/agent-workflow.md`; убедиться, что diff ограничен этими абзацами и проходит `prettier --check`.

## 2. Проверка интеграции

- [x] 2.1 Запустить скрипт локально в режиме чтения на каждом слитом Pull Request из диапазона #15–#46 и разобрать каждое срабатывание по diff.
- [x] 2.2 Выполнить `npm run spec:check` и убедиться, что изменение с `skip_specs: true` проходит строгую валидацию.
- [ ] 2.3 Открыть Pull Request и убедиться, что проверки `commitlint` и `verify` завершились успешно, `protected-paths` ожидаемо упала на изменённых файлах `.github/**`, а job `test-integrity` на нём ожидаемо не запускался.

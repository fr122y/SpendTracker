# Tasks

## 1. Проверка защищённых путей

- [x] 1.1 Добавить список `.github/protected-paths.txt` и скрипт `.github/scripts/protected-paths.mjs` с чистыми экспортируемыми функциями сопоставления glob, учёта переименований и сравнения `package.json`.
- [x] 1.2 Добавить unit-тесты `.github/scripts/protected-paths.test.mjs` и убедиться, что `node --test .github/scripts/*.test.mjs` проходит.
- [x] 1.3 Добавить `.github/workflows/protected-paths.yml` с job `protected-paths` на `pull_request_target` (checkout базового коммита, Node 22, unit-тесты скрипта, запуск скрипта) и убедиться, что файл разбирается как корректный YAML и проходит `prettier --check`.
- [x] 1.4 Дополнить раздел «Checks» в `docs/engineering/protected-operations.md`; убедиться, что diff файла ограничен этим абзацем и проходит `prettier --check`.

## 2. Проверка интеграции

- [x] 2.1 Запустить скрипт локально в режиме чтения на Pull Request #44, #41, #38 и #29 и сверить результат с ожидаемым.
- [x] 2.2 Выполнить `npm run spec:check` и убедиться, что изменение с `skip_specs: true` проходит строгую валидацию.
- [x] 2.3 Открыть Pull Request и убедиться, что проверки `commitlint` и `verify` завершились успешно, а проверка `protected-paths` на нём ожидаемо не запускалась.

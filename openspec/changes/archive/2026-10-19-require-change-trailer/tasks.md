# Tasks

## 1. Правило на уровне коммита

- [x] 1.1 Добавить правило `scripts/commitlint/change-trailer-rule.cjs` и подключить его плагином в `commitlint.config.cjs`.
- [x] 1.2 Добавить unit-тесты `scripts/__tests__/commitlint-change-trailer.test.js`.
- [x] 1.3 Пропускать правило для заголовка Pull Request через `COMMITLINT_PR_TITLE=1` в `.github/workflows/conventional-commits.yml`; убедиться, что job проверяет каждый коммит Pull Request.
- [x] 1.4 Добавить `scripts/commitlint/**` в `.github/protected-paths.txt` и обновить тест списка.

## 2. Проверка на уровне Pull Request

- [x] 2.1 В `.github/scripts/change-trailer.mjs` отклонять несуществующие id, не засчитывать `Change: none` для затронутой папки, пропускать merge, revert, `fixup!`, `squash!` коммиты.
- [x] 2.2 Дополнить `.github/scripts/change-trailer.test.mjs`; `node --test .github/scripts/*.test.mjs` проходит.

## 3. Документация

- [x] 3.1 Обновить `AGENTS.md`, `docs/engineering/change-request.md`, `docs/engineering/agent-workflow.md`, `.github/pull_request_template.md`.

## 4. Проверка интеграции

- [x] 4.1 Прогнать правило по последним 60 коммитам `origin/main` и записать результат в описание Pull Request.
- [x] 4.2 Выполнить `npm run validate` и `npm run spec:check`.
- [x] 4.3 Открыть Pull Request: все проверки, кроме ожидаемо красной `protected-paths`, зелёные.

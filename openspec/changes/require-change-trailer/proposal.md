# Proposal

## Why

Trailer `Change: <change-id>` связывает коммит с proposal, design и tasks, которые объясняют код. Сейчас он обязателен только для коммитов OpenSpec change, а проверяется лишь на уровне Pull Request и только для тех change, чьи папки Pull Request затрагивает. Из последних 60 коммитов `main` 16 не несут ни одного `Change:`, в том числе 5 после ввода проверки `change-trailer` (#106, #93, #89, #88, #70): hotfix и follow-up коммиты, которые не трогают папку change, проходят незамеченными. Опечатка в id тоже проходит.

## What Changes

- Правило, утверждённое владельцем 2026-10-19: каждое сообщение коммита содержит ровно одну строку `Change: <id>`, где `<id>` — существующий change (`openspec/changes/<id>/` или `openspec/changes/archive/YYYY-MM-DD-<id>/`), либо `Change: none`. `none` разрешён только для типов `ci`, `build`, `chore`, `docs`, `test`, `style`; `feat`, `fix`, `refactor`, `perf` (и `revert(<scope>):`) называют change, который реализуют или исправляют. Merge, revert (`Revert "…"`), `fixup!` и `squash!` коммиты пропускаются через `defaultIgnores` commitlint, поэтому `git merge origin/main` продолжает работать.
- Локальное правило commitlint `change-trailer` в `scripts/commitlint/change-trailer-rule.cjs`, подключённое плагином в `commitlint.config.cjs`. Оно работает в хуке Husky `commit-msg` и в CI job `commitlint`, который уже проверяет каждый коммит Pull Request (`--from base --to head`). Для шага проверки заголовка Pull Request workflow выставляет `COMMITLINT_PR_TITLE=1`: заголовок не несёт trailer.
- Проверка `change-trailer` на уровне Pull Request дополнительно падает, если какой-либо коммит называет несуществующий id (сверка с базовым checkout и с папками change, которые добавляет сам Pull Request). `Change: none` не удовлетворяет требованию для затронутой папки change; требование точного id сохраняется. Коммиты теперь запрашиваются для каждого Pull Request, а не только для затрагивающих `openspec/changes/`.
- `scripts/commitlint/**` добавлен в `.github/protected-paths.txt`: правило — часть определения проверок.
- Документация: `AGENTS.md`, `docs/engineering/change-request.md` (Trailers, Enforcement, поиск коммитов change через `git log --grep '^Change: <id>$'`), `docs/engineering/agent-workflow.md`, `.github/pull_request_template.md`.

Вне рамок: переписывание истории `main`; проверка `Refs:` (реестр задач вне репозитория); проверка, что id соответствует содержанию коммита; изменение настроек ruleset.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Поведение приложения не меняется, поэтому изменение объявлено с `skip_specs: true`; спецификации процесса в `openspec/specs/` нет.

## Impact

CI и процесс: `commitlint.config.cjs`, `scripts/commitlint/`, `.github/scripts/change-trailer.mjs`, `.github/workflows/conventional-commits.yml`, `.github/protected-paths.txt` и тесты. Pull Request меняет защищённые пути, поэтому `protected-paths` на нём красный по замыслу; сливает владелец через обход ruleset. Новая логика `change-trailer` начнёт работать только после слияния: `pull_request_target` берёт скрипт из базовой ветки.

Риски: коммит без trailer теперь отклоняется локально — агенту и владельцу нужно добавлять `Change: none` к рутинным коммитам. Коммит, созданный до появления папки change в рабочем дереве, не пройдёт хук: сначала создаётся proposal.

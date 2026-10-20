# Proposal

## Why

Workflow E2E Preview держит одну глобальную группу concurrency `e2e-preview`: все Pull Request выполняют e2e по очереди под одним тестовым аккаунтом, а GitHub хранит в группе не больше одного pending run — новый run отменяет ожидающий run другого Pull Request, и его `e2e` приходится перезапускать. При нескольких параллельных Pull Request очередь становится узким местом.

## What Changes

- Схема, утверждённая владельцем 2026-10-20: три CI slot, у каждого свой тестовый аккаунт на development базе. Slot = номер Pull Request mod 3; без открытого Pull Request (например, `main`) — slot 0.
- Новый job `slot` находит Pull Request deployed commit через API и отдаёт `slot` и суффикс secrets; job `e2e` использует группу `e2e-preview-slot-<n>`, `cancel-in-progress: false`, `queue: max`.
- Secrets: slot 0 — `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`; slot 1 — `…_SLOT1`; slot 2 — `…_SLOT2`. В тесты они попадают как `E2E_USER_EMAIL` / `E2E_USER_PASSWORD`, specs не меняются. Отсутствующий secret slot останавливает run на шаге `Require e2e secrets` с его именем.
- Документация: `docs/engineering/protected-operations.md`, `docs/engineering/agent-workflow.md`.

Вне рамок: создание аккаунтов и установка secrets (владелец), изменение specs, `.github/e2e-specs.txt`, `playwright.config.ts`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Поведение приложения не меняется (`skip_specs: true`); спецификации процесса в `openspec/specs/` нет.

## Impact

`.github/workflows/e2e-preview.yml` — защищённый путь, поэтому `protected-paths` красный по замыслу; сливает владелец через обход ruleset после установки secrets slot 1 и 2. Workflow для `deployment_status` берётся из deployed commit, поэтому сам Pull Request уже проверяет новую схему.

Риски: Pull Request одного slot по-прежнему ждут друг друга; до установки secrets slot 1 и 2 их Pull Request падают на проверке secrets.

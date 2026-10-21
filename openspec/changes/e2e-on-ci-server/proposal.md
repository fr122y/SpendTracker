# Proposal

## Why

Check `e2e` гонял Playwright против Vercel Preview каждого Pull Request. На Vercel Hobby все деплойменты делят месячную квоту Fluid Active CPU (4 h); на 2026-10-21 израсходовано 3 h 3 min (76%), 748K invocations, около 95% — e2e и тестовые всплески. Превышение ставит функции на паузу до 30 дней, то есть останавливает production.

## What Changes

- `.github/workflows/e2e-preview.yml` → `.github/workflows/e2e.yml` (workflow `E2E`, job `e2e` — имя required check не меняется). Триггер `pull_request` (opened, synchronize, reopened) и `workflow_dispatch` (inputs `ref`, `slot`, `spec`, `repeat_each`) для proof runs.
- Job собирает head commit (`next build`), поднимает `next start` на `localhost:3000` в runner, ждёт `/login` 200 (90 s) и запускает specs с `PLAYWRIGHT_BASE_URL=http://localhost:3000`. Vercel bypass header больше не используется.
- Slots, группа concurrency (теперь `e2e-slot-<n>`), skip устаревшего commit, «Fail on skipped tests», artifacts сохраняются.
- Новые secrets: `CI_DATABASE_URL` (development база), `CI_AUTH_SECRET` (случайное значение только для CI). Отсутствующий secret останавливает run на `Require e2e secrets`.
- `npm run ci:wait`: workflow `E2E`, состояние `waiting-deploy` → `waiting-run`.
- Документация: `docs/engineering/{agent-workflow,protected-operations,platform-settings}.md`, `e2e/README.md`, ADR 0005.

Вне рамок: установка secrets (владелец), изменение specs, `.github/e2e-specs.txt`, `playwright.config.ts`, удаление secret `VERCEL_AUTOMATION_BYPASS_SECRET`.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Поведение приложения не меняется (`skip_specs: true`); спецификации процесса в `openspec/specs/` нет.

## Impact

`.github/workflows/` — защищённый путь: `protected-paths` красный по замыслу, сливает владелец через обход ruleset после установки secrets. До установки secrets новый `e2e` падает на `Require e2e secrets`.

Риски: тестируется production build, но не Vercel runtime (регион, размещение middleware); такие регрессии ловит ручная проверка Preview. Run длиннее на 3–5 min (install и `next build`).

# Proposal

## Why

Playwright-тесты запускаются только вручную, поэтому изменение, которое ломает реальный пользовательский сценарий на развёрнутом приложении, может попасть в `main`, а слияние в `main` сразу выкатывается в production. Unit-тесты в job `verify` не проверяют приложение целиком: вход, Server Actions, базу данных и сборку Vercel.

## What Changes

- Добавить workflow `.github/workflows/e2e-preview.yml` с job `e2e`. Он запускается на событии `deployment_status`, которое Vercel создаёт для каждого деплоя, и проверяет успешный деплой окружения `Preview` коммита. Проверка привязана к этому коммиту, для Pull Request — к его head-коммиту.
- Перед запуском job проверяет, что окружение — `Preview`, а URL — `https://*.vercel.app`; иначе падает. Деплои `Production` в job не попадают.
- Базовый URL берётся из `environment_url` события. `playwright.config.ts` читает `PLAYWRIGHT_BASE_URL`, при нём не запускает локальный `webServer` и передаёт заголовки обхода Deployment Protection (`x-vercel-protection-bypass`, `x-vercel-set-bypass-cookie`) из `VERCEL_AUTOMATION_BYPASS_SECRET`.
- Проверяются только spec-файлы из нового защищённого списка `.github/e2e-specs.txt`; сначала это `e2e/pockets.spec.ts`. Job падает, если в списке нет файлов или указанный файл отсутствует, если не задан любой из секретов `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET`, и если хотя бы один тест пропущен.
- Одна общая группа `concurrency` без отмены выполняющихся запусков: тесты пишут в development-базу под одним тестовым аккаунтом. Запуск для коммита, который уже не является head своего Pull Request, завершается без тестов.
- Только Chromium, кэш браузера, отчёт Playwright как artifact при падении, таймаут 15 минут, права `contents: read` и `pull-requests: read`.
- Исправить сценарий «should record a purchase from the journal form» в `e2e/pockets.spec.ts`: тест удалял покупку, пока она была только оптимистичной записью с временным id, поэтому удаление не доходило до сервера и оставляло +300 ₽ для следующего шага.
- Описать проверку `e2e` в `docs/engineering/protected-operations.md`.

Критерии приёмки: `e2e/pockets.spec.ts` проходит против Preview-деплоя без пропусков; на Pull Request этого изменения все проверки, кроме `protected-paths`, зелёные.

Вне рамок: восстановление остальных девяти spec-файлов (задача T-033), добавление секретов и обязательной проверки в ruleset `Protect main` (действия владельца), изменение кода приложения.

Зависимости: секреты репозитория `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET`; интеграция Vercel с GitHub Deployments.

Риски:

- Workflow и тесты берутся из деплоимого коммита, а не из основной ветки, и job получает e2e-секреты. Код Pull Request выполняется с этими секретами, поэтому в них только bypass-секрет Preview и одноразовый тестовый аккаунт development-базы; production-учётные данные сюда не добавляются.
- GitHub держит не больше одного ожидающего запуска в группе `concurrency`: третий запуск отменяет ожидающий запуск другого Pull Request, и его `e2e` придётся перезапустить.
- Сценарий пишет в development-базу: каждый успешный прогон оставляет один архивный карман, а упавший прогон — неархивированный карман с операциями.
- До добавления секретов job падает на шаге проверки секретов.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. Наблюдаемое поведение приложения не меняется, поэтому изменение объявлено с `skip_specs: true` без spec delta.

## Impact

CI-конфигурация (`.github/workflows/e2e-preview.yml`, `.github/e2e-specs.txt`), защищённый `playwright.config.ts`, тест `e2e/pockets.spec.ts` и одно предложение в документации. Код приложения, схема базы данных и зависимости не меняются.

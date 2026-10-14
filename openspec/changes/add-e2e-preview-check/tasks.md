# Tasks

## 1. Запуск e2e против Preview

- [x] 1.1 В `playwright.config.ts` брать `baseURL` из `PLAYWRIGHT_BASE_URL`, не запускать `webServer` для удалённого URL и передавать заголовки обхода Vercel из `VERCEL_AUTOMATION_BYPASS_SECRET`.
- [x] 1.2 Добавить `.github/e2e-specs.txt` со списком проверяемых spec-файлов (`e2e/pockets.spec.ts`).
- [x] 1.3 Добавить `.github/workflows/e2e-preview.yml` с job `e2e`: триггер `deployment_status`, проверка окружения `Preview`, проверка секретов и списка spec-файлов, общая группа `concurrency`, пропуск устаревшего head, только Chromium, падение при пропущенных тестах, отчёт при падении.
- [x] 1.4 Исправить в `e2e/pockets.spec.ts` удаление покупки из журнала до её сохранения на сервере, не удаляя и не ослабляя проверки.
- [x] 1.5 Описать проверку `e2e` и список `.github/e2e-specs.txt` в `docs/engineering/protected-operations.md`.

## 2. Проверка

- [x] 2.1 Прогнать `e2e/pockets.spec.ts` локально против существующего Preview-деплоя (окружение `Preview` проверено) без пропусков.
- [x] 2.2 Выполнить `npm run validate` и `npm run spec:check`.
- [x] 2.3 Открыть Pull Request и зафиксировать результаты проверок; `protected-paths` падает по замыслу.

## 3. Действия владельца

- [ ] 3.1 Владелец: добавить секреты репозитория `E2E_USER_EMAIL`, `E2E_USER_PASSWORD`, `VERCEL_AUTOMATION_BYPASS_SECRET`.
- [ ] 3.2 Владелец: понаблюдать за первыми запусками `e2e` на Pull Request.
- [ ] 3.3 Владелец: добавить `e2e` в обязательные проверки ruleset `Protect main`.

## Дальнейшая работа

Остальные девять spec-файлов из `e2e/` восстанавливаются задачей T-033 и добавляются в `.github/e2e-specs.txt` по одному, каждый отдельным Pull Request с обходом владельца.

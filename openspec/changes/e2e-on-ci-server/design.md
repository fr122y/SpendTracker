# Design

## Триггер и проверяемый commit

`pull_request` даёт `GITHUB_SHA` merge commit; checkout берёт `github.event.pull_request.head.sha`, как раньше тестировался deployed head commit. Check run `e2e` создаётся job `e2e` в любом событии, поэтому ruleset «Protect main» продолжает совпадать. Для `workflow_dispatch` проверяется `inputs.ref`; ручной запуск доступен, только когда файл workflow есть на `main`.

Шаг `Skip a superseded commit` сравнивает head commit события с текущим `pulls/<n>.head.sha` и для устаревшего commit выходит рано.

## Slot

Номер Pull Request теперь есть в событии: slot = `pull_request.number mod 3` без API. Для `workflow_dispatch` — input `slot` (0–2). Группа concurrency `e2e-slot-<n>`, `cancel-in-progress: false`, `queue: max`.

## Сервер

`next build`, затем `node_modules/.bin/next start --port 3000` в фоне с логом в `$RUNNER_TEMP`. Готовность: цикл `curl` на `/login` до 200, 90 попыток по секунде; если процесс вышел или время истекло — ошибка и последние 50 строк лога. При падении job лог печатается ещё раз; в artifacts он не попадает. `PLAYWRIGHT_BASE_URL=http://localhost:3000` отключает `webServer` в `playwright.config.ts`; без `VERCEL_AUTOMATION_BYPASS_SECRET` конфиг не добавляет bypass headers, fixture блокировки vercel.live ничего не делает.

## Переменные окружения сервера

Из кода (`process.env` в `src/`, Auth.js v5):

| Переменная        | Источник                          | Почему                                                                                                      |
| ----------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`    | secret `CI_DATABASE_URL`          | `src/shared/db/client.ts`                                                                                   |
| `AUTH_SECRET`     | secret `CI_AUTH_SECRET`           | Auth.js в production требует secret                                                                         |
| `AUTH_TRUST_HOST` | константа `true`                  | вне Vercel Auth.js иначе отклоняет host                                                                     |
| `AUTH_URL`        | константа `http://localhost:3000` | origin callback URL                                                                                         |
| `APP_ORIGIN`      | константа `http://localhost:3000` | `getAppOrigin` в `auth-actions.ts` и `shared-budget-invite-actions.ts` бросают ошибку в production без него |

Не задаются: `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (specs входят по email/password), `RESEND_API_KEY` и `ACCOUNT_EMAIL_*` (в production `sendAccountEmail` без ключа бросает `configuration_error`; outbox обрабатывается в `after()` с перехватом ошибки, gated specs писем не отправляют), `CRON_SECRET`, `RESEND_WEBHOOK_SECRET` (routes не вызываются).

## Безопасность

`pull_request`, не `pull_request_target`: Pull Request из fork не получает secrets. Secrets передаются только в шаги, которым нужны, и не печатаются.

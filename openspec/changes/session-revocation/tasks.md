# Tasks

## 1. Тесты

- [x] 1.1 Unit: `jwt` callback — выдача `sid`, отозванный `sid` и устаревшая `sv` → `null`, окно 5 минут, немедленная сверка в режиме `force`, старый токен без `sid`, сбой базы.
- [x] 1.2 Unit: выход записывает `sid`; смена пароля увеличивает версию и сохраняет текущую сессию; сброс пароля увеличивает версию; /login перенаправляет только действующую сессию.
- [x] 1.3 E2E `e2e/session-revocation.spec.ts`: cookie до выхода не открывает /account; смена пароля завершает другую сессию и сохраняет текущую, пароль возвращается.

## 2. Реализация

- [x] 2.1 Миграция `0019_session_revocation.sql` и схема Drizzle.
- [x] 2.2 `session-revocation.ts`, `session-store.ts`, `jwt` callback и `events.signOut`.
- [x] 2.3 `authFresh` на /account, в смене пароля и на /login; перенаправление с /login из middleware на страницу.
- [x] 2.4 Версия сессий при смене и сбросе пароля.
- [x] 2.6 Немедленная сверка на загрузке `/` и в зонде `/api/auth/session`; кэш отказов на инстансе.
- [x] 2.5 ADR 0004, README `shared/auth`.

## 3. Проверка

- [x] 3.1 `npm run spec:check` и `npm run validate`.
- [x] 3.2 Миграция на dev-базе, e2e против Preview.

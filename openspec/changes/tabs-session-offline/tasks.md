# Tasks

## 1. Тесты

- [x] 1.1 Unit: параметры query client, refetch на фокус и reconnect, пропуск при незавершённой мутации, пауза мутации офлайн.
- [x] 1.2 Unit: обработчик истёкшей сессии (URL входа, одна переадресация, toast), сохранение и восстановление черновиков.
- [x] 1.3 Unit: `NetworkStatus`, условия `beforeunload`, `AppFreshnessController`, `getLoginPath`, баннер на `/login`, `/account`.
- [x] 1.4 E2E `e2e/tabs-session-offline.spec.ts`: вторая вкладка, выход в другой вкладке, офлайн-сохранение.

## 2. Реализация

- [x] 2.1 `createQueryClient`: `staleTime` 30 с, refetch на фокус и reconnect без незавершённых мутаций, обработка ошибок запросов.
- [x] 2.2 `session-expiry`, `showMutationRollbackToast` через проверку сессии, middleware 401 и `callbackUrl`, `/account`, баннер на `/login`.
- [x] 2.3 Черновики: поля ввода, удержание отправленного черновика, `sessionStorage` при истёкшей сессии.
- [x] 2.4 `NetworkStatus`, `UnsavedChangesGuard`, `AppFreshnessController` только для смены дня и долгой паузы.

## 3. Проверка

- [x] 3.1 `npm run spec:check` и `npm run validate`.
- [x] 3.2 E2E против Preview и ручная проверка офлайн-сохранения после перезагрузки.

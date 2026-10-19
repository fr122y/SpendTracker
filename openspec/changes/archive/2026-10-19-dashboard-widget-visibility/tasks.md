# Tasks

## 1. Тесты

- [x] 1.1 Юнит-тесты разбора, очистки и обратной совместимости `hidden`; скрытие, возврат, сброс; запрет скрыть последний виджет; серверная проверка `hidden`.
- [x] 1.2 Тесты стора раскладки и UI: кнопка скрытия, панель «Скрытые виджеты», подтверждение сброса.

## 2. Реализация

- [x] 2.1 `LayoutConfig.hidden`, нормализация и функции `hideWidget`/`showWidget`/`resetLayout` в `shared/lib/layout-config.ts`.
- [x] 2.2 Проверка `hidden` в `updateLayoutConfig`.
- [x] 2.3 Действия стора `layout-editor`; сохранение `hidden` в существующих мутациях.
- [x] 2.4 Кнопка «Скрыть виджет» и панель `LayoutVisibilityPanel` в `dashboard-grid`.

## 3. Проверка

- [x] 3.1 Выполнить `npm run spec:check` и `npm run validate`.
- [x] 3.2 Проверить скрытие, возврат и сброс вручную на Preview Pull Request.

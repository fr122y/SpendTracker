# Tasks

## 1. Тесты

- [x] 1.1 Добавить в `src/features/manage-pockets/__tests__/PocketOperationForm.test.tsx` тест: в форме нет поля «Дата», операция сохраняется на выбранную дату dashboard, в том числе после её смены при открытой форме.
- [x] 1.2 Обновить в `src/widgets/pockets/__tests__/pockets-section.test.tsx` тест добавления покупки и перевода: поля «Дата» нет, обе операции сохраняются на общую выбранную дату.
- [x] 1.3 Обновить шаг в `e2e/pockets.spec.ts`: форма покупки не содержит поля «Дата».

## 2. Реализация

- [x] 2.1 Убрать поле и состояние даты из `PocketOperationForm`; передавать в мутацию `formatDate(selectedDate)`.
- [x] 2.2 Обновить `src/features/manage-pockets/README.md`.

## 3. Проверка

- [x] 3.1 Выполнить `npm run spec:check` и `npm run validate`.
- [ ] 3.2 Вручную проверить в Preview: в формах «Добавить покупку» и «Перевести в расходы» нет поля даты, операция появляется в истории с выбранной датой dashboard.

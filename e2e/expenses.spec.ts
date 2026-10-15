import {
  dailyTotal,
  expect,
  expenseRow,
  expenseRows,
  journalForm,
  openJournal,
  reloadPage,
  test,
  TIMEOUT,
} from './utils/expenses'

test.describe('Expense Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(dailyTotal(page)).toBeVisible(TIMEOUT)
  })

  test.describe('Add Expense', () => {
    test('should add expense with description and amount', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E молоко')

      const row = expenseRow(page, expense.description, expense.amount)
      await expect(
        row.getByText(expense.description, { exact: true })
      ).toBeVisible()
      await expect(row.getByRole('button', { name: 'edit amount' })).toHaveText(
        `${expense.amount} ₽`
      )

      await expenses.remove(expense)
    })

    test('should assign a category to the expense', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E молоко')

      // The category comes from a saved keyword mapping or the manual pick.
      expect(expense.category.length).toBeGreaterThan(0)
      await expect(
        expenseRow(page, expense.description, expense.amount).getByText(
          expense.category,
          { exact: true }
        )
      ).toBeVisible()

      await expenses.remove(expense)
    })
  })

  test.describe('Double Submit', () => {
    test('should save one expense for a rapid triple click', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E тройной клик', {
        clickCount: 3,
      })

      // Server state, not the optimistic list: reload before counting.
      await reloadPage(page)
      await openJournal(page)
      await expect(
        expenseRow(page, expense.description, expense.amount)
      ).toBeVisible(TIMEOUT)
      await expect(
        expenseRows(page, expense.description, expense.amount)
      ).toHaveCount(1)

      await expenses.remove(expense)
    })
  })

  test.describe('Delete Expense', () => {
    test('should delete expense and verify disappearance', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E расход для удаления')

      // Deletes through the row's dialog and confirms it after a reload.
      await expenses.remove(expense)
      await expect(
        expenseRows(page, expense.description, expense.amount)
      ).toHaveCount(0)
    })

    test('should delete specific expense when multiple exist', async ({
      page,
      expenses,
    }) => {
      // Two adds and two deletes, each with reloads, exceed the default 30 s.
      test.slow()
      const first = await expenses.add('E2E первый расход')
      const second = await expenses.add('E2E второй расход')

      await expenses.remove(first)

      await expect(
        expenseRows(page, first.description, first.amount)
      ).toHaveCount(0)
      await expect(
        expenseRow(page, second.description, second.amount)
      ).toBeVisible()

      await expenses.remove(second)
    })
  })

  test.describe('Project Operations', () => {
    // Read-only: the journal form is filled but never submitted, so the shared
    // account keeps its data. The branch depends on whether it has projects.
    test('should not offer a dead end or a return above cash on hand', async ({
      page,
    }) => {
      await openJournal(page)
      const form = journalForm(page)
      const scenario = form.getByLabel('Сценарий операции')
      const hasProjects =
        (await scenario
          .locator('option', { hasText: 'Вернул в проект' })
          .count()) > 0

      if (!hasProjects) {
        await expect(
          form.getByText(/Проектные операции появятся после создания проекта/)
        ).toBeVisible()
        return
      }

      await scenario.selectOption('project_return')
      const project = form.getByLabel('Проект', { exact: true })
      const firstProject = await project
        .locator('option:not([value=""])')
        .first()
        .getAttribute('value')
      await project.selectOption(firstProject!)
      await form.getByLabel('Описание расхода').fill('E2E возврат сверх')
      await form.getByLabel('Сумма расхода').fill('999999999')

      await expect(form.getByRole('alert')).toContainText(
        'Нельзя вернуть больше, чем на руках'
      )
      await expect(
        form.getByRole('button', { name: 'Добавить' })
      ).toBeDisabled()
    })
  })
})

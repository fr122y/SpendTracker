import {
  dailyTotal,
  expect,
  expenseRow,
  expenseRows,
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
})

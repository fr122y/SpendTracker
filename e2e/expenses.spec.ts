import { test, expect } from '@playwright/test'

test.describe('Expense Flow', () => {
  // Clean state before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.describe('Add Expense', () => {
    test('should add expense with description and amount', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Fill form with test data
      await descriptionInput.fill('Milk')
      await amountInput.fill('100')

      // Submit the form
      await submitButton.click()

      // Verify expense appears in the list
      await expect(page.getByText('Milk')).toBeVisible({ timeout: 10000 })

      // Verify amount is displayed (use the specific expense card format)
      await expect(page.getByText('100 ₽').first()).toBeVisible()
    })

    test('should assign a category to the expense', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Add expense
      await descriptionInput.fill('Milk')
      await amountInput.fill('100')
      await submitButton.click()

      // Wait for expense to appear
      await expect(page.getByText('Milk')).toBeVisible({ timeout: 10000 })

      // Verify some category is assigned (AI or fallback "Другое")
      // The expense card shows category below the description
      const expenseCard = page.locator('.text-xs.text-zinc-500').first()
      await expect(expenseCard).toBeVisible()
      const categoryText = await expenseCard.textContent()
      expect(categoryText).toBeTruthy()
      expect(categoryText!.length).toBeGreaterThan(0)
    })
  })

  test.describe('Delete Expense', () => {
    test('should delete expense and verify disappearance', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Create an expense first
      await descriptionInput.fill('Test expense to delete')
      await amountInput.fill('250')
      await submitButton.click()

      // Verify expense is visible
      await expect(page.getByText('Test expense to delete')).toBeVisible({
        timeout: 10000,
      })

      // Click delete button (first one since only one expense)
      const deleteButton = page.getByRole('button', { name: 'delete' }).first()
      await deleteButton.click()

      // Verify expense is removed
      await expect(page.getByText('Test expense to delete')).not.toBeVisible()
    })

    test('should delete specific expense when multiple exist', async ({
      page,
    }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Add first expense
      await descriptionInput.fill('First expense')
      await amountInput.fill('100')
      await submitButton.click()
      await expect(page.getByText('First expense')).toBeVisible({
        timeout: 10000,
      })

      // Add second expense
      await descriptionInput.fill('Second expense')
      await amountInput.fill('200')
      await submitButton.click()
      await expect(page.getByText('Second expense')).toBeVisible({
        timeout: 10000,
      })

      // Verify we have 2 delete buttons
      await expect(page.getByRole('button', { name: 'delete' })).toHaveCount(2)

      // Delete the first expense in the list
      await page.getByRole('button', { name: 'delete' }).first().click()

      // Verify only 1 expense remains
      await expect(page.getByRole('button', { name: 'delete' })).toHaveCount(1)

      // Verify at least one expense still exists
      const remainingExpenses = await page
        .locator('.text-sm.font-medium.text-zinc-100')
        .count()
      expect(remainingExpenses).toBe(1)
    })
  })
})

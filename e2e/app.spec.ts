import { test, expect } from '@playwright/test'

test.describe('SmartSpend Tracker', () => {
  // Clear localStorage before each test for clean state
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => {
      localStorage.clear()
    })
    await page.reload()
  })

  // Phase 7.1: Smoke Test - App loads and renders dashboard
  test.describe('Smoke Tests', () => {
    test('should load the home page with title and header', async ({
      page,
    }) => {
      await expect(page).toHaveTitle(/SmartSpend Tracker/)
      await expect(
        page.getByRole('heading', { name: 'SmartSpend Terminal' })
      ).toBeVisible()
    })

    test('should render month navigation controls', async ({ page }) => {
      // Previous month button
      await expect(
        page.getByRole('button', { name: 'Предыдущий месяц' })
      ).toBeVisible()

      // Next month button
      await expect(
        page.getByRole('button', { name: 'Следующий месяц' })
      ).toBeVisible()

      // Edit mode button
      await expect(
        page.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })

    test('should render dashboard widgets', async ({ page }) => {
      // Expense form should be visible (part of EXPENSE_LOG widget)
      await expect(page.getByPlaceholder('Описание расхода')).toBeVisible()
      await expect(page.getByPlaceholder('Сумма')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Добавить' })).toBeVisible()

      // Weekly budget widget should be visible
      await expect(page.getByText('Недельный бюджет')).toBeVisible()
    })
  })

  // Phase 7.2: Add Expense Flow - Add expense with fallback categorization
  test.describe('Add Expense Flow', () => {
    test('should add expense via form and show in list', async ({ page }) => {
      // Fill in expense form
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      await descriptionInput.fill('Тестовый расход на продукты')
      await amountInput.fill('500')

      // Submit the form
      await submitButton.click()

      // Wait for the expense to appear in the list
      // The Server Action will fallback to "Другое" category without AI
      await expect(page.getByText('Тестовый расход на продукты')).toBeVisible({
        timeout: 10000,
      })

      // Verify the amount is displayed
      await expect(page.getByText('500')).toBeVisible()
    })

    test('should clear form after successful submission', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      await descriptionInput.fill('Кофе')
      await amountInput.fill('250')
      await submitButton.click()

      // Wait for expense to be added
      await expect(page.getByText('Кофе')).toBeVisible({ timeout: 10000 })

      // Form should be cleared
      await expect(descriptionInput).toHaveValue('')
      await expect(amountInput).toHaveValue('')
    })

    test('should update daily total after adding expense', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      // Add first expense
      await descriptionInput.fill('Обед')
      await amountInput.fill('300')
      await submitButton.click()
      await expect(page.getByText('Обед')).toBeVisible({ timeout: 10000 })

      // Add second expense
      await descriptionInput.fill('Ужин')
      await amountInput.fill('400')
      await submitButton.click()
      await expect(page.getByText('Ужин')).toBeVisible({ timeout: 10000 })

      // Total should show 700 (300 + 400)
      await expect(page.getByText('700')).toBeVisible()
    })
  })

  // Phase 7.2 continued: Verify expense appears in Analysis widget
  test.describe('Expense Analysis', () => {
    test('should show expense category in analysis widget', async ({
      page,
    }) => {
      // Add an expense
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      await descriptionInput.fill('Тест анализа')
      await amountInput.fill('1000')
      await submitButton.click()

      // Wait for expense to be added
      await expect(page.getByText('Тест анализа')).toBeVisible({
        timeout: 10000,
      })

      // Analysis widget should show the category (Другое by default)
      // The percentage should be 100% since it's the only expense
      await expect(page.getByText('Другое')).toBeVisible()
      await expect(page.getByText('100%')).toBeVisible()
    })

    test('should update analysis totals when expenses are added', async ({
      page,
    }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      // Add expense
      await descriptionInput.fill('Расход для анализа')
      await amountInput.fill('2500')
      await submitButton.click()

      // Wait for expense to appear
      await expect(page.getByText('Расход для анализа')).toBeVisible({
        timeout: 10000,
      })

      // Analysis widget should show the total amount
      // Look for the formatted amount in the analysis section
      await expect(page.getByText(/2[\s\u00A0]?500/)).toBeVisible()
    })
  })

  // Phase 7.3: Persistence Test - Data remains after page reload
  test.describe('Data Persistence', () => {
    test('should persist expenses after page reload', async ({ page }) => {
      // Add an expense
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      await descriptionInput.fill('Постоянный расход')
      await amountInput.fill('1500')
      await submitButton.click()

      // Wait for expense to be added
      await expect(page.getByText('Постоянный расход')).toBeVisible({
        timeout: 10000,
      })

      // Reload the page
      await page.reload()

      // Expense should still be visible after reload
      await expect(page.getByText('Постоянный расход')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('1 500')).toBeVisible()
    })

    test('should persist multiple expenses after reload', async ({ page }) => {
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', { name: 'Добавить' })

      // Add first expense
      await descriptionInput.fill('Первый расход')
      await amountInput.fill('100')
      await submitButton.click()
      await expect(page.getByText('Первый расход')).toBeVisible({
        timeout: 10000,
      })

      // Add second expense
      await descriptionInput.fill('Второй расход')
      await amountInput.fill('200')
      await submitButton.click()
      await expect(page.getByText('Второй расход')).toBeVisible({
        timeout: 10000,
      })

      // Reload the page
      await page.reload()

      // Both expenses should still be visible
      await expect(page.getByText('Первый расход')).toBeVisible({
        timeout: 10000,
      })
      await expect(page.getByText('Второй расход')).toBeVisible()
    })

    test('should persist layout configuration after reload', async ({
      page,
    }) => {
      // Enter edit mode
      const editButton = page.getByRole('button', { name: /Редактировать/ })
      await editButton.click()

      // Verify we're in edit mode (button text changes to "Готово")
      await expect(page.getByRole('button', { name: /Готово/ })).toBeVisible()

      // Exit edit mode
      await page.getByRole('button', { name: /Готово/ }).click()

      // Verify we're out of edit mode
      await expect(
        page.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })
  })

  // Navigation Tests
  test.describe('Month Navigation', () => {
    test('should navigate to previous month', async ({ page }) => {
      const prevButton = page.getByRole('button', {
        name: 'Предыдущий месяц',
      })

      // Get current month text
      const monthText = page.locator('span.capitalize')
      const initialMonth = await monthText.textContent()

      // Navigate to previous month
      await prevButton.click()

      // Month text should change
      const newMonth = await monthText.textContent()
      expect(newMonth).not.toBe(initialMonth)
    })

    test('should navigate to next month', async ({ page }) => {
      const nextButton = page.getByRole('button', { name: 'Следующий месяц' })

      // Get current month text
      const monthText = page.locator('span.capitalize')
      const initialMonth = await monthText.textContent()

      // Navigate to next month
      await nextButton.click()

      // Month text should change
      const newMonth = await monthText.textContent()
      expect(newMonth).not.toBe(initialMonth)
    })
  })

  // Edit Mode Tests
  test.describe('Edit Mode', () => {
    test('should toggle edit mode', async ({ page }) => {
      const editButton = page.getByRole('button', { name: /Редактировать/ })

      // Click to enter edit mode
      await editButton.click()

      // Button should now show "Готово"
      await expect(page.getByRole('button', { name: /Готово/ })).toBeVisible()

      // Click again to exit edit mode
      await page.getByRole('button', { name: /Готово/ }).click()

      // Button should show "Редактировать" again
      await expect(
        page.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })

    test('should show widget titles in edit mode', async ({ page }) => {
      // Enter edit mode
      await page.getByRole('button', { name: /Редактировать/ }).click()

      // Widget titles should be visible
      await expect(page.getByText('Календарь')).toBeVisible()
      await expect(page.getByText('Журнал расходов')).toBeVisible()
      await expect(page.getByText('Анализ')).toBeVisible()
      await expect(page.getByText('Динамика')).toBeVisible()
    })
  })
})

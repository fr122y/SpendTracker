import { test, expect } from '@playwright/test'

test.describe('Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should display critical widgets', async ({ page }) => {
    const header = page.getByRole('banner')

    // Enter edit mode to see widget titles
    await header.getByRole('button', { name: /Редактировать/ }).click()

    // Verify critical widgets are visible (use exact match for titles)
    await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Журнал расходов', { exact: true })
    ).toBeVisible()
    await expect(page.getByText('Анализ', { exact: true })).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()
  })

  test('should display current month in header', async ({ page }) => {
    const monthText = page.locator('span.capitalize')

    // Get current month in Russian locale
    const now = new Date()
    const expectedMonth = now
      .toLocaleDateString('ru-RU', {
        month: 'long',
        year: 'numeric',
      })
      .toLowerCase()

    // Verify month is displayed
    await expect(monthText).toContainText(expectedMonth)
  })

  test('should render header with title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'SmartSpend Terminal' })
    ).toBeVisible()
  })

  test('should render month navigation controls', async ({ page }) => {
    const header = page.getByRole('banner')

    await expect(
      header.getByRole('button', { name: 'Предыдущий месяц' })
    ).toBeVisible()
    await expect(
      header.getByRole('button', { name: 'Следующий месяц' })
    ).toBeVisible()
  })
})

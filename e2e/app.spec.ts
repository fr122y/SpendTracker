import { test, expect } from '@playwright/test'

test.describe('SmartSpend Tracker', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/SmartSpend Tracker/)
    await expect(
      page.getByRole('heading', { name: 'SmartSpend Tracker' })
    ).toBeVisible()
  })
})

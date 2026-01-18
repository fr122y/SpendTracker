import { test, expect } from '@playwright/test'

test.describe('Layout Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('should toggle edit mode', async ({ page }) => {
    const header = page.getByRole('banner')
    const editButton = header.getByRole('button', { name: /Редактировать/ })

    // Enter edit mode
    await editButton.click()

    // Verify button changes to "Готово"
    await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()

    // Verify button changes back to "Редактировать"
    await expect(
      header.getByRole('button', { name: /Редактировать/ })
    ).toBeVisible()
  })

  test('should show visual cues in edit mode', async ({ page }) => {
    const header = page.getByRole('banner')

    // Enter edit mode
    await header.getByRole('button', { name: /Редактировать/ }).click()

    // Verify widgets have edit mode styling (ring border)
    const widgetContainer = page.locator('.ring-1.ring-zinc-700').first()
    await expect(widgetContainer).toBeVisible()

    // Verify widget content has reduced opacity
    const widgetContent = page
      .locator('.pointer-events-none.opacity-60')
      .first()
    await expect(widgetContent).toBeVisible()

    // Verify widget titles are visible in edit mode
    await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
  })

  test('should hide visual cues when exiting edit mode', async ({ page }) => {
    const header = page.getByRole('banner')

    // Enter edit mode
    await header.getByRole('button', { name: /Редактировать/ }).click()
    await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()

    // Verify edit mode styling is removed
    const editModeWidgets = page.locator('.ring-1.ring-zinc-700')
    await expect(editModeWidgets).toHaveCount(0)

    // Verify reduced opacity is removed
    const reducedOpacity = page.locator('.pointer-events-none.opacity-60')
    await expect(reducedOpacity).toHaveCount(0)
  })

  test('should maintain normal state after toggle and reload', async ({
    page,
  }) => {
    const header = page.getByRole('banner')

    // Enter edit mode
    await header.getByRole('button', { name: /Редактировать/ }).click()
    await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()
    await expect(
      header.getByRole('button', { name: /Редактировать/ })
    ).toBeVisible()

    // Reload page
    await page.reload()

    // Verify we're not in edit mode after reload
    await expect(
      header.getByRole('button', { name: /Редактировать/ })
    ).toBeVisible()

    // Verify no edit mode styling
    const editModeWidgets = page.locator('.ring-1.ring-zinc-700')
    await expect(editModeWidgets).toHaveCount(0)
  })

  test('should persist layout configuration after reload', async ({ page }) => {
    const header = page.getByRole('banner')

    // Verify default widgets are present
    await header.getByRole('button', { name: /Редактировать/ }).click()
    await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Журнал расходов', { exact: true })
    ).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()

    // Reload page
    await page.reload()

    // Verify widgets are still present
    await header.getByRole('button', { name: /Редактировать/ }).click()
    await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Журнал расходов', { exact: true })
    ).toBeVisible()
  })
})

import {
  expect,
  expenseRow,
  journalForm,
  reloadPage,
  test,
  TIMEOUT,
} from './utils/expenses'
import {
  expectVisibleColumns,
  expectNoHorizontalScroll,
} from './utils/viewport-helpers'

test.describe('Viewport Resize Adaptation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
  })

  test('should adapt from mobile to tablet layout', async ({ page }) => {
    // Start on mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // Verify mobile layout (1 column)
    await expectVisibleColumns(page, 1)
    await expectNoHorizontalScroll(page)

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 })

    // Wait for resize to take effect
    await page.waitForTimeout(200)

    // Verify tablet layout (2 columns)
    await expectVisibleColumns(page, 2)
    await expectNoHorizontalScroll(page)
  })

  test('should adapt from tablet to desktop layout', async ({ page }) => {
    // Start on tablet
    await page.setViewportSize({ width: 768, height: 1024 })

    // Verify tablet layout (2 columns)
    await expectVisibleColumns(page, 2)
    await expectNoHorizontalScroll(page)

    // Resize to desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    // Wait for resize to take effect
    await page.waitForTimeout(200)

    // Verify desktop layout (3+ columns)
    await expectVisibleColumns(page, 3)
    await expectNoHorizontalScroll(page)
  })

  test('should adapt from desktop to mobile layout', async ({ page }) => {
    // Start on desktop
    await page.setViewportSize({ width: 1920, height: 1080 })

    // Verify desktop layout
    await expectVisibleColumns(page, 3)
    await expectNoHorizontalScroll(page)

    // Resize to mobile
    await page.setViewportSize({ width: 375, height: 667 })

    // Wait for resize to take effect
    await page.waitForTimeout(200)

    // Verify mobile layout (1 column)
    await expectVisibleColumns(page, 1)
    await expectNoHorizontalScroll(page)
  })

  test('should maintain functionality across breakpoints', async ({
    page,
    expenses,
  }) => {
    // Add on mobile
    await page.setViewportSize({ width: 375, height: 667 })
    // Load the mobile layout from scratch, so it does not remount mid-input
    await reloadPage(page)
    const expense = await expenses.add('E2E расход на мобильном')
    const row = expenseRow(page, expense.description, expense.amount)

    // Resize to tablet - expense should still be visible
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(row).toBeVisible(TIMEOUT)

    // Resize to desktop - expense should still be visible
    await page.setViewportSize({ width: 1280, height: 720 })
    await expect(row).toBeVisible(TIMEOUT)

    await expenses.remove(expense)
  })

  test('should handle rapid viewport changes', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 }, // Mobile
      { width: 768, height: 1024 }, // Tablet
      { width: 1280, height: 720 }, // Desktop
      { width: 393, height: 852 }, // Mobile
      { width: 1024, height: 1366 }, // Tablet
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(150)

      // Layout should not break
      await expectNoHorizontalScroll(page)

      // Form should remain functional
      await expect(
        journalForm(page).getByLabel('Описание расхода')
      ).toBeVisible()
      await expect(journalForm(page).getByLabel('Сумма расхода')).toBeVisible()
    }
  })

  test('should preserve edit mode state across viewport changes', async ({
    page,
  }) => {
    // Start on desktop
    await page.setViewportSize({ width: 1280, height: 720 })

    // Enter edit mode
    const header = page.getByRole('banner')
    await header.getByRole('button', { name: /Редактировать/ }).click()

    // Verify edit mode is active
    await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(200)

    // Edit mode state should persist (button text should still be "Готово")
    await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()
  })

  test('should show/hide drag handles appropriately across viewports', async ({
    page,
  }) => {
    // Start on desktop in edit mode
    await page.setViewportSize({ width: 1280, height: 720 })

    const header = page.getByRole('banner')
    await header.getByRole('button', { name: /Редактировать/ }).click()

    // Drag handles should be visible on desktop
    const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
    await expect(dragHandles.first()).toBeVisible()

    // Resize to tablet
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(200)

    // Drag handles should NOT be visible on tablet
    await expect(dragHandles).toHaveCount(0)

    // Resize back to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.waitForTimeout(200)

    // Drag handles should be visible again
    await expect(dragHandles.first()).toBeVisible()
  })
})

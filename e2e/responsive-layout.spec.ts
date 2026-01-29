import { test, expect } from '@playwright/test'

import {
  getViewportCategory,
  expectNoHorizontalScroll,
  expectVisibleColumns,
  expectWidgetVisible,
  getViewportSize,
} from './utils/viewport-helpers'

test.describe('Responsive Layout Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.describe('Mobile Layout (< 768px)', () => {
    test('should display single column layout on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('mobile')

      // Verify single column
      await expectVisibleColumns(page, 1)
    })

    test('should show all widgets in stacked layout', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // All widgets should be visible (may need scrolling)
      await expectWidgetVisible(page, 'Календарь')
      await expectWidgetVisible(page, 'Журнал расходов')
      await expectWidgetVisible(page, 'Анализ')
      await expectWidgetVisible(page, 'Динамика')
    })

    test('should have no horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await expectNoHorizontalScroll(page)
    })

    test('should not show drag handles on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Enter edit mode via mobile button
      const header = page.getByRole('banner')
      const editButton = header.getByRole('button').first()
      await editButton.click()

      // Drag handles should NOT be visible on mobile
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles).toHaveCount(0)
    })
  })

  test.describe('Tablet Layout (768px - 1279px)', () => {
    test('should display 2-column layout on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('tablet')

      // Verify 2 columns
      await expectVisibleColumns(page, 2)
    })

    test('should have no horizontal scroll on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await expectNoHorizontalScroll(page)
    })

    test('should not show drag handles on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Drag handles should NOT be visible on tablet
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles).toHaveCount(0)
    })
  })

  test.describe('Desktop Layout (>= 1280px)', () => {
    test('should display multi-column layout on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      const size = await getViewportSize(page)
      const category = getViewportCategory(size.width)
      expect(category).toBe('desktop')

      // Desktop has 3 columns by default
      await expectVisibleColumns(page, 3)
    })

    test('should show drag handles in edit mode on desktop', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Drag handles SHOULD be visible on desktop
      const dragHandles = page.locator('[aria-label="Перетащить виджет"]')
      await expect(dragHandles.first()).toBeVisible()
    })

    test('should have no horizontal scroll on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
      await expectNoHorizontalScroll(page)
    })
  })

  test.describe('Responsive Header', () => {
    test('should show compact header on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const header = page.getByRole('banner')
      await expect(header).toBeVisible()

      // Title should be visible
      await expect(header.getByText('SmartSpend Terminal')).toBeVisible()
    })

    test('should show full header on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      const header = page.getByRole('banner')
      await expect(header).toBeVisible()

      // Should show full edit button text
      await expect(
        header.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })
  })
})

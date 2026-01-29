import { test, expect } from '@playwright/test'

test.describe('Touch Target Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test.describe('Navigation Buttons', () => {
    test('previous month button meets 44x44px minimum on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const prevButton = page
        .getByRole('button', { name: 'Предыдущий месяц' })
        .first()
      await expect(prevButton).toBeVisible()

      const box = await prevButton.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('next month button meets 44x44px minimum on mobile', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const nextButton = page
        .getByRole('button', { name: 'Следующий месяц' })
        .first()
      await expect(nextButton).toBeVisible()

      const box = await nextButton.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Form Buttons', () => {
    test('submit button meets 44px minimum height', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })
      await expect(submitButton).toBeVisible()

      const box = await submitButton.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Delete Buttons', () => {
    test('delete button meets 44x44px minimum on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Add an expense first
      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      await descriptionInput.fill('Test expense')
      await amountInput.fill('100')
      await submitButton.click()

      // Wait for expense to appear
      await expect(page.getByText('Test expense')).toBeVisible({
        timeout: 10000,
      })

      // Check delete button size
      const deleteButton = page.getByRole('button', { name: 'delete' }).first()
      await expect(deleteButton).toBeVisible()

      const box = await deleteButton.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Drag Handles', () => {
    test('drag handles meet 44x44px minimum on desktop edit mode', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 })

      // Enter edit mode
      const header = page.getByRole('banner')
      await header.getByRole('button', { name: /Редактировать/ }).click()

      // Check drag handle size
      const dragHandle = page
        .locator('[aria-label="Перетащить виджет"]')
        .first()
      await expect(dragHandle).toBeVisible()

      const box = await dragHandle.boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(44)
      }
    })
  })

  test.describe('Interactive Element Spacing', () => {
    test('all buttons have adequate spacing on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const header = page.getByRole('banner')
      const buttons = header.getByRole('button')

      const count = await buttons.count()
      expect(count).toBeGreaterThan(0)

      // Check spacing between buttons using gap
      const hasGap = await header.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        const gap = computed.gap
        return gap && gap !== '0px' && gap !== 'normal'
      })

      expect(hasGap).toBe(true)
    })
  })
})

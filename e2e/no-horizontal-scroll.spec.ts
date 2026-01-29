import { test } from '@playwright/test'

import { VIEWPORTS } from '../playwright.config'
import { expectNoHorizontalScroll } from './utils/viewport-helpers'

test.describe('No Horizontal Scroll Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.evaluate(() => localStorage.clear())
    await page.reload()
  })

  test('mobile small (375px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile_small)
    await expectNoHorizontalScroll(page)
  })

  test('mobile medium (393px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile_medium)
    await expectNoHorizontalScroll(page)
  })

  test('mobile large (430px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.mobile_large)
    await expectNoHorizontalScroll(page)
  })

  test('tablet small (768px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet_small)
    await expectNoHorizontalScroll(page)
  })

  test('tablet large (1024px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.tablet_large)
    await expectNoHorizontalScroll(page)
  })

  test('desktop (1280px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop)
    await expectNoHorizontalScroll(page)
  })

  test('desktop large (1920px) has no horizontal scroll', async ({ page }) => {
    await page.setViewportSize(VIEWPORTS.desktop_large)
    await expectNoHorizontalScroll(page)
  })

  test.describe('No Horizontal Scroll with Content', () => {
    test('no horizontal scroll after adding multiple expenses', async ({
      page,
    }) => {
      await page.setViewportSize(VIEWPORTS.mobile_small)

      const descriptionInput = page.getByPlaceholder('Описание расхода')
      const amountInput = page.getByPlaceholder('Сумма')
      const submitButton = page.getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Add several expenses with long descriptions
      const expenses = [
        {
          description:
            'Very long expense description that might cause overflow',
          amount: '1000',
        },
        {
          description: 'Another really long description to test text wrapping',
          amount: '2000',
        },
        {
          description: 'Third expense with a lengthy description',
          amount: '3000',
        },
      ]

      for (const expense of expenses) {
        await descriptionInput.fill(expense.description)
        await amountInput.fill(expense.amount)
        await submitButton.click()
        await page.waitForTimeout(500)
      }

      // Still no horizontal scroll
      await expectNoHorizontalScroll(page)
    })

    test('no horizontal scroll in edit mode on all viewports', async ({
      page,
    }) => {
      const testViewports = [
        VIEWPORTS.mobile_small,
        VIEWPORTS.tablet_small,
        VIEWPORTS.desktop,
      ]

      for (const viewport of testViewports) {
        await page.setViewportSize(viewport)
        await page.waitForTimeout(200)

        // Only desktop supports edit mode with drag handles
        if (viewport.width >= 1280) {
          const header = page.getByRole('banner')
          await header.getByRole('button', { name: /Редактировать/ }).click()
          await page.waitForTimeout(200)
        }

        await expectNoHorizontalScroll(page)

        // Exit edit mode if desktop
        if (viewport.width >= 1280) {
          const header = page.getByRole('banner')
          await header.getByRole('button', { name: /Готово/ }).click()
        }
      }
    })
  })
})

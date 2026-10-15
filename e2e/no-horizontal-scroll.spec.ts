import { VIEWPORTS } from '../playwright.config'
import { expect, reloadPage, test, TIMEOUT } from './utils/expenses'
import { expectNoHorizontalScroll } from './utils/viewport-helpers'

test.describe('No Horizontal Scroll Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
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
      expenses,
    }) => {
      // Adds and removes three expenses through the UI
      test.setTimeout(120000)
      await page.setViewportSize(VIEWPORTS.mobile_small)
      // Load the mobile layout from scratch, so it does not remount mid-input
      await reloadPage(page)

      // Long descriptions that might cause overflow
      const created = []
      for (const description of [
        'E2E очень длинное описание расхода, которое может вызвать переполнение',
        'E2E ещё одно действительно длинное описание для проверки переноса',
        'E2E третий расход с достаточно длинным описанием',
      ]) {
        created.push(await expenses.add(description))
      }

      await expectNoHorizontalScroll(page)

      // Clean up at desktop width: the mobile accordion can collapse the
      // journal again after a reload and cover the row's delete button.
      await page.setViewportSize({ width: 1280, height: 720 })
      for (const expense of created) await expenses.remove(expense)
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

import {
  type DesktopLayout,
  readDesktopLayout,
  restoreDesktopLayout,
  swapFirstTwoWidgets,
} from './utils/layout'
import { test, expect } from './utils/test'

// Edit mode marks every desktop widget with a drag handle.
const DRAG_HANDLE = 'Перетащить виджет'

test.describe('Layout Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
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

    // Verify every widget shows its drag handle
    const handles = page.getByRole('button', { name: DRAG_HANDLE })
    const layout = await readDesktopLayout(page)
    await expect(handles).toHaveCount(layout.flat().length)

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

    // Verify the drag handles are removed
    await expect(page.getByRole('button', { name: DRAG_HANDLE })).toHaveCount(0)
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

    // Verify no edit mode drag handles
    await expect(page.getByRole('button', { name: DRAG_HANDLE })).toHaveCount(0)
  })
})

test.describe('Layout Persistence on the server', () => {
  // The layout is stored on the server per user. The test captures the
  // whole layout first; the cleanup restores every column of it, runs even
  // when the test fails or times out, and has its own time budget.
  let original: DesktopLayout | undefined

  test.beforeEach(async ({ page }) => {
    original = undefined
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
  })

  test.afterEach(async ({ page }, testInfo) => {
    if (!original) return
    testInfo.setTimeout(testInfo.timeout + 120000)
    await restoreDesktopLayout(page, original)
  })

  test('should persist layout configuration after reload', async ({ page }) => {
    // Drags, waits for the save, and reloads on a possibly slow Preview.
    test.setTimeout(150000)
    original = await readDesktopLayout(page)

    const swapped = await swapFirstTwoWidgets(page, original)

    await page.reload()
    await expect
      .poll(() => readDesktopLayout(page), { timeout: 15000 })
      .toEqual(swapped)
  })
})

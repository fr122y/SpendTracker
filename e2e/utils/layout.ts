/**
 * E2E Layout Utilities
 * Reads and changes the desktop widget layout, which the app stores on the
 * server per user. Tests that change it restore the original afterwards.
 */

import { expect, type Locator, type Page } from '@playwright/test'

const TIMEOUT = { timeout: 10000 }

/** Widget titles per desktop column, in display order. */
export type DesktopLayout = string[][]

function columns(page: Page): Locator {
  return page.locator('[data-grid-container] > div:not([role="separator"])')
}

function widgets(column: Locator): Locator {
  return column.locator(':scope > div > [draggable]:has(h2)')
}

/** Reads the desktop layout from the rendered grid. */
export async function readDesktopLayout(page: Page): Promise<DesktopLayout> {
  await expect(widgets(columns(page).first()).first()).toBeVisible(TIMEOUT)
  return columns(page).evaluateAll((cols) =>
    cols.map((col) =>
      Array.from(
        col.querySelectorAll(':scope > div > [draggable]:has(h2)')
      ).map((widget) => widget.querySelector('h2')?.textContent?.trim() ?? '')
    )
  )
}

async function setEditMode(page: Page, on: boolean): Promise<void> {
  const header = page.getByRole('banner')
  const target = on ? 'Редактировать' : 'Готово'
  const button = header.getByRole('button', { name: target })
  if (await button.isVisible()) await button.click()
  await expect(
    header.getByRole('button', { name: on ? 'Готово' : 'Редактировать' })
  ).toBeVisible()
}

/**
 * Swaps the first two widgets of the first column holding at least two,
 * by dragging the first onto the second in edit mode. Returns the expected
 * layout after the swap.
 */
export async function swapFirstTwoWidgets(
  page: Page,
  layout: DesktopLayout
): Promise<DesktopLayout> {
  const columnIndex = layout.findIndex((column) => column.length >= 2)
  expect(columnIndex, 'a column with two widgets').toBeGreaterThanOrEqual(0)

  await setEditMode(page, true)
  const column = columns(page).nth(columnIndex)
  // The drop saves the layout through a server action; wait for it so a
  // reload right after cannot abort the save.
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      (response.request().postData() ?? '').includes('"columns"')
  )
  await widgets(column)
    .nth(0)
    .dragTo(widgets(column).nth(1), {
      sourcePosition: { x: 24, y: 24 },
      targetPosition: { x: 24, y: 24 },
    })

  await saved

  const expected = layout.map((titles) => [...titles])
  const [a, b] = expected[columnIndex]
  expected[columnIndex][0] = b
  expected[columnIndex][1] = a
  await expect.poll(() => readDesktopLayout(page), TIMEOUT).toEqual(expected)

  await setEditMode(page, false)
  return expected
}

/**
 * Restores a layout changed by `swapFirstTwoWidgets` and confirms the
 * restored layout is what the server returns after a reload.
 */
export async function restoreDesktopLayout(
  page: Page,
  original: DesktopLayout
): Promise<void> {
  await page.reload()
  const current = await readDesktopLayout(page)
  if (JSON.stringify(current) !== JSON.stringify(original)) {
    await swapFirstTwoWidgets(page, current)
    await page.reload()
  }
  await expect.poll(() => readDesktopLayout(page), TIMEOUT).toEqual(original)
}

/**
 * E2E Layout Utilities
 * Reads and changes the desktop widget layout, which the app stores on the
 * server per user. Tests that change it restore the original afterwards.
 */

import { expect, type Locator, type Page } from '@playwright/test'

const TIMEOUT = { timeout: 15000 }

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
  ).toBeVisible(TIMEOUT)
  if (on) {
    // Edit mode is ready once every widget shows its drag handle.
    await expect(
      page.getByRole('button', { name: 'Перетащить виджет' }).first()
    ).toBeVisible(TIMEOUT)
  }
}

/**
 * Drops the widget at `from` onto the widget at `to` in one column and waits
 * for the layout save server action (`updateLayoutConfig`) to succeed. The
 * app removes the dragged widget and inserts it at `to`.
 */
async function moveInColumn(
  page: Page,
  columnIndex: number,
  from: number,
  to: number
): Promise<void> {
  const column = columns(page).nth(columnIndex)
  // The save is a Next.js server action: a POST with a `next-action` header
  // whose arguments hold the new `columns`. Waiting for it lets a reload
  // right after the drop read the saved layout instead of aborting the save.
  const saved = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      response.request().headers()['next-action'] !== undefined &&
      (response.request().postData() ?? '').includes('"columns"'),
    TIMEOUT
  )
  // Dispatch the HTML5 drag events directly: a mouse drag scrolls the
  // overflowing column mid-drag and can miss the drop on a short viewport.
  const source = widgets(column).nth(from)
  const target = widgets(column).nth(to)
  const dataTransfer = await page.evaluateHandle(() => new DataTransfer())
  await source.dispatchEvent('dragstart', { dataTransfer })
  await target.dispatchEvent('dragover', { dataTransfer })
  await target.dispatchEvent('drop', { dataTransfer })
  await source.dispatchEvent('dragend', { dataTransfer })
  const response = await saved
  expect(response.ok(), `layout save returned ${response.status()}`).toBe(true)
}

/**
 * Swaps the first two widgets of the first column holding at least two.
 * Returns the expected layout after the swap.
 */
export async function swapFirstTwoWidgets(
  page: Page,
  layout: DesktopLayout
): Promise<DesktopLayout> {
  const columnIndex = layout.findIndex((column) => column.length >= 2)
  expect(columnIndex, 'a column with two widgets').toBeGreaterThanOrEqual(0)

  await setEditMode(page, true)
  await moveInColumn(page, columnIndex, 0, 1)

  const expected = layout.map((titles) => [...titles])
  const [a, b] = expected[columnIndex]
  expected[columnIndex][0] = b
  expected[columnIndex][1] = a
  await expect.poll(() => readDesktopLayout(page), TIMEOUT).toEqual(expected)

  await setEditMode(page, false)
  return expected
}

function sameWidgets(a: string[], b: string[]): boolean {
  return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort())
}

/**
 * Restores every column of `original` by reordering widgets in edit mode,
 * then reloads and confirms the server returns `original`. Fails with the
 * original order in the message when it cannot.
 */
export async function restoreDesktopLayout(
  page: Page,
  original: DesktopLayout
): Promise<void> {
  const message = `Could not restore the test account layout; restore it manually to ${JSON.stringify(original)}`
  try {
    await page.goto('/')
    let current = await readDesktopLayout(page)
    if (JSON.stringify(current) !== JSON.stringify(original)) {
      expect(current.length, 'column count').toBe(original.length)
      original.forEach((titles, c) =>
        expect(
          sameWidgets(current[c], titles),
          `widgets of column ${c + 1}`
        ).toBe(true)
      )
      await setEditMode(page, true)
      for (let c = 0; c < original.length; c++) {
        for (let i = 0; i < original[c].length; i++) {
          const from = current[c].indexOf(original[c][i])
          if (from === i) continue
          await moveInColumn(page, c, from, i)
          const next = [...current[c]]
          next.splice(i, 0, ...next.splice(from, 1))
          current = current.map((col, k) => (k === c ? next : col))
          await expect
            .poll(() => readDesktopLayout(page), TIMEOUT)
            .toEqual(current)
        }
      }
      await setEditMode(page, false)
    }
    await page.reload()
    await expect.poll(() => readDesktopLayout(page), TIMEOUT).toEqual(original)
  } catch (error) {
    throw new Error(`${message}\n${String(error)}`)
  }
}

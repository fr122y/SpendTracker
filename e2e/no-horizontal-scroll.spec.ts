import { VIEWPORTS } from '../playwright.config'
import {
  deleteExpense,
  expect,
  expenseRow,
  journalForm,
  openJournal,
  reloadPage,
  test,
  TIMEOUT,
  uniqueAmount,
} from './utils/expenses'
import { expectNoHorizontalScroll } from './utils/viewport-helpers'

import type { Locator, Page } from '@playwright/test'

/** The page itself must not scroll sideways. */
async function expectNoPageScroll(page: Page): Promise<void> {
  const { scrollWidth, clientWidth } = await page.evaluate(() => {
    const root = document.scrollingElement ?? document.documentElement
    return { scrollWidth: root.scrollWidth, clientWidth: root.clientWidth }
  })
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth)
}

/** The element is fully inside the viewport horizontally. */
async function expectInsideViewport(page: Page, element: Locator) {
  await expect(element).toBeVisible(TIMEOUT)
  const box = await element.boundingBox()
  const width = page.viewportSize()?.width ?? 0
  expect(box).not.toBeNull()
  expect(box!.x).toBeGreaterThanOrEqual(0)
  expect(box!.x + box!.width).toBeLessThanOrEqual(width)
}

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

    test.describe('long names', () => {
      /** Expense this test created, removed in afterEach even on failure. */
      let createdExpense: { description: string; amount: number } | null = null

      // Removes this test's expense and every category an E2E run of this
      // test created (`E2E` + 8 digits + `Ж…`), including leftovers of
      // earlier runs that were interrupted.
      test.afterEach(async ({ page }) => {
        test.setTimeout(120000)
        await page.setViewportSize(VIEWPORTS.desktop)
        await page.goto('/')
        if (createdExpense) {
          await openJournal(page)
          const { description, amount } = createdExpense
          if ((await expenseRow(page, description, amount).count()) > 0) {
            await deleteExpense(page, description, amount)
          }
          createdExpense = null
        }
        const leftover = page.getByRole('button', {
          name: /^Удалить E2E\d{8}Ж+$/,
        })
        const categoryNames = page.locator('[data-testid^="category-name-"]')
        await reloadPage(page)
        await expect(page.getByLabel('Название личной категории')).toBeVisible(
          TIMEOUT
        )
        await expect(categoryNames.first()).toBeVisible(TIMEOUT)
        for (let i = 0; i < 20 && (await leftover.count()) > 0; i++) {
          const before = await leftover.count()
          await leftover.first().click()
          // Wait for the delete server action, so the reload cannot abort it.
          const deleted = page.waitForResponse(
            (response) =>
              response.request().method() === 'POST' &&
              /^\["[0-9a-f-]{36}","[0-9a-f-]{36}"\]$/.test(
                response.request().postData() ?? ''
              )
          )
          await page
            .getByRole('alertdialog')
            .getByRole('button', { name: 'Удалить категорию' })
            .click()
          expect((await deleted).ok()).toBe(true)
          await expect(leftover).toHaveCount(before - 1, TIMEOUT)
        }
        await reloadPage(page)
        // The list must have loaded before an empty match means anything.
        await expect(categoryNames.first()).toBeVisible(TIMEOUT)
        await expect(leftover).toHaveCount(0)
      })

      test('long category name and description fit at 375 and 1280 px', async ({
        page,
      }) => {
        test.setTimeout(150000)
        await page.setViewportSize(VIEWPORTS.desktop)
        await reloadPage(page)

        const token = String(Date.now()).slice(-8)
        // 90 characters without spaces: the field keeps the first 40.
        const typedName = `E2E${token}${'Ж'.repeat(90 - 3 - token.length)}`
        const categoryName = typedName.slice(0, 40)
        const emoji = '🧪'
        // 200 characters, the maximum, with one long spaceless word.
        const description = `E2E ${token} ${'Щ'.repeat(200 - 5 - token.length)}`
        const amount = uniqueAmount()

        const categoryInput = page.getByLabel('Название личной категории')
        const deleteCategoryButton = page.getByRole('button', {
          name: `Удалить ${categoryName}`,
        })
        const categoryRow = page
          .locator('li')
          .filter({ has: deleteCategoryButton })

        await categoryInput.fill(typedName)
        await expect(categoryInput).toHaveValue(categoryName)
        await page.getByLabel('Эмодзи личной категории').fill(emoji)
        // Wait for the add server action, so the reload cannot abort it.
        const categorySaved = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            (response.request().postData() ?? '').includes(categoryName)
        )
        await page
          .getByRole('button', { name: 'Добавить личную категорию' })
          .click()
        expect((await categorySaved).ok()).toBe(true)
        await reloadPage(page)
        await expect(categoryRow).toBeVisible(TIMEOUT)

        // The name keeps most of the row next to its buttons.
        const nameBox = await categoryRow
          .locator('[data-testid^="category-name-"]')
          .boundingBox()
        const rowBox = await categoryRow.boundingBox()
        const buttonsBox = await deleteCategoryButton
          .locator('xpath=..')
          .boundingBox()
        // A narrow widget stacks the buttons under the name.
        const stacked = buttonsBox!.y >= nameBox!.y + nameBox!.height
        expect(nameBox!.width).toBeGreaterThanOrEqual(
          0.5 * (stacked ? rowBox!.width : rowBox!.width - buttonsBox!.width)
        )

        const form = journalForm(page)
        await openJournal(page)
        const descriptionInput = form.getByLabel('Описание расхода')
        const amountInput = form.getByLabel('Сумма расхода')
        const categorySelect = form.getByLabel('Категория', { exact: true })
        await expect(async () => {
          if ((await descriptionInput.inputValue()) !== description) {
            await descriptionInput.fill(description)
          }
          if ((await amountInput.inputValue()) !== String(amount)) {
            await amountInput.fill(String(amount))
          }
          await descriptionInput.focus()
          await descriptionInput.blur()
          await expect(categorySelect).toBeVisible({ timeout: 1000 })
        }).toPass(TIMEOUT)
        await categorySelect.selectOption(
          { label: `${emoji} ${categoryName}` },
          TIMEOUT
        )

        const saved = page.waitForResponse(
          (response) =>
            response.request().method() === 'POST' &&
            (response.request().postData() ?? '').includes(token) &&
            (response.request().postData() ?? '').includes(`"amount":${amount}`)
        )
        createdExpense = { description, amount }
        await form
          .getByRole('button', { name: 'Добавить', exact: true })
          .click()
        expect((await saved).ok()).toBe(true)
        await reloadPage(page)

        for (const viewport of [VIEWPORTS.desktop, VIEWPORTS.mobile_small]) {
          await page.setViewportSize(viewport)
          await openJournal(page)
          const row = expenseRow(page, description, amount)
          await expect(row).toBeVisible(TIMEOUT)
          await expectInsideViewport(
            page,
            row.getByRole('button', { name: 'edit amount' })
          )
          await expectInsideViewport(
            page,
            row.getByRole('button', { name: 'delete' })
          )
          await expectNoPageScroll(page)
          await expectNoHorizontalScroll(page)

          // The analysis tile opens its dialog, which fits the screen.
          const analysisToggle = page.getByRole('button', {
            name: 'Анализ',
            expanded: false,
          })
          if (await analysisToggle.isVisible()) await analysisToggle.click()
          const tile = page.getByTestId(
            `analysis-category-fill-${categoryName}`
          )
          await expect(tile).toBeVisible(TIMEOUT)
          await expectNoPageScroll(page)
          await tile.click()
          const dialog = page.getByTestId('analysis-category-details-dialog')
          await expect(dialog).toBeVisible(TIMEOUT)
          const overflow = await dialog.evaluate((element) => {
            const width = window.innerWidth
            const content = [element, ...element.querySelectorAll('*')]
            return {
              scroll: content.some(
                (node) =>
                  node.scrollWidth > node.clientWidth + 1 &&
                  getComputedStyle(node).overflowX !== 'visible' &&
                  getComputedStyle(node).overflowX !== 'hidden'
              ),
              outside: content
                .filter((node) => node.getClientRects().length > 0)
                .filter((node) => {
                  const box = node.getBoundingClientRect()
                  return box.left < -1 || box.right > width + 1
                })
                .map((node) => node.tagName),
            }
          })
          expect(overflow.outside).toEqual([])
          expect(overflow.scroll).toBe(false)
          await page
            .getByRole('button', { name: 'Закрыть расходы категории' })
            .click()
          await expect(dialog).toBeHidden(TIMEOUT)
        }
      })
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

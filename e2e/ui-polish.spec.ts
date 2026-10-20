import {
  dailyTotal,
  expect,
  expenseRow,
  openJournal,
  rubles,
  test,
  TIMEOUT,
  uniqueAmount,
} from './utils/expenses'

import type { Locator, Page } from '@playwright/test'

const CALCULATOR_BUTTON = 'Открыть калькулятор'

test.describe('Russian money format and labels', () => {
  test('journal row, edit field, and delete confirmation use a comma', async ({
    page,
    expenses,
  }) => {
    await page.goto('/')
    const amount = uniqueAmount() + 0.5
    const expense = await expenses.add('E2E копейки', {
      amount,
      amountText: (value) => String(value).replace('.', ','),
    })
    const row = expenseRow(page, expense.description, expense.amount)

    const amountButton = row.getByRole('button', { name: 'Изменить сумму' })
    await expect(amountButton).toHaveText(rubles(amount))
    await expect(amountButton).toHaveText(/^\d{3},50\s₽$/)
    await expect(
      row.getByRole('button', { name: 'Удалить операцию' })
    ).toBeVisible()
    await expect(dailyTotal(page)).not.toContainText('.')

    await amountButton.click()
    // While editing, the row shows the field instead of the amount button, so
    // the row locator no longer matches; only one amount field is open.
    const amountField = page.getByRole('textbox', { name: 'Изменить сумму' })
    await expect(amountField).toHaveValue(`${Math.floor(amount)},50`)
    await amountField.press('Escape')
    await expect(amountField).toHaveCount(0)

    await row.getByRole('button', { name: 'Удалить операцию' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Удалить операцию?' })
    await expect(dialog).toContainText(`· ${rubles(amount)} ·`)
    await dialog.getByRole('button', { name: 'Отмена' }).click()
    await expect(dialog).toBeHidden()

    await expenses.remove(expense)
  })
})

/** Area in px² where two client rectangles intersect. */
async function overlapWithCalculator(
  page: Page,
  target: Locator
): Promise<number> {
  const button = page.getByRole('button', { name: CALCULATOR_BUTTON })
  if ((await button.count()) === 0) return 0
  const [a, b] = await Promise.all([
    target.evaluate((element) => element.getBoundingClientRect().toJSON()),
    button.evaluate((element) => element.getBoundingClientRect().toJSON()),
  ])
  const width = Math.min(a.right, b.right) - Math.max(a.left, b.left)
  const height = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top)
  return width > 0 && height > 0 ? width * height : 0
}

/**
 * Scrolls the page so the target's bottom edge sits at several heights near
 * the bottom of the screen, where the floating button is, and checks that the
 * button never covers it.
 */
async function expectNeverCoveredByCalculator(
  page: Page,
  target: Locator
): Promise<void> {
  await expect(target).toBeVisible(TIMEOUT)
  for (const gap of [0, 8, 16, 24, 32, 40, 48, 56, 64]) {
    await target.evaluate((element, offset) => {
      const rect = element.getBoundingClientRect()
      window.scrollBy(0, rect.bottom - (window.innerHeight - offset))
    }, gap)
    expect(
      await overlapWithCalculator(page, target),
      `calculator button covers the element with its bottom ${gap}px above the screen edge`
    ).toBe(0)
  }
}

for (const viewport of [
  { name: 'phone portrait', width: 375, height: 667 },
  { name: 'phone landscape', width: 667, height: 375 },
]) {
  test.describe(`Calculator button clearance, ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } })

    test('does not cover the journal filter chip or the day total', async ({
      page,
    }) => {
      await page.goto('/')
      await openJournal(page)
      await expect(
        page.getByRole('button', { name: CALCULATOR_BUTTON })
      ).toBeVisible(TIMEOUT)

      await expectNeverCoveredByCalculator(
        page,
        page
          .locator('[aria-label="Фильтр операций"]')
          .getByRole('button', { name: 'Карманы', exact: true })
      )
      await expectNeverCoveredByCalculator(page, dailyTotal(page))
    })
  })
}

test.describe('Calculator button while editing a category', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test('hides while the category editor is open', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('[data-grid-container]')).toBeVisible(TIMEOUT)
    const toggle = page.getByRole('button', { name: 'Категории', exact: true })
    if ((await toggle.getAttribute('aria-expanded')) === 'false') {
      await toggle.click()
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    const panel = page.locator('[data-accordion-content="CATEGORIES"]')
    const calculatorButton = page.getByRole('button', {
      name: CALCULATOR_BUTTON,
    })
    await expect(calculatorButton).toBeVisible(TIMEOUT)

    await panel
      .getByRole('button', { name: /^Изменить / })
      .first()
      .click()
    const save = panel.getByRole('button', { name: 'Сохранить' })
    await expect(save).toBeVisible()
    await expect(calculatorButton).toHaveCount(0)
    await expectNeverCoveredByCalculator(page, save)

    await panel.getByRole('button', { name: 'Отмена' }).click()
    await expect(calculatorButton).toBeVisible()
  })
})

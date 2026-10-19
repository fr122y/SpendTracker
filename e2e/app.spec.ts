import {
  dailyTotal,
  expect,
  expenseRow,
  journalForm,
  parseRubles,
  reloadPage,
  test,
  TIMEOUT,
} from './utils/expenses'

import type { Page } from '@playwright/test'

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The analysis button of one category. */
function analysisStat(page: Page, category: string) {
  return page.getByRole('button', {
    name: new RegExp(
      `^${escapeRegExp(category)}, .* ₽, \\d+%\\. Открыть расходы$`
    ),
  })
}

/** The analysis value and share of one category, or zeros without expenses. */
async function analysisEntry(
  page: Page,
  category: string
): Promise<{ value: number; percent: number }> {
  const stat = analysisStat(page, category)
  if ((await stat.count()) === 0) return { value: 0, percent: 0 }
  const label = (await stat.getAttribute('aria-label')) ?? ''
  const [, value = '', percent = ''] = label.split(',')
  return { value: parseRubles(value), percent: parseRubles(percent) }
}

async function analysisValue(page: Page, category: string): Promise<number> {
  return (await analysisEntry(page, category)).value
}

test.describe('SpendTracker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await expect(dailyTotal(page)).toBeVisible(TIMEOUT)
  })

  test.describe('Smoke Tests', () => {
    test('should load the home page with title and header', async ({
      page,
    }) => {
      await expect(page).toHaveTitle(/SpendTracker/)
      await expect(
        page.getByRole('heading', { name: 'SmartSpend Terminal' })
      ).toBeVisible()
    })

    test('should render date navigation controls', async ({ page }) => {
      const header = page.getByRole('banner')

      await expect(
        header.getByRole('button', { name: 'Предыдущий день' })
      ).toBeVisible()
      await expect(
        header.getByRole('button', { name: 'Следующий день' })
      ).toBeVisible()
      await expect(
        header.getByRole('button', { name: 'Выбрать месяц' })
      ).toBeVisible()
      // The layout editor is not available on phones.
      const editButton = header.getByRole('button', { name: 'Редактировать' })
      if ((page.viewportSize()?.width ?? 1280) < 768) {
        await expect(editButton).toBeHidden()
      } else {
        await expect(editButton).toBeVisible()
      }
    })

    test('should render dashboard widgets', async ({ page }) => {
      const form = journalForm(page)
      await expect(form.getByLabel('Описание расхода')).toBeVisible()
      await expect(form.getByLabel('Сумма расхода')).toBeVisible()
      await expect(
        form.getByRole('button', { name: 'Добавить', exact: true })
      ).toBeVisible()

      await expect(page.getByText('Бюджет на неделю')).toBeVisible()
    })
  })

  test.describe('Add Expense Flow', () => {
    // Each add and delete waits for its server action and reloads.
    test.describe.configure({ timeout: 90000 })

    test('should add expense via form and show in list', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E продукты')

      const row = expenseRow(page, expense.description, expense.amount)
      await expect(row).toBeVisible()
      await expect(
        row.getByText(expense.category, { exact: true })
      ).toBeVisible()

      await expenses.remove(expense)
    })

    test('should clear form after successful submission', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E кофе')

      const form = journalForm(page)
      await expect(form.getByLabel('Описание расхода')).toHaveValue('')
      await expect(form.getByLabel('Сумма расхода')).toHaveValue('')

      await expenses.remove(expense)
    })

    test('should update daily total after adding expense', async ({
      page,
      expenses,
    }) => {
      const before = parseRubles(await dailyTotal(page).textContent())

      const lunch = await expenses.add('E2E обед')
      const dinner = await expenses.add('E2E ужин')

      await expect(dailyTotal(page)).toHaveText(
        `${(before + lunch.amount + dinner.amount).toLocaleString('ru-RU')} ₽`,
        TIMEOUT
      )

      await expenses.remove(lunch)
      await expenses.remove(dinner)
      await expect(dailyTotal(page)).toHaveText(
        `${before.toLocaleString('ru-RU')} ₽`,
        TIMEOUT
      )
    })
  })

  test.describe('Expense Analysis', () => {
    // Each add and delete waits for its server action and reloads.
    test.describe.configure({ timeout: 90000 })

    test('should show expense category in analysis widget', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E тест анализа')
      const stat = analysisStat(page, expense.category)
      await expect(stat).toBeVisible(TIMEOUT)

      // The share is this category's part of the analysis total.
      const total = page.getByTestId('analysis-header-total')
      await expect
        .poll(async () => {
          const { value, percent } = await analysisEntry(page, expense.category)
          const sum = parseRubles(await total.textContent())
          return percent === Number(((value / sum) * 100).toFixed(0))
        }, TIMEOUT)
        .toBe(true)
      const withExpense = await analysisValue(page, expense.category)

      // The category value carries exactly this test's amount.
      await expenses.remove(expense)
      await expect
        .poll(() => analysisValue(page, expense.category), TIMEOUT)
        .toBe(withExpense - expense.amount)
    })

    test('should update analysis totals when expenses are added', async ({
      page,
      expenses,
    }) => {
      const totalBefore = parseRubles(
        await page.getByTestId('analysis-header-total').textContent()
      )
      const description = 'E2E расход для анализа'
      const expense = await expenses.add(description)

      await expect(page.getByTestId('analysis-header-total')).toHaveText(
        `${(totalBefore + expense.amount).toLocaleString('ru-RU')} ₽`,
        TIMEOUT
      )
      const categoryAfter = await analysisValue(page, expense.category)

      await expenses.remove(expense)
      await expect
        .poll(() => analysisValue(page, expense.category), TIMEOUT)
        .toBe(categoryAfter - expense.amount)
    })
  })

  test.describe('Data Persistence', () => {
    // Each add and delete waits for its server action and reloads.
    test.describe.configure({ timeout: 90000 })

    test('should persist expenses after page reload', async ({
      page,
      expenses,
    }) => {
      const expense = await expenses.add('E2E постоянный расход')

      await reloadPage(page)
      await expect(
        expenseRow(page, expense.description, expense.amount)
      ).toBeVisible(TIMEOUT)

      await expenses.remove(expense)
    })

    test('should persist multiple expenses after reload', async ({
      page,
      expenses,
    }) => {
      const first = await expenses.add('E2E первый расход')
      const second = await expenses.add('E2E второй расход')

      await reloadPage(page)
      await expect(
        expenseRow(page, first.description, first.amount)
      ).toBeVisible(TIMEOUT)
      await expect(
        expenseRow(page, second.description, second.amount)
      ).toBeVisible()

      await expenses.remove(first)
      await expenses.remove(second)
    })

    test('should toggle layout edit mode from the header', async ({ page }) => {
      test.skip(
        (page.viewportSize()?.width ?? 1280) < 768,
        'The layout editor is not available on phones'
      )
      const header = page.getByRole('banner')

      await header.getByRole('button', { name: /Редактировать/ }).click()
      await expect(header.getByRole('button', { name: /Готово/ })).toBeVisible()

      await header.getByRole('button', { name: /Готово/ }).click()
      await expect(
        header.getByRole('button', { name: /Редактировать/ })
      ).toBeVisible()
    })
  })

  test.describe('Date Navigation', () => {
    test('should navigate to the previous day and month', async ({ page }) => {
      const dateButton = page
        .getByRole('banner')
        .getByRole('button', { name: 'Выбрать месяц' })
      const shown = parseHeaderDate(await dateButton.textContent())

      await page
        .getByRole('banner')
        .getByRole('button', { name: 'Предыдущий день' })
        .click()
      const dayBefore = addDays(shown, -1)
      await expect(dateButton).toHaveText(formatHeaderDate(dayBefore))

      // The picker moves one month back from the date the day step showed.
      const monthBefore = shiftMonth(dayBefore, -1)
      await pickMonth(page, monthBefore)
      await expect(dateButton).toHaveText(formatHeaderDate(monthBefore))
    })

    test('should navigate to the next day and month', async ({ page }) => {
      const dateButton = page
        .getByRole('banner')
        .getByRole('button', { name: 'Выбрать месяц' })
      const shown = parseHeaderDate(await dateButton.textContent())

      await page
        .getByRole('banner')
        .getByRole('button', { name: 'Следующий день' })
        .click()
      const dayAfter = addDays(shown, 1)
      await expect(dateButton).toHaveText(formatHeaderDate(dayAfter))

      const monthAfter = shiftMonth(dayAfter, 1)
      await pickMonth(page, monthAfter)
      await expect(dateButton).toHaveText(formatHeaderDate(monthAfter))
    })
  })

  test.describe('Edit Mode', () => {
    test('should toggle edit mode', async ({ page }) => {
      test.skip(
        (page.viewportSize()?.width ?? 1280) < 768,
        'The layout editor is not available on phones'
      )
      const header = page.getByRole('banner')

      await header.getByRole('button', { name: 'Редактировать' }).click()
      await expect(header.getByRole('button', { name: 'Готово' })).toBeVisible()

      await header.getByRole('button', { name: 'Готово' }).click()
      await expect(
        header.getByRole('button', { name: 'Редактировать' })
      ).toBeVisible()
    })

    test('should show widget titles in edit mode', async ({ page }) => {
      test.skip(
        (page.viewportSize()?.width ?? 1280) < 768,
        'The layout editor is not available on phones'
      )
      const header = page.getByRole('banner')

      await header.getByRole('button', { name: 'Редактировать' }).click()

      await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
      await expect(
        page.getByText('Журнал расходов', { exact: true })
      ).toBeVisible()
      await expect(page.getByText('Анализ', { exact: true })).toBeVisible()
      await expect(page.getByText('Динамика', { exact: true })).toBeVisible()
    })
  })
})

function formatHeaderDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const MONTHS_GENITIVE = Array.from(
  { length: 12 },
  (_, month) => formatHeaderDate(new Date(2024, month, 15)).split(' ')[1]
)

/** Parses the header date, such as `14 октября 2026 г.`. */
function parseHeaderDate(text: string | null): Date {
  const [day = '', month = '', year = ''] = (text ?? '').trim().split(/\s+/)
  const monthIndex = MONTHS_GENITIVE.indexOf(month)
  expect(monthIndex, `header date "${text}"`).toBeGreaterThanOrEqual(0)
  return new Date(Number(year), monthIndex, Number(day))
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** The same day in a neighbouring month, clamped to that month's length. */
function shiftMonth(date: Date, months: number): Date {
  const first = new Date(date.getFullYear(), date.getMonth() + months, 1)
  const lastDay = new Date(
    first.getFullYear(),
    first.getMonth() + 1,
    0
  ).getDate()
  return new Date(
    first.getFullYear(),
    first.getMonth(),
    Math.min(date.getDate(), lastDay)
  )
}

/** Opens the header month picker and selects the month of `date`. */
async function pickMonth(page: Page, date: Date): Promise<void> {
  const header = page.getByRole('banner')
  await header.getByRole('button', { name: 'Выбрать месяц' }).click()
  const picker = page.getByRole('dialog', { name: 'Выбор месяца' })
  await expect(picker).toBeVisible()

  const shownYear = Number(
    (await picker
      .getByText(/^\d{4}$/)
      .first()
      .textContent()) ?? '0'
  )
  if (date.getFullYear() < shownYear) {
    await picker.getByRole('button', { name: 'Предыдущий год' }).click()
  } else if (date.getFullYear() > shownYear) {
    await picker.getByRole('button', { name: 'Следующий год' }).click()
  }

  const monthName = date.toLocaleDateString('ru-RU', { month: 'long' })
  await picker
    .getByRole('button', { name: new RegExp(`^${monthName}$`, 'i') })
    .click()
  await expect(picker).toBeHidden()
}

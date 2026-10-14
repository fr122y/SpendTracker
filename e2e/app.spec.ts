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

/** The analysis value of one category, or 0 while it has no expenses. */
async function analysisValue(page: Page, category: string): Promise<number> {
  const stat = page.getByRole('button', {
    name: new RegExp(`^${category}, .* ₽, \\d+%\\. Открыть расходы$`),
  })
  if ((await stat.count()) === 0) return 0
  const label = (await stat.getAttribute('aria-label')) ?? ''
  return parseRubles(label.split(',')[1])
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
      await expect(
        header.getByRole('button', { name: 'Редактировать' })
      ).toBeVisible()
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

      await expect(
        page.getByRole('button', {
          name: new RegExp(
            `^${expense.category}, .* ₽, \\d+%\\. Открыть расходы$`
          ),
        })
      ).toBeVisible(TIMEOUT)

      await expenses.remove(expense)
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

    test('should persist layout configuration after reload', async ({
      page,
    }) => {
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
      const header = page.getByRole('banner')
      const dateButton = header.getByRole('button', { name: 'Выбрать месяц' })
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(today.getDate() - 1)

      await header.getByRole('button', { name: 'Предыдущий день' }).click()
      await expect(dateButton).toHaveText(formatHeaderDate(yesterday))

      // Month switching now goes through the month picker.
      const previousMonth = new Date(
        today.getFullYear(),
        today.getMonth() - 1,
        1
      )
      await pickMonth(page, previousMonth)
      await expect(dateButton).toContainText(formatMonthYear(previousMonth))
    })

    test('should navigate to the next day and month', async ({ page }) => {
      const header = page.getByRole('banner')
      const dateButton = header.getByRole('button', { name: 'Выбрать месяц' })
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      await header.getByRole('button', { name: 'Следующий день' }).click()
      await expect(dateButton).toHaveText(formatHeaderDate(tomorrow))

      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
      await pickMonth(page, nextMonth)
      await expect(dateButton).toContainText(formatMonthYear(nextMonth))
    })
  })

  test.describe('Edit Mode', () => {
    test('should toggle edit mode', async ({ page }) => {
      const header = page.getByRole('banner')

      await header.getByRole('button', { name: 'Редактировать' }).click()
      await expect(header.getByRole('button', { name: 'Готово' })).toBeVisible()

      await header.getByRole('button', { name: 'Готово' }).click()
      await expect(
        header.getByRole('button', { name: 'Редактировать' })
      ).toBeVisible()
    })

    test('should show widget titles in edit mode', async ({ page }) => {
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

/** `октября 2026`: the genitive month and year of the header date. */
function formatMonthYear(date: Date): string {
  return formatHeaderDate(date).split(' ').slice(1).join(' ')
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

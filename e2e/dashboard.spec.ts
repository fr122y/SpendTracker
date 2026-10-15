import { test, expect } from '@playwright/test'

test.describe('Dashboard Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display critical widgets', async ({ page }) => {
    const header = page.getByRole('banner')

    // Enter edit mode to see widget titles
    await header.getByRole('button', { name: /Редактировать/ }).click()

    // Verify critical widgets are visible (use exact match for titles)
    await expect(page.getByText('Календарь', { exact: true })).toBeVisible()
    await expect(
      page.getByText('Журнал расходов', { exact: true })
    ).toBeVisible()
    await expect(page.getByText('Анализ', { exact: true })).toBeVisible()

    // Exit edit mode
    await header.getByRole('button', { name: /Готово/ }).click()
  })

  test('should display current date in header', async ({ page }) => {
    // The header shows the selected day, today by default, formatted by the
    // app in the browser; compute the expectation from the browser clock.
    const expectedDate = await page.evaluate(() =>
      new Date().toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    )

    await expect(
      page.getByRole('banner').getByRole('button', { name: 'Выбрать месяц' })
    ).toHaveText(expectedDate)
  })

  test('should render header with title', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: 'SmartSpend Terminal' })
    ).toBeVisible()
  })

  test('should render date navigation controls', async ({ page }) => {
    const header = page.getByRole('banner')
    const dateButton = header.getByRole('button', { name: 'Выбрать месяц' })
    const formatShifted = (days: number) =>
      page.evaluate((offset) => {
        const date = new Date()
        date.setDate(date.getDate() + offset)
        return date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      }, days)

    await expect(
      header.getByRole('button', { name: 'Предыдущий день' })
    ).toBeVisible()
    await expect(
      header.getByRole('button', { name: 'Следующий день' })
    ).toBeVisible()
    await expect(dateButton).toBeVisible()

    // The arrows move the selected date back and forward
    await header.getByRole('button', { name: 'Предыдущий день' }).click()
    await expect(dateButton).toHaveText(await formatShifted(-1))
    await header.getByRole('button', { name: 'Следующий день' }).click()
    await expect(dateButton).toHaveText(await formatShifted(0))

    // The date button opens the month picker
    await dateButton.click()
    const picker = page.getByRole('dialog', { name: 'Выбор месяца' })
    await expect(picker).toBeVisible()
    await picker.getByRole('button', { name: 'Закрыть' }).click()
    await expect(picker).toBeHidden()

    // Picking another month in the picker moves the header to that month
    const target = await page.evaluate(() => {
      const today = new Date()
      const month = (today.getMonth() + 1) % 12
      const lastDay = new Date(today.getFullYear(), month + 1, 0).getDate()
      const date = new Date(
        today.getFullYear(),
        month,
        Math.min(today.getDate(), lastDay)
      )
      return {
        monthName: date.toLocaleDateString('ru-RU', { month: 'long' }),
        header: date.toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      }
    })
    await dateButton.click()
    await expect(picker).toBeVisible()
    await picker
      .getByRole('button', { name: new RegExp(`^${target.monthName}$`, 'i') })
      .click()
    await expect(picker).toBeHidden()
    await expect(dateButton).toHaveText(target.header)
  })

  test('should reject an out-of-range salary day without saving', async ({
    page,
  }) => {
    const salaryButton = page.getByRole('button', { name: /Зарплата:/ })
    const savedLabel = await salaryButton.innerText()
    await salaryButton.click()

    const input = page.getByRole('spinbutton', { name: 'День зарплаты' })
    await expect(input).toBeFocused()
    await expect(page.getByText('Зарплата:', { exact: true })).toBeVisible()
    await expect(page.getByText(/1–31 · Enter — сохранить/)).toBeVisible()

    await input.fill('35')
    await input.press('Enter')

    await expect(page.getByText('Введите день от 1 до 31')).toBeVisible()
    await expect(input).toBeVisible()

    await input.press('Escape')
    await expect(input).toBeHidden()
    await expect(page.getByRole('button', { name: /Зарплата:/ })).toHaveText(
      savedLabel
    )
  })

  test('should reject a zero weekly limit without saving', async ({ page }) => {
    // The personal section renders first; a shared budget may add a second
    // «Лимит:» field below it.
    const input = page.getByLabel('Лимит:').first()
    await expect(input).toBeVisible()
    const savedLimit = await input.inputValue()

    await input.fill('0')
    await input.press('Enter')

    await expect(page.getByText('Сумма должна быть больше 0')).toBeVisible()
    await expect(input).toHaveAttribute('aria-invalid', 'true')

    await page.reload()
    await expect(page.getByLabel('Лимит:').first()).toHaveValue(savedLimit)
  })
})

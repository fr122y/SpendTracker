import {
  getE2ECredentials,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
  SIGNED_OUT_STATE,
} from './utils/auth'
import {
  dailyTotal,
  expenseRow,
  openJournal,
  expect,
  journalForm,
  test,
  TIMEOUT,
} from './utils/expenses'

import type { Page } from '@playwright/test'

test.describe('Mobile Form Interaction Tests', () => {
  // Touch input needs a touch-enabled context.
  test.use({ hasTouch: true, viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // The journal mounts only once its accordion section is opened.
    await openJournal(page)
    await expect(dailyTotal(page)).toBeVisible(TIMEOUT)
  })

  test.describe('Expense Form on Mobile', () => {
    test('inputs should be full width on mobile', async ({ page }) => {
      const descriptionInput = journalForm(page).getByLabel('Описание расхода')
      const amountInput = journalForm(page).getByLabel('Сумма расхода')

      await expect(descriptionInput).toBeVisible()
      await expect(amountInput).toBeVisible()

      // Get parent form width
      const formWidth = await descriptionInput.evaluate((input) => {
        const form = input.closest('form')
        return form ? form.offsetWidth : 0
      })

      // Get input widths
      const descriptionBox = await descriptionInput.boundingBox()
      const amountBox = await amountInput.boundingBox()

      expect(descriptionBox).not.toBeNull()
      expect(amountBox).not.toBeNull()

      if (descriptionBox && amountBox && formWidth > 0) {
        // Inputs should be close to full width (allow for padding)
        expect(descriptionBox.width).toBeGreaterThan(formWidth * 0.8)
        expect(amountBox.width).toBeGreaterThan(formWidth * 0.8)
      }
    })

    test('submit button should be full width on mobile', async ({ page }) => {
      const submitButton = journalForm(page).getByRole('button', {
        name: 'Добавить',
        exact: true,
      })
      await expect(submitButton).toBeVisible()

      // Get parent form width
      const formWidth = await submitButton.evaluate((btn) => {
        const form = btn.closest('form')
        return form ? form.offsetWidth : 0
      })

      const buttonBox = await submitButton.boundingBox()
      expect(buttonBox).not.toBeNull()

      if (buttonBox && formWidth > 0) {
        // Button should be close to full width
        expect(buttonBox.width).toBeGreaterThan(formWidth * 0.8)
      }
    })

    test('form submits correctly on mobile with touch input', async ({
      page,
      expenses,
    }) => {
      // Adding and safely removing a row needs several reloads.
      test.slow()
      // Taps every field and the submit button.
      const expense = await expenses.add('E2E мобильный расход', { tap: true })

      // Exactly this run's row shows the description and the amount.
      const row = expenseRow(page, expense.description, expense.amount)
      await expect(row).toBeVisible(TIMEOUT)
      await expect(row.getByText(`${expense.amount} ₽`)).toBeVisible()

      await expenses.remove(expense)
    })

    test('inputs accept keyboard input on mobile', async ({ page }) => {
      const descriptionInput = journalForm(page).getByLabel('Описание расхода')
      const amountInput = journalForm(page).getByLabel('Сумма расхода')

      // Type with keyboard
      await descriptionInput.fill('Keyboard input test')
      await expect(descriptionInput).toHaveValue('Keyboard input test')

      await amountInput.fill('12345')
      await expect(amountInput).toHaveValue('12345')
    })

    test('form clears after submission on mobile', async ({
      page,
      expenses,
    }) => {
      test.slow()
      const expense = await expenses.add('E2E мобильная очистка', { tap: true })
      await expect(
        expenseRow(page, expense.description, expense.amount)
      ).toBeVisible(TIMEOUT)

      const form = journalForm(page)
      await expect(form.getByLabel('Описание расхода')).toHaveValue('')
      await expect(form.getByLabel('Сумма расхода')).toHaveValue('')

      await expenses.remove(expense)
    })

    test('inputs have proper focus states on mobile', async ({ page }) => {
      const descriptionInput = journalForm(page).getByLabel('Описание расхода')

      // Focus input
      await descriptionInput.focus()

      // Check for focus-visible ring
      const hasFocusRing = await descriptionInput.evaluate((input) => {
        const computed = window.getComputedStyle(input)
        return (
          computed.outline !== 'none' ||
          computed.boxShadow.includes('ring') ||
          computed.boxShadow !== 'none'
        )
      })

      expect(hasFocusRing).toBe(true)
    })
  })

  test.describe('Form Accessibility on Mobile', () => {
    test('inputs have placeholders', async ({ page }) => {
      const descriptionInput = journalForm(page).getByLabel('Описание расхода')
      const amountInput = journalForm(page).getByLabel('Сумма расхода')

      // Verify inputs have placeholder
      await expect(descriptionInput).toHaveAttribute(
        'placeholder',
        'Описание расхода'
      )
      // The amount placeholder also hints that expressions are accepted.
      await expect(amountInput).toHaveAttribute(
        'placeholder',
        'Сумма, напр. 500+50'
      )
    })

    test('submit button is visible and accessible', async ({ page }) => {
      const submitButton = journalForm(page).getByRole('button', {
        name: 'Добавить',
        exact: true,
      })

      // Button is visible, disabled until the form is valid, then enabled
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toBeDisabled()

      const form = journalForm(page)
      const descriptionInput = form.getByLabel('Описание расхода')
      const amountInput = form.getByLabel('Сумма расхода')
      const categorySelect = form.getByLabel('Категория', { exact: true })
      const suggestion = form.getByText('Категория:', { exact: true })
      // The form picks a category on description blur once keyword
      // mappings have loaded, so retry until the category step shows.
      await expect(async () => {
        await descriptionInput.fill('E2E проверка кнопки')
        await amountInput.fill('100')
        await descriptionInput.focus()
        await descriptionInput.blur()
        await expect(categorySelect.or(suggestion)).toBeVisible({
          timeout: 1000,
        })
      }).toPass(TIMEOUT)
      if (await categorySelect.isVisible()) {
        await expect(submitButton).toBeDisabled()
        await categorySelect.selectOption({ index: 1 })
      }
      await expect(submitButton).toBeEnabled()
    })
  })

  test.describe('Rotation, Back and field size (T-052)', () => {
    const journalToggle = (page: Page) =>
      page.getByRole('button', { name: 'Журнал расходов', expanded: true })

    test('rotating a phone keeps the accordion and the typed draft', async ({
      page,
    }) => {
      const form = journalForm(page)
      const description = form.getByLabel('Описание расхода')
      const amount = form.getByLabel('Сумма расхода')
      await description.fill('E2E черновик при повороте')
      await amount.fill('321')

      for (const size of [
        { width: 852, height: 393 },
        { width: 375, height: 667 },
      ]) {
        await page.setViewportSize(size)
        // A landscape phone stays on the phone layout: the accordion remains.
        await expect(journalToggle(page)).toBeVisible(TIMEOUT)
        await expect(description).toHaveValue('E2E черновик при повороте')
        await expect(amount).toHaveValue('321')
      }

      // A layout switch remounts the form; the draft still survives it.
      await page.setViewportSize({ width: 1280, height: 720 })
      await expect(journalToggle(page)).toHaveCount(0, TIMEOUT)
      await expect(description).toHaveValue('E2E черновик при повороте')
      await page.setViewportSize({ width: 375, height: 667 })
      await openJournal(page)
      await expect(description).toHaveValue('E2E черновик при повороте')
      await expect(amount).toHaveValue('321')
    })

    test('browser Back closes an open dialog and stays in the app', async ({
      page,
    }) => {
      const url = page.url()
      await page.getByRole('button', { name: 'Открыть калькулятор' }).click()
      const calculator = page.getByRole('dialog', { name: 'Калькулятор' })
      await expect(calculator).toBeVisible(TIMEOUT)

      await page.goBack()

      await expect(calculator).toBeHidden(TIMEOUT)
      expect(page.url()).toBe(url)
      await expect(
        journalForm(page).getByLabel('Описание расхода')
      ).toBeVisible()

      // A normal close leaves no extra history entry behind.
      await page.getByRole('button', { name: 'Открыть калькулятор' }).click()
      await expect(calculator).toBeVisible(TIMEOUT)
      await page.keyboard.press('Escape')
      await expect(calculator).toBeHidden(TIMEOUT)
      await expect
        .poll(() => page.evaluate(() => window.history.state?.backDismissEntry))
        .toBeUndefined()
    })

    test('form fields are at least 16px on a phone', async ({ page }) => {
      const fields = journalForm(page).locator('input, select, textarea')
      expect(await fields.count()).toBeGreaterThan(0)
      const sizes = await fields.evaluateAll((elements) =>
        elements.map((element) =>
          parseFloat(window.getComputedStyle(element).fontSize)
        )
      )
      for (const size of sizes) expect(size).toBeGreaterThanOrEqual(16)
    })
  })
})

test.describe('Login history on mobile (T-052)', () => {
  test.use({
    hasTouch: true,
    viewport: { width: 375, height: 667 },
    storageState: SIGNED_OUT_STATE,
  })

  test('browser Back after login does not return to /login', async ({
    page,
  }) => {
    const credentials = getE2ECredentials()
    if (!credentials) throw new Error(MISSING_E2E_CREDENTIALS_MESSAGE)

    await page.goto('/forgot-password')
    await loginWithCredentials(page, credentials)

    await page.goBack()

    await expect(page).toHaveURL(/\/forgot-password/, TIMEOUT)
  })
})

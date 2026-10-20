/**
 * Tab return, expired session, and offline saves (T-054).
 *
 * - A second tab shows another tab's change once its data is older than the
 *   30 s stale time and the tab becomes visible again, not before.
 * - A save after signing out in another tab leads to the login page with a
 *   way back, and the typed operation returns to the form after sign-in.
 * - Offline, a new expense stays on screen with «Сохраняется…» and is saved
 *   when the network returns.
 */

import {
  getE2ECredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
} from './utils/auth'
import {
  deleteExpense,
  expect,
  expenseRow,
  expenseRows,
  journalForm,
  openJournal,
  test,
  TIMEOUT,
  uniqueAmount,
} from './utils/expenses'

import type { Page } from '@playwright/test'

const OFFLINE_MESSAGE = 'Нет сети — изменения сохранятся, когда связь вернётся'
const SAVING_MESSAGE = 'Сохраняется…'
const DESCRIPTION = 'E2E вкладки'

/** Tells the page its tab became visible, as a tab switch does. */
async function returnToTab(page: Page): Promise<void> {
  await page.evaluate(() => {
    // A real visibilitychange bubbles to window, where TanStack Query listens.
    document.dispatchEvent(new Event('visibilitychange', { bubbles: true }))
    window.dispatchEvent(new Event('focus'))
  })
}

/**
 * Fills the journal form and waits for the category step. The description
 * has a keyword rule from an earlier online add, so a suggestion appears and
 * submitting sends no other request first.
 */
async function fillExpense(
  page: Page,
  description: string,
  amount: number
): Promise<void> {
  const form = journalForm(page)
  const descriptionInput = form.getByLabel('Описание расхода')
  const amountInput = form.getByLabel('Сумма расхода')
  const categorySelect = form.getByLabel('Категория', { exact: true })
  const suggestion = form.getByText('Категория:', { exact: true })

  await openJournal(page)
  await expect(async () => {
    if ((await descriptionInput.inputValue()) !== description) {
      await descriptionInput.fill(description)
    }
    if ((await amountInput.inputValue()) !== String(amount)) {
      await amountInput.fill(String(amount))
    }
    await descriptionInput.focus()
    await descriptionInput.blur()
    await expect(categorySelect.or(suggestion)).toBeVisible({ timeout: 1000 })
  }).toPass(TIMEOUT)
  if (await categorySelect.isVisible()) {
    await categorySelect.selectOption({ index: 1 })
  }
}

function submitButton(page: Page) {
  return journalForm(page).getByRole('button', {
    name: 'Добавить',
    exact: true,
  })
}

test.describe('Tabs, session and offline', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await openJournal(page)
  })

  test('another tab shows a change after it returns with stale data', async ({
    context,
    page,
    expenses,
  }) => {
    test.setTimeout(120_000)
    const other = await context.newPage()
    await other.goto('/')
    await openJournal(other)

    const expense = await expenses.add(DESCRIPTION)
    const otherRows = expenseRows(other, expense.description, expense.amount)

    // A quick return keeps fresh data: no refetch, no change yet.
    await returnToTab(other)
    await other.waitForTimeout(2000)
    await expect(otherRows).toHaveCount(0)

    // Once the data is older than the 30 s stale time, a return refetches.
    await other.waitForTimeout(31_000)
    await returnToTab(other)
    await expect(otherRows.last()).toBeVisible(TIMEOUT)

    await other.close()
    await expenses.remove(expense)
  })

  test('a save after the session ended elsewhere returns the draft after sign-in', async ({
    context,
    page,
  }) => {
    const credentials = getE2ECredentials()
    if (!credentials) throw new Error(MISSING_E2E_CREDENTIALS_MESSAGE)
    const amount = uniqueAmount()

    // The session ends in another tab: the session cookie is gone for every
    // tab. Wait for the initial reads first: each response refreshes the
    // session cookie and would bring it back.
    await page.waitForLoadState('networkidle')
    await context.clearCookies({ name: /authjs\.session-token/ })

    await fillExpense(page, DESCRIPTION, amount)
    await submitButton(page).click()

    await expect(page).toHaveURL(
      /\/login\?callbackUrl=%2F[^&]*&reason=session-expired$/,
      TIMEOUT
    )
    await expect(
      page.getByText('Сессия истекла — войдите снова').first()
    ).toBeVisible()

    await page.getByPlaceholder('Email').fill(credentials.email)
    await page.getByPlaceholder('Пароль').fill(credentials.password)
    await page.getByRole('button', { name: 'Войти', exact: true }).click()
    await expect(page).not.toHaveURL(/\/login/, { timeout: 15000 })

    await openJournal(page)
    const form = journalForm(page)
    await expect(form.getByLabel('Описание расхода')).toHaveValue(
      DESCRIPTION,
      TIMEOUT
    )
    await expect(form.getByLabel('Сумма расхода')).toHaveValue(String(amount))
    // Nothing was saved while signed out.
    await expect(expenseRows(page, DESCRIPTION, amount)).toHaveCount(0)

    await form.getByLabel('Описание расхода').fill('')
    await form.getByLabel('Сумма расхода').fill('')
  })

  test('an offline expense shows «Сохраняется…» and saves on reconnect', async ({
    context,
    page,
    expenses,
  }) => {
    // An online add first: it keeps a keyword rule for the description, so
    // the offline add below needs no other request before its own.
    const first = await expenses.add(DESCRIPTION)
    let amount = uniqueAmount()
    while (amount === first.amount) amount = uniqueAmount()

    await context.setOffline(true)
    const status = page.getByRole('status').filter({ hasText: OFFLINE_MESSAGE })
    await expect(status).toBeVisible(TIMEOUT)

    await fillExpense(page, DESCRIPTION, amount)
    await submitButton(page).click()
    await expect(expenseRow(page, DESCRIPTION, amount)).toBeVisible(TIMEOUT)
    await expect(status).toContainText(SAVING_MESSAGE)

    const saved = page.waitForResponse((response) => {
      const body = response.request().postData() ?? ''
      return (
        response.request().method() === 'POST' &&
        body.includes(DESCRIPTION) &&
        body.includes(`"amount":${amount}`)
      )
    })
    await context.setOffline(false)
    expect((await saved).ok()).toBe(true)
    await expect(page.getByText(SAVING_MESSAGE)).toHaveCount(0, TIMEOUT)
    await expect(page.getByText(OFFLINE_MESSAGE)).toHaveCount(0)

    await deleteExpense(page, DESCRIPTION, amount)
    await expenses.remove(first)
  })
})

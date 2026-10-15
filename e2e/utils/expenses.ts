/**
 * E2E Expense Utilities
 * Adds expenses through the journal form and removes them again.
 *
 * The suite runs against one shared account that already holds operations,
 * so every helper scopes to the row a test created itself:
 * - descriptions are stable per test, so the keyword mapping a manual
 *   category pick saves is created once and reused on later runs;
 * - amounts are unique per run, so a row is identified by description and
 *   amount together, never by its position in the list.
 */

import { test as base, expect, type Locator, type Page } from '@playwright/test'

export const TIMEOUT = { timeout: 10000 }

export interface CreatedExpense {
  description: string
  amount: number
  /** Category name as the expense card shows it */
  category: string
}

/**
 * Returns an amount that is unique enough to identify this run's row.
 * Three digits keep the card text (`{amount} ₽`) free of digit grouping.
 */
export function uniqueAmount(): number {
  return 101 + Math.floor(Math.random() * 889)
}

/** Parses a rendered ruble amount such as `7 200 ₽`. */
export function parseRubles(text: string | null): number {
  const digits = (text ?? '').replace(/[^\d-]/g, '')
  return digits ? Number(digits) : 0
}

/** The journal form for personal and project operations. */
export function journalForm(page: Page): Locator {
  return page
    .locator('form')
    .filter({ has: page.getByLabel('Сценарий операции') })
}

/** The day total next to the journal heading. */
export function dailyTotal(page: Page): Locator {
  return page
    .getByRole('heading', { name: /^Операции за / })
    .locator('xpath=following-sibling::span[1]')
}

/**
 * Expands the journal on mobile, where widgets sit in a collapsed accordion.
 * On wider layouts the journal has no toggle and this does nothing.
 */
export async function openJournal(page: Page): Promise<void> {
  const toggle = page.getByRole('button', {
    name: 'Журнал расходов',
    expanded: false,
  })
  if (await toggle.isVisible()) {
    await toggle.click()
    await expect(
      page.getByRole('button', { name: 'Журнал расходов', expanded: true })
    ).toBeVisible()
    // Wait for the expand transition, or the panel moves under the pointer.
    await page
      .locator('[data-accordion-content="EXPENSE_LOG"]')
      .evaluate((panel) =>
        Promise.all(
          panel.getAnimations().map((animation) => animation.finished)
        )
      )
  }
  await expect(journalForm(page).getByLabel('Описание расхода')).toBeVisible(
    TIMEOUT
  )
}

/** Reloads the page, retrying when a pending navigation aborts the reload. */
export async function reloadPage(page: Page): Promise<void> {
  await expect(async () => {
    await page.reload()
  }).toPass(TIMEOUT)
}

/**
 * Elements that hold exactly one expense card showing this description and
 * amount: the card itself and any wrapper around that single card. Limiting
 * matches to one delete button keeps a list container from matching when the
 * description and the amount sit on different cards.
 */
export function expenseRows(
  page: Page,
  description: string,
  amount: number
): Locator {
  return page.locator(
    `xpath=//div[.//span[normalize-space()="${description}"]` +
      ` and .//button[@aria-label="edit amount" and normalize-space()="${amount} ₽"]` +
      ` and count(.//button[@aria-label="delete"])=1]`
  )
}

/** The innermost element holding the card: its wrappers come first. */
export function expenseRow(
  page: Page,
  description: string,
  amount: number
): Locator {
  return expenseRows(page, description, amount).last()
}

interface SubmitExpenseOptions {
  tap?: boolean
  clickCount?: number
  /** What to type into the amount field; defaults to the amount itself. */
  amountText?: (amount: number) => string
  /** Submit with Enter in the amount field instead of the button. */
  submitWithEnter?: boolean
}

/**
 * Fills the journal form and submits a personal expense.
 * Accepts a category suggestion when one is shown, otherwise picks the
 * first category explicitly, which saves a mapping for the description.
 */
export async function submitExpense(
  page: Page,
  description: string,
  amount: number,
  options: SubmitExpenseOptions = {}
): Promise<string> {
  const amountText = options.amountText?.(amount) ?? String(amount)
  const form = journalForm(page)
  const descriptionInput = form.getByLabel('Описание расхода')
  const amountInput = form.getByLabel('Сумма расхода')
  const submitButton = form.getByRole('button', {
    name: 'Добавить',
    exact: true,
  })

  await openJournal(page)
  await expect(form.getByLabel('Сценарий операции')).toHaveValue(
    'personal_expense'
  )

  const categorySelect = form.getByLabel('Категория', { exact: true })
  const suggestion = form.getByText('Категория:', { exact: true })
  // The form categorizes on description blur once keyword mappings have
  // loaded. A viewport change can also remount the form and clear it, so
  // fill again until the category step shows.
  await expect(async () => {
    if ((await descriptionInput.inputValue()) !== description) {
      if (options.tap) await descriptionInput.tap()
      await descriptionInput.fill(description)
    }
    if ((await amountInput.inputValue()) !== amountText) {
      if (options.tap) await amountInput.tap()
      await amountInput.fill(amountText)
    }
    await descriptionInput.focus()
    await descriptionInput.blur()
    await expect(categorySelect.or(suggestion)).toBeVisible({ timeout: 1000 })
  }).toPass(TIMEOUT)

  let categoryLabel: string
  if (await categorySelect.isVisible()) {
    await categorySelect.selectOption({ index: 1 })
    await expect(categorySelect).not.toHaveValue('')
    categoryLabel = await categorySelect.evaluate(
      (select: HTMLSelectElement) => select.selectedOptions[0]?.text ?? ''
    )
  } else {
    categoryLabel =
      (await suggestion
        .locator('xpath=following-sibling::span[1]')
        .textContent()) ?? ''
  }

  // Wait for the add server action, so a later reload cannot abort it.
  const saved = page.waitForResponse((response) => {
    const body = response.request().postData() ?? ''
    return (
      response.request().method() === 'POST' &&
      body.includes(description) &&
      body.includes(`"amount":${amount}`)
    )
  })
  if (options.submitWithEnter) await amountInput.press('Enter')
  else if (options.tap) await submitButton.tap()
  else await submitButton.click({ clickCount: options.clickCount ?? 1 })
  expect((await saved).ok()).toBe(true)

  // The form clears once the operation is handed to the mutation.
  await expect(descriptionInput).toHaveValue('', TIMEOUT)

  // Labels read `<emoji> <name>`; the card shows the name only.
  return categoryLabel.trim().split(/\s+/).slice(1).join(' ')
}

/**
 * Deletes this run's row and confirms the deletion reached the server.
 * Reloads first: a freshly added row lives under a temporary id until the
 * server saves it, and deleting that row removes nothing on the server.
 */
export async function deleteExpense(
  page: Page,
  description: string,
  amount: number
): Promise<void> {
  await reloadPage(page)
  await openJournal(page)
  const rows = expenseRows(page, description, amount)
  await expect(rows.last()).toBeVisible(TIMEOUT)

  const dialog = page.getByRole('alertdialog', { name: 'Удалить операцию?' })
  // On mobile the grid can remount after a reload and collapse the journal
  // again, so re-expand it before each attempt to open the delete dialog.
  await expect(async () => {
    await openJournal(page)
    await rows
      .last()
      .getByRole('button', { name: 'delete' })
      .click({ timeout: 2000 })
    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass(TIMEOUT)
  // Wait for the delete server action (its only argument is the expense id)
  // so the reload below cannot abort it.
  const deleted = page.waitForResponse(
    (response) =>
      response.request().method() === 'POST' &&
      /^\["[0-9a-f-]{36}"\]$/.test(response.request().postData() ?? '')
  )
  await dialog.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(rows).toHaveCount(0, TIMEOUT)
  expect((await deleted).ok()).toBe(true)

  await reloadPage(page)
  await openJournal(page)
  await expect(rows).toHaveCount(0)
}

/**
 * Playwright `test` with an `expenses` fixture that adds expenses and
 * removes whatever a test left behind, even when the test failed.
 */
export const test = base.extend<{
  expenses: {
    add: (
      description: string,
      options?: SubmitExpenseOptions & { amount?: number }
    ) => Promise<CreatedExpense>
    remove: (expense: CreatedExpense) => Promise<void>
  }
}>({
  expenses: async ({ page }, provide) => {
    const pending: CreatedExpense[] = []

    await provide({
      add: async (description, options = {}) => {
        await openJournal(page)
        // Pick an amount no visible card shares with this description, so
        // the new row is the only match even when old runs left rows behind.
        let amount = options.amount ?? uniqueAmount()
        while (
          !options.amount &&
          (await expenseRows(page, description, amount).count()) > 0
        ) {
          amount = uniqueAmount()
        }
        await expect(expenseRows(page, description, amount)).toHaveCount(0)
        const category = await submitExpense(page, description, amount, options)
        const created = { description, amount, category }
        pending.push(created)
        await expect(expenseRow(page, description, amount)).toBeVisible(TIMEOUT)
        return created
      },
      remove: async (expense) => {
        await deleteExpense(page, expense.description, expense.amount)
        pending.splice(pending.indexOf(expense), 1)
      },
    })

    for (const expense of pending) {
      await page.goto('/')
      await openJournal(page)
      if (
        (await expenseRows(page, expense.description, expense.amount).count()) >
        0
      ) {
        await deleteExpense(page, expense.description, expense.amount)
      }
    }
  },
})

export { expect }

import {
  test,
  expect,
  type Locator,
  type Page,
  type Response,
} from '@playwright/test'

import {
  getE2ECredentials,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
  SIGNED_OUT_STATE,
} from './utils/auth'
import { expectNoHorizontalScroll } from './utils/viewport-helpers'

const TIMEOUT = { timeout: 10000 }

// This spec signs in through `/login` itself, so it starts signed out.
test.use({ storageState: SIGNED_OUT_STATE })

const BUDGET = 5000
const PURCHASE_AMOUNT = 1500
const TRANSFER_AMOUNT = 700
const USED = PURCHASE_AMOUNT + TRANSFER_AMOUNT
const REMAINING = BUDGET - USED

// Stable descriptions: a manually chosen purchase category is remembered as a
// keyword mapping, so reusing one description keeps reruns from piling up
// mappings. Rows are still unambiguous because they are scoped to the pocket.
const PURCHASE_DESCRIPTION = 'E2E покупка из кармана'
const TRANSFER_DESCRIPTION = 'E2E перевод из кармана'
const JOURNAL_PURCHASE_DESCRIPTION = 'E2E покупка из кармана через журнал'
const JOURNAL_PURCHASE_AMOUNT = 300

/**
 * Matches an amount as the pockets widget renders it:
 * `toLocaleString('ru-RU')` (non-breaking space separators) plus ` ₽`.
 */
function money(amount: number): RegExp {
  const digits = String(Math.abs(amount)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '\\s'
  )
  return new RegExp(`^${amount < 0 ? '-' : ''}${digits}\\s₽$`)
}

/** Matches a history toggle such as `Покупки 1 500 ₽`. */
function historyToggleName(label: string, amount: number): RegExp {
  return new RegExp(`${label}\\s*${money(amount).source.slice(1, -1)}`)
}

test.describe('Pockets', () => {
  test.describe.configure({ mode: 'serial' })

  const credentials = getE2ECredentials()
  const pocketName = `E2E карман ${Date.now()}`

  let page: Page

  test.skip(!credentials, MISSING_E2E_CREDENTIALS_MESSAGE)

  // The scenario writes to one account, so it runs in a single project and
  // covers the mobile layout itself by resizing the viewport.
  test.beforeAll(async ({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'chromium',
      'Pockets scenario runs only in the chromium project'
    )
  })

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage()
    await loginWithCredentials(page, credentials!)
  })

  test.afterAll(async () => {
    await page?.close()
  })

  function pocketRegion(): Locator {
    return page.getByRole('region', { name: `Карман ${pocketName}` })
  }

  /** Selects the scenario pocket and waits until its month is usable. */
  async function openPocket(): Promise<Locator> {
    await page
      .getByLabel('Список карманов')
      .getByRole('button', { name: pocketName, exact: true })
      .click()

    const region = pocketRegion()
    await expect(region).toBeVisible(TIMEOUT)
    await expect(
      region.getByRole('button', { name: 'Добавить покупку' })
    ).toBeEnabled(TIMEOUT)

    return region
  }

  async function expectTotals(
    region: Locator,
    used: number,
    remaining: number
  ): Promise<void> {
    await expect(region.locator('[data-testid^="pocket-used-"]')).toHaveText(
      money(used),
      TIMEOUT
    )
    await expect(
      region.locator('[data-testid^="pocket-remaining-"]')
    ).toHaveText(money(remaining), TIMEOUT)
  }

  async function openHistory(
    region: Locator,
    label: 'Покупки' | 'Переводы',
    total: number
  ): Promise<Locator> {
    const toggle = region.getByRole('button', {
      name: historyToggleName(label, total),
    })
    await expect(toggle).toBeVisible(TIMEOUT)
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
      await toggle.click()
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const history = region.getByLabel(
      label === 'Покупки' ? 'История покупок' : 'История переводов'
    )
    await expect(history).toBeVisible(TIMEOUT)

    return history
  }

  /**
   * The operation-type badge is the labelled span carrying an icon; a transfer
   * row repeats the same text as its category.
   */
  function operationBadge(history: Locator, label: string): Locator {
    return history
      .locator('span')
      .filter({ hasText: label })
      .filter({ has: page.locator('svg') })
  }

  async function deleteOnlyOperation(history: Locator): Promise<void> {
    await expect(history.getByRole('listitem')).toHaveCount(1, TIMEOUT)
    await history.getByRole('button', { name: 'delete' }).click()

    const dialog = page.getByRole('alertdialog', { name: 'Удалить операцию?' })
    await expect(dialog).toBeVisible(TIMEOUT)
    await dialog.getByRole('button', { name: 'Удалить', exact: true }).click()

    await expect(history.getByText('Операций за этот месяц нет.')).toBeVisible(
      TIMEOUT
    )
  }

  test('should create a pocket', async () => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    await expect(
      page.getByRole('heading', { name: 'Карманы', level: 2 })
    ).toBeVisible(TIMEOUT)

    await page.getByRole('button', { name: 'Создать карман' }).click()

    const createForm = page
      .locator('form')
      .filter({ has: page.getByLabel('Название кармана') })
    await createForm.getByLabel('Название кармана').fill(pocketName)

    // The chip appears at once with a temporary id; the server action then
    // returns the real pocket and the list is refetched. Selecting the chip
    // before the refetch selects the temporary id, which vanishes, so wait
    // for the create action and for the refetched list holding the pocket.
    const isServerAction = (response: Response) =>
      response.request().method() === 'POST' &&
      response.request().headers()['next-action'] !== undefined
    let createDone = false
    const created = page.waitForResponse((response) => {
      const done =
        isServerAction(response) &&
        (response.request().postData() ?? '').includes(pocketName)
      if (done) createDone = true
      return done
    })
    // TanStack Query refetches the pocket list through its query function
    // server action, whose arguments carry the `pockets` query key.
    const refetched = page.waitForResponse(
      (response) =>
        createDone &&
        isServerAction(response) &&
        (response.request().postData() ?? '').includes('"queryKey":["pockets"]')
    )
    await createForm.getByRole('button', { name: 'Создать карман' }).click()
    const createResponse = await created
    expect(createResponse.ok(), 'create pocket server action').toBe(true)
    expect((await refetched).ok(), 'pocket list refetch').toBe(true)

    await expect(createForm).toBeHidden(TIMEOUT)
    const chip = page
      .getByLabel('Список карманов')
      .getByRole('button', { name: pocketName, exact: true })
    await expect(chip).toBeVisible(TIMEOUT)

    const region = await openPocket()
    await expect(chip).toHaveAttribute('aria-pressed', 'true')
    await expect(
      region.getByRole('heading', { name: pocketName, level: 3 })
    ).toBeVisible()
    await expectTotals(region, 0, 0)
  })

  test('should change the month budget', async () => {
    const region = pocketRegion()
    const budgetInput = region.getByLabel(`Бюджет кармана ${pocketName}`)

    await expect(budgetInput).toHaveValue('0', TIMEOUT)
    await budgetInput.fill(String(BUDGET))
    await budgetInput.press('Enter')

    await expect(budgetInput).toHaveValue(String(BUDGET), TIMEOUT)
    await expectTotals(region, 0, BUDGET)
  })

  test('should record a purchase', async () => {
    const region = pocketRegion()

    await region.getByRole('button', { name: 'Добавить покупку' }).click()

    const form = region.locator('form')
    await form.getByLabel('Комментарий').fill(PURCHASE_DESCRIPTION)
    await form.getByLabel('Сумма').fill(String(PURCHASE_AMOUNT))
    await expect(form.getByLabel('Дата')).toHaveCount(0)
    // Blurring the description resolves the category: a known keyword
    // suggests one, otherwise the category select appears.
    await form.getByLabel('Сумма').blur()

    const categorySelect = form.getByLabel('Категория покупки')
    const suggestedCategory = form.getByText('Категория:', { exact: true })
    await expect(categorySelect.or(suggestedCategory)).toBeVisible(TIMEOUT)
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 })
      await expect(categorySelect).not.toHaveValue('')
    }

    await form.getByRole('button', { name: 'Добавить покупку' }).click()

    await expect(form).toBeHidden(TIMEOUT)
    await expectTotals(region, PURCHASE_AMOUNT, BUDGET - PURCHASE_AMOUNT)
  })

  test('should record a transfer to expenses', async () => {
    const region = pocketRegion()

    await region.getByRole('button', { name: 'Перевести в расходы' }).click()

    const form = region.locator('form')
    await form.getByLabel('Комментарий').fill(TRANSFER_DESCRIPTION)
    await form.getByLabel('Сумма').fill(String(TRANSFER_AMOUNT))
    await expect(form.getByLabel('Категория покупки')).toHaveCount(0)

    await form.getByRole('button', { name: 'Перевести в расходы' }).click()

    await expect(form).toBeHidden(TIMEOUT)
    // used = purchases + transfers, remaining = budget - used
    await expectTotals(region, USED, REMAINING)
  })

  test('should show purchases and transfers in the history', async () => {
    const region = pocketRegion()

    const purchases = await openHistory(region, 'Покупки', PURCHASE_AMOUNT)
    await expect(purchases.getByRole('listitem')).toHaveCount(1)
    await expect(purchases.getByText(PURCHASE_DESCRIPTION)).toBeVisible()
    await expect(operationBadge(purchases, 'Покупка из кармана')).toBeVisible()
    await expect(
      purchases.getByRole('button', { name: 'edit amount' })
    ).toHaveText(`${PURCHASE_AMOUNT} ₽`)

    const transfers = await openHistory(region, 'Переводы', TRANSFER_AMOUNT)
    await expect(region.getByLabel('История покупок')).toHaveCount(0)
    await expect(transfers.getByRole('listitem')).toHaveCount(1)
    await expect(transfers.getByText(TRANSFER_DESCRIPTION)).toBeVisible()
    await expect(operationBadge(transfers, 'Перевод из кармана')).toBeVisible()
    await expect(
      transfers.getByRole('button', { name: 'edit amount' })
    ).toHaveText(`${TRANSFER_AMOUNT} ₽`)
  })

  test('should keep the budget and operations after reload', async () => {
    await page.reload()

    const region = await openPocket()
    await expect(region.getByLabel(`Бюджет кармана ${pocketName}`)).toHaveValue(
      String(BUDGET),
      TIMEOUT
    )
    await expectTotals(region, USED, REMAINING)

    const purchases = await openHistory(region, 'Покупки', PURCHASE_AMOUNT)
    await expect(purchases.getByText(PURCHASE_DESCRIPTION)).toBeVisible()
    const transfers = await openHistory(region, 'Переводы', TRANSFER_AMOUNT)
    await expect(transfers.getByText(TRANSFER_DESCRIPTION)).toBeVisible()
  })

  test('should show the displayed month and its history row', async () => {
    const region = pocketRegion()
    const now = new Date()
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthName = now.toLocaleDateString('ru-RU', { month: 'long' })
    const monthLabel = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} ${now.getFullYear()}`

    await expect(region.locator('[data-testid^="pocket-period-"]')).toHaveText(
      monthLabel,
      TIMEOUT
    )

    const toggle = region.getByRole('button', { name: /История по месяцам/ })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')

    // The pocket was created in this run, so the current month is its only one.
    const history = region.getByLabel('История кармана по месяцам')
    await expect(history.getByRole('listitem')).toHaveCount(1, TIMEOUT)
    const row = history.getByTestId(`pocket-history-${period}`)
    await expect(row).toContainText(monthLabel)
    await expect(row).toContainText(
      new RegExp(`Остаток\\s${money(REMAINING).source.slice(1, -1)}`)
    )

    await page.setViewportSize({ width: 375, height: 740 })
    await expect(row).toBeVisible()
    await expectNoHorizontalScroll(page)
    await page.setViewportSize({ width: 1280, height: 720 })
    await toggle.click()
  })

  test('should record a purchase from the journal form', async () => {
    let region = pocketRegion()
    const journalForm = page
      .locator('form')
      .filter({ has: page.getByLabel('Сценарий операции') })

    await journalForm
      .getByLabel('Сценарий операции')
      .selectOption({ label: 'Покупка из кармана' })
    // The account may hold other active pockets, so pick this one explicitly.
    await journalForm
      .getByLabel('Карман', { exact: true })
      .selectOption({ label: pocketName })
    await expect(journalForm.getByLabel(/дата/i)).toHaveCount(0)

    await journalForm
      .getByPlaceholder('Описание расхода')
      .fill(JOURNAL_PURCHASE_DESCRIPTION)
    const amountInput = journalForm.getByPlaceholder('Сумма')
    await amountInput.fill(String(JOURNAL_PURCHASE_AMOUNT))
    await amountInput.blur()

    const categorySelect = journalForm.getByLabel('Категория', { exact: true })
    const suggestedCategory = journalForm.getByText('Категория:', {
      exact: true,
    })
    await expect(categorySelect.or(suggestedCategory)).toBeVisible(TIMEOUT)
    if (await categorySelect.isVisible()) {
      await categorySelect.selectOption({ index: 1 })
      await expect(categorySelect).not.toHaveValue('')
    }

    await journalForm
      .getByRole('button', { name: 'Добавить', exact: true })
      .click()

    // The purchases history is collapsed here (the transfers one is open), so
    // the only place showing this description is the journal for the
    // selected date.
    await expect(region.getByLabel('История покупок')).toHaveCount(0)
    await page
      .getByLabel('Фильтр операций')
      .getByRole('button', { name: 'Карманы', exact: true })
      .click()
    // Scope the row to this run's pocket: the journal lists every pocket
    // purchase of the date, and the description is stable across runs.
    await expect(
      page
        .locator('div')
        .filter({ has: page.getByText(JOURNAL_PURCHASE_DESCRIPTION) })
        .filter({ has: page.getByText(`Из кармана: ${pocketName}`) })
        .last()
    ).toBeVisible(TIMEOUT)

    await expectTotals(
      region,
      USED + JOURNAL_PURCHASE_AMOUNT,
      REMAINING - JOURNAL_PURCHASE_AMOUNT
    )

    // The journal shows the purchase optimistically under a temporary id, and
    // deleting that row before the server has saved it removes nothing on the
    // server. Reload so the history holds the saved purchase with its real id.
    await page.reload()
    region = await openPocket()
    await expectTotals(
      region,
      USED + JOURNAL_PURCHASE_AMOUNT,
      REMAINING - JOURNAL_PURCHASE_AMOUNT
    )

    const purchases = await openHistory(
      region,
      'Покупки',
      PURCHASE_AMOUNT + JOURNAL_PURCHASE_AMOUNT
    )
    await expect(purchases.getByRole('listitem')).toHaveCount(2, TIMEOUT)
    const journalPurchase = purchases
      .getByRole('listitem')
      .filter({ hasText: JOURNAL_PURCHASE_DESCRIPTION })
    await expect(journalPurchase).toHaveCount(1)
    await expect(
      journalPurchase.getByRole('button', { name: 'edit amount' })
    ).toHaveText(`${JOURNAL_PURCHASE_AMOUNT} ₽`)

    // Remove the journal purchase so the following steps see the totals and
    // the single purchase they were written for.
    await journalPurchase.getByRole('button', { name: 'delete' }).click()
    const dialog = page.getByRole('alertdialog', { name: 'Удалить операцию?' })
    await expect(dialog).toBeVisible(TIMEOUT)
    await dialog.getByRole('button', { name: 'Удалить', exact: true }).click()

    await expect(purchases.getByRole('listitem')).toHaveCount(1, TIMEOUT)
    await expectTotals(region, USED, REMAINING)

    // The deletion must reach the server, not only the optimistic cache.
    await page.reload()
    region = await openPocket()
    await expectTotals(region, USED, REMAINING)
  })

  test('should give access to the pocket on mobile', async () => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    const widgetList = page.locator('nav[data-testid="mobile-widget-list"]')
    await expect(widgetList).toBeVisible(TIMEOUT)

    // Other widgets also render a `Карманы` button (the operations filter),
    // so take the accordion toggle that sits next to the pockets content.
    const toggle = widgetList.locator(
      'div:has(> [data-accordion-content="POCKETS"]) > button[aria-expanded]'
    )
    await expect(toggle).toHaveAccessibleName('Карманы', TIMEOUT)
    if ((await toggle.getAttribute('aria-expanded')) !== 'true') {
      await toggle.click()
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')

    const content = widgetList.locator('[data-accordion-content="POCKETS"]')
    await expect(
      content.getByRole('heading', { name: 'Карманы', level: 2 })
    ).toBeVisible(TIMEOUT)

    const region = await openPocket()
    await expect(content.getByRole('region')).toHaveAccessibleName(
      `Карман ${pocketName}`
    )
    await expect(region.getByLabel(`Бюджет кармана ${pocketName}`)).toHaveValue(
      String(BUDGET),
      TIMEOUT
    )
    await expectTotals(region, USED, REMAINING)

    const purchases = await openHistory(region, 'Покупки', PURCHASE_AMOUNT)
    await expect(purchases.getByText(PURCHASE_DESCRIPTION)).toBeVisible()

    await expectNoHorizontalScroll(page)
  })

  test('should delete the operations and archive the pocket', async () => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')

    const region = await openPocket()

    const purchases = await openHistory(region, 'Покупки', PURCHASE_AMOUNT)
    await deleteOnlyOperation(purchases)
    await expectTotals(region, TRANSFER_AMOUNT, BUDGET - TRANSFER_AMOUNT)

    const transfers = await openHistory(region, 'Переводы', TRANSFER_AMOUNT)
    await deleteOnlyOperation(transfers)
    await expectTotals(region, 0, BUDGET)

    await region.getByRole('button', { name: 'Архивировать' }).click()
    const dialog = page.getByRole('alertdialog', {
      name: `Архивировать карман «${pocketName}»?`,
    })
    await expect(dialog).toBeVisible(TIMEOUT)
    await dialog
      .getByRole('button', { name: 'Архивировать', exact: true })
      .click()

    await expect(dialog).toBeHidden(TIMEOUT)
    await expect(region.getByText('Архив', { exact: true })).toBeVisible(
      TIMEOUT
    )
    await expect(
      region.getByRole('button', { name: 'Добавить покупку' })
    ).toHaveCount(0)
    await expect(
      page
        .getByLabel('Список карманов')
        .getByRole('button', { name: `${pocketName} · архив`, exact: true })
    ).toBeVisible(TIMEOUT)
  })

  test('should keep an archived pocket read-only and restore it', async () => {
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.reload()

    const pocketList = page.getByLabel('Список карманов')
    const archivedButton = pocketList.getByRole('button', {
      name: `${pocketName} · архив`,
      exact: true,
    })
    await expect(archivedButton).toBeVisible(TIMEOUT)

    // After a reload an archived pocket is never the default selection while
    // an active pocket exists.
    const activeButtons = pocketList
      .getByRole('button')
      .filter({ hasNotText: '· архив' })
    if ((await activeButtons.count()) > 0) {
      await expect(
        pocketList.locator('button[aria-pressed="true"]')
      ).not.toContainText('· архив')
    }

    await archivedButton.click()
    const region = pocketRegion()
    await expect(region.getByText('Архив', { exact: true })).toBeVisible(
      TIMEOUT
    )
    await expect(
      region.getByLabel(`Бюджет кармана ${pocketName}`)
    ).toBeDisabled(TIMEOUT)

    await region.getByRole('button', { name: 'Восстановить' }).click()
    await expect(
      pocketList.getByRole('button', { name: pocketName, exact: true })
    ).toBeVisible(TIMEOUT)
    await expect(
      region.getByRole('button', { name: 'Добавить покупку' })
    ).toBeEnabled(TIMEOUT)
    await expect(region.getByLabel(`Бюджет кармана ${pocketName}`)).toBeEnabled(
      TIMEOUT
    )

    // Leave the scenario pocket archived so reruns do not pile up active ones.
    await region.getByRole('button', { name: 'Архивировать' }).click()
    const dialog = page.getByRole('alertdialog', {
      name: `Архивировать карман «${pocketName}»?`,
    })
    await dialog
      .getByRole('button', { name: 'Архивировать', exact: true })
      .click()
    await expect(archivedButton).toBeVisible(TIMEOUT)
  })
})

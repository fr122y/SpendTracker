import { type Locator, type Page, type Response } from '@playwright/test'

import {
  deleteExpense,
  expect,
  expenseRow,
  expenseRows,
  openJournal,
  reloadPage,
  submitExpense,
  test,
  TIMEOUT,
  uniqueAmount,
} from './utils/expenses'
import { archivePocket, ensureActivePocket } from './utils/pockets'

/**
 * Operations on records the server has not saved yet (T-034): they run once
 * the record has its stored id, a deferred delete survives a reload, and a
 * new pocket opens after it is saved without any server error.
 */

const isServerAction = (method: string, headers: Record<string, string>) =>
  method === 'POST' && headers['next-action'] !== undefined

/** Holds matching server action requests until `release` is called. */
async function holdServerAction(
  page: Page,
  matches: (body: string) => boolean
): Promise<{ release: () => void; held: Promise<void> }> {
  let release!: () => void
  const released = new Promise<void>((resolve) => {
    release = resolve
  })
  let markHeld!: () => void
  const held = new Promise<void>((resolve) => {
    markHeld = resolve
  })
  let used = false
  await page.route(
    () => true,
    async (route) => {
      const request = route.request()
      if (
        !used &&
        isServerAction(request.method(), request.headers()) &&
        matches(request.postData() ?? '')
      ) {
        used = true
        markHeld()
        await released
      }
      await route.continue()
    }
  )
  return { release, held }
}

/** Collects 5xx responses of the app itself. */
function watchServerErrors(page: Page): string[] {
  const errors: string[] = []
  const origin = new URL(page.url() || 'http://localhost').origin
  page.on('response', (response: Response) => {
    const url = response.url()
    if (
      response.status() >= 500 &&
      (url.startsWith(origin) || !url.startsWith('http'))
    ) {
      errors.push(`${response.status()} ${url}`)
    }
  })
  return errors
}

async function confirmDelete(page: Page, row: Locator): Promise<void> {
  const dialog = page.getByRole('alertdialog', { name: 'Удалить операцию?' })
  await expect(async () => {
    await row.getByRole('button', { name: 'delete' }).click({ timeout: 2000 })
    await expect(dialog).toBeVisible({ timeout: 2000 })
  }).toPass(TIMEOUT)
  await dialog.getByRole('button', { name: 'Удалить', exact: true }).click()
  await expect(dialog).toBeHidden(TIMEOUT)
}

/** A fresh amount no visible row of this description uses. */
async function freeAmount(page: Page, description: string): Promise<number> {
  let amount = uniqueAmount()
  while ((await expenseRows(page, description, amount).count()) > 0) {
    amount = uniqueAmount()
  }
  return amount
}

test.describe('Records that are still being saved', () => {
  test('deletes an expense removed before its create returned', async ({
    page,
  }) => {
    test.setTimeout(60_000)
    const description = 'E2E удаление до сохранения'
    await page.goto('/')
    await openJournal(page)
    const amount = await freeAmount(page, description)
    const rows = expenseRows(page, description, amount)

    try {
      // Keep the insert in flight so the delete targets an unsaved record.
      const add = await holdServerAction(
        page,
        (body) =>
          body.includes(description) && body.includes(`"amount":${amount}`)
      )
      const submitted = submitExpense(page, description, amount)
      await add.held
      await expect(expenseRow(page, description, amount)).toBeVisible(TIMEOUT)

      // The delete id is the expense's client id, sent once the insert lands.
      const deleted = page.waitForResponse(
        (response) =>
          isServerAction(
            response.request().method(),
            response.request().headers()
          ) &&
          /^\["[0-9a-f-]{36}"\]$/.test(response.request().postData() ?? ''),
        { timeout: 20_000 }
      )
      await confirmDelete(page, expenseRow(page, description, amount))
      await expect(rows).toHaveCount(0, TIMEOUT)

      add.release()
      await submitted
      expect((await deleted).ok(), 'delete server action').toBe(true)

      await reloadPage(page)
      await openJournal(page)
      await expect(
        page.getByRole('heading', { name: /^Операции за / })
      ).toBeVisible(TIMEOUT)
      await expect(rows).toHaveCount(0, TIMEOUT)
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      if ((await rows.count()) > 0) {
        await deleteExpense(page, description, amount)
      }
    }
  })

  test('keeps a deferred delete when the page reloads inside the undo window', async ({
    page,
    expenses,
  }) => {
    test.setTimeout(60_000)
    await page.goto('/')
    const created = await expenses.add('E2E удаление и перезагрузка')
    const rows = expenseRows(page, created.description, created.amount)

    await confirmDelete(page, rows.last())
    await expect(page.getByText('Расход удалён')).toBeVisible(TIMEOUT)
    await expect(rows).toHaveCount(0, TIMEOUT)

    // Reload well inside the 5 s undo window.
    await reloadPage(page)
    await openJournal(page)
    await expect(rows).toHaveCount(0, TIMEOUT)

    // A second load reads the server state after any resend has finished.
    await page.waitForLoadState('networkidle')
    await reloadPage(page)
    await openJournal(page)
    await expect(
      page.getByRole('heading', { name: /^Операции за / })
    ).toBeVisible(TIMEOUT)
    await expect(rows).toHaveCount(0, TIMEOUT)
  })

  test('opens a pocket created after the only active one was archived', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await page.setViewportSize({ width: 1280, height: 720 })
    await page.goto('/')
    const serverErrors = watchServerErrors(page)
    await expect(
      page.getByRole('heading', { name: 'Карманы', level: 2 })
    ).toBeVisible(TIMEOUT)

    // Pockets cannot be deleted. The first pocket is reused across runs; the
    // second must be created by every run, so each run leaves exactly one
    // more archived «E2E карман (pending-new)».
    const first = 'E2E карман (pending)'
    const second = 'E2E карман (pending-new)'
    const pocketList = page.getByLabel('Список карманов')
    const createForm = page
      .locator('form')
      .filter({ has: page.getByLabel('Название кармана') })
    const chip = (name: string) =>
      pocketList.getByRole('button', { name, exact: true })
    const region = (name: string) =>
      page.getByRole('region', { name: `Карман ${name}` })
    const toArchive = new Set<string>([first, second])

    async function startCreate(name: string) {
      await page.getByRole('button', { name: 'Создать карман' }).first().click()
      await createForm.getByLabel('Название кармана').fill(name)
      // A rapid triple click must still send exactly one create request.
      await createForm
        .getByRole('button', { name: 'Создать карман' })
        .click({ clickCount: 3 })
    }

    try {
      // A retry or an earlier failed run may have left the new pocket active.
      await archivePocket(page, second)
      // Take the reused pocket and archive it again, so the create below
      // follows an archive just like in T-034.
      await ensureActivePocket(page, first)
      await archivePocket(page, first)

      // While the create is in flight the chip is marked and ignores clicks.
      const create = await holdServerAction(page, (body) =>
        body.includes(second)
      )
      let createRequests = 0
      page.on('request', (request) => {
        if (
          isServerAction(request.method(), request.headers()) &&
          (request.postData() ?? '').includes(second)
        ) {
          createRequests += 1
        }
      })
      await startCreate(second)
      await create.held
      const savingChip = chip(`${second} · сохраняется…`)
      await expect(savingChip).toBeDisabled(TIMEOUT)
      await savingChip.dispatchEvent('click')
      await expect(savingChip).toHaveAttribute('aria-pressed', 'false')
      await expect(region(second)).toHaveCount(0)

      create.release()
      await expect(chip(second)).toHaveAttribute(
        'aria-pressed',
        'true',
        TIMEOUT
      )
      await expect(
        region(second).getByRole('button', { name: 'Добавить покупку' })
      ).toBeEnabled(TIMEOUT)

      await page.waitForLoadState('networkidle')
      expect(serverErrors, 'server errors').toEqual([])
      expect(createRequests, 'create pocket requests').toBe(1)
    } finally {
      await page.unrouteAll({ behavior: 'ignoreErrors' })
      // Pockets cannot be deleted; leave both pockets archived.
      for (const name of toArchive) await archivePocket(page, name)
    }
  })
})

/**
 * E2E Pocket Utilities
 *
 * Pockets cannot be deleted, so every created pocket stays in the test
 * account for good. Scenarios therefore reuse one pocket per fixed name: they
 * take the active pocket of that name, restore an archived one, and create it
 * only when the account has never had it.
 */

import { expect, type Locator, type Page } from '@playwright/test'

const TIMEOUT = { timeout: 10000 }

/** How `ensureActivePocket` obtained the pocket. */
export type PocketOrigin = 'active' | 'restored' | 'created'

export function pocketList(page: Page): Locator {
  return page.getByLabel('Список карманов')
}

/** The chip of the active pocket with this exact name. */
export function activePocketChip(page: Page, name: string): Locator {
  return pocketList(page).getByRole('button', { name, exact: true })
}

/** Chips of archived pockets with this exact name; reruns may leave several. */
export function archivedPocketChips(page: Page, name: string): Locator {
  return pocketList(page).getByRole('button', {
    name: `${name} · архив`,
    exact: true,
  })
}

export function pocketRegion(page: Page, name: string): Locator {
  return page.getByRole('region', { name: `Карман ${name}` })
}

/** Waits until the pockets widget has loaded its list. */
export async function waitForPockets(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { name: 'Карманы', level: 2 })
  ).toBeVisible(TIMEOUT)
}

/**
 * Makes the pocket with this name active and selected: an active one is used
 * as is, otherwise an archived one is restored through the UI, and only an
 * account without any such pocket gets a new one. Active names are unique, so
 * there is never more than one active candidate.
 */
export async function ensureActivePocket(
  page: Page,
  name: string
): Promise<PocketOrigin> {
  await waitForPockets(page)
  const active = activePocketChip(page, name)
  const archived = archivedPocketChips(page, name)
  let origin: PocketOrigin = 'active'

  if ((await active.count()) === 0) {
    if ((await archived.count()) > 0) {
      await archived.first().click()
      await pocketRegion(page, name)
        .getByRole('button', { name: 'Восстановить' })
        .click()
      origin = 'restored'
    } else {
      await page.getByRole('button', { name: 'Создать карман' }).first().click()
      const createForm = page
        .locator('form')
        .filter({ has: page.getByLabel('Название кармана') })
      await createForm.getByLabel('Название кармана').fill(name)
      await createForm.getByRole('button', { name: 'Создать карман' }).click()
      await expect(createForm).toBeHidden(TIMEOUT)
      origin = 'created'
    }
  }

  await expect(active).toBeVisible(TIMEOUT)
  await expect(active).toBeEnabled(TIMEOUT)
  await active.click()
  await expect(active).toHaveAttribute('aria-pressed', 'true', TIMEOUT)
  await expect(
    pocketRegion(page, name).getByRole('button', { name: 'Добавить покупку' })
  ).toBeEnabled(TIMEOUT)

  return origin
}

/** Archives the active pocket with this name, if there is one. */
export async function archivePocket(page: Page, name: string): Promise<void> {
  const active = activePocketChip(page, name)
  if ((await active.count()) === 0) return

  const archivedBefore = await archivedPocketChips(page, name).count()
  await active.click()
  await pocketRegion(page, name)
    .getByRole('button', { name: 'Архивировать' })
    .click()
  const dialog = page.getByRole('alertdialog', {
    name: `Архивировать карман «${name}»?`,
  })
  await dialog
    .getByRole('button', { name: 'Архивировать', exact: true })
    .click()
  await expect(active).toHaveCount(0, TIMEOUT)
  await expect(archivedPocketChips(page, name)).toHaveCount(
    archivedBefore + 1,
    TIMEOUT
  )
}

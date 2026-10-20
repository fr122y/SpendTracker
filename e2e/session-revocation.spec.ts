/**
 * Server-side session end (T-064).
 *
 * - A session cookie saved before «Выйти» no longer opens /account when it is
 *   put back into the browser.
 * - A password change ends the account's sessions on other devices and keeps
 *   the current one. The password is changed back at the end.
 *
 * /account checks the session against the database at once; other pages
 * re-check at most every 5 minutes, so they are not asserted here.
 */

import { expect, test, type Page } from '@playwright/test'

import {
  changePasswordOnAccountPage,
  E2E_STORAGE_STATE,
  getTemporaryPassword,
  getE2ECredentials,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
  SIGNED_OUT_STATE,
  type E2ECredentials,
} from './utils/auth'

const TIMEOUT = { timeout: 15000 }
const SESSION_COOKIE = /authjs\.session-token/

test.use({ storageState: SIGNED_OUT_STATE })
test.describe.configure({ mode: 'serial' })

function requireCredentials(): E2ECredentials {
  const credentials = getE2ECredentials()
  if (!credentials) throw new Error(MISSING_E2E_CREDENTIALS_MESSAGE)
  return credentials
}

async function expectAccountPage(page: Page): Promise<void> {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/account$/, TIMEOUT)
  await expect(
    page.getByRole('heading', { name: 'Личный кабинет' })
  ).toBeVisible(TIMEOUT)
}

async function expectLoginPage(page: Page): Promise<void> {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/login\?callbackUrl=%2Faccount/, TIMEOUT)
  await expect(page.getByPlaceholder('Email')).toBeVisible(TIMEOUT)
}

async function submitPasswordChange(
  page: Page,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await expectAccountPage(page)
  await page.getByPlaceholder('Текущий пароль').fill(currentPassword)
  await page.getByPlaceholder('Новый пароль', { exact: true }).fill(newPassword)
  await page.getByPlaceholder('Повторите новый пароль').fill(newPassword)
  await page.getByRole('button', { name: 'Сменить пароль' }).click()
}

/**
 * Puts the original password back, from the current session or, if that
 * session is gone, from a new sign-in with the temporary password.
 */
async function restorePassword(
  page: Page,
  credentials: E2ECredentials,
  temporaryPassword: string
): Promise<void> {
  await page.goto('/account')
  if (/\/login/.test(page.url())) {
    await loginWithCredentials(page, {
      ...credentials,
      password: temporaryPassword,
    })
  }
  await changePasswordOnAccountPage(
    page,
    temporaryPassword,
    credentials.password
  )
}

test('a session cookie saved before sign-out does not open /account', async ({
  context,
  page,
}) => {
  await loginWithCredentials(page, requireCredentials())
  await expectAccountPage(page)
  const savedCookies = (await context.cookies()).filter((cookie) =>
    SESSION_COOKIE.test(cookie.name)
  )
  expect(savedCookies.length).toBeGreaterThan(0)

  await page.getByRole('button', { name: 'Выйти' }).click()
  await expect(page).toHaveURL(/\/login/, TIMEOUT)

  await context.addCookies(savedCookies)
  await expectLoginPage(page)
})

test('a password change ends other sessions and keeps the current one', async ({
  browser,
  page,
}) => {
  const credentials = requireCredentials()
  const temporaryPassword = getTemporaryPassword(credentials)
  const otherDevice = await browser.newContext({
    storageState: SIGNED_OUT_STATE,
  })
  const otherPage = await otherDevice.newPage()

  await loginWithCredentials(page, credentials)
  await loginWithCredentials(otherPage, credentials)
  await expectAccountPage(otherPage)

  let submitted = false
  try {
    await submitPasswordChange(page, credentials.password, temporaryPassword)
    submitted = true
    await expect(page.getByText('Пароль изменён')).toBeVisible(TIMEOUT)

    await expectLoginPage(otherPage)
    await expectAccountPage(page)
  } finally {
    await otherDevice.close()
    if (submitted) {
      await restorePassword(page, credentials, temporaryPassword)
    }
  }

  // Each change ended every earlier session of this account, including the
  // one `auth.setup.ts` saved for the other specs: hand them this one.
  await page.context().storageState({ path: E2E_STORAGE_STATE })
})

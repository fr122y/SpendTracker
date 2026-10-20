/**
 * E2E Auth Utilities
 * Signs in through the credentials form on `/login`.
 *
 * Credentials come from the environment so no account data lives in the repo:
 * - E2E_USER_EMAIL
 * - E2E_USER_PASSWORD
 */

import { expect, type Page } from '@playwright/test'

export interface E2ECredentials {
  email: string
  password: string
}

/**
 * Session saved by `e2e/auth.setup.ts` and loaded by every test project
 */
export const E2E_STORAGE_STATE = 'playwright/.auth/user.json'

/**
 * Storage state for specs that sign in by themselves
 */
export const SIGNED_OUT_STATE = { cookies: [], origins: [] }

export const MISSING_E2E_CREDENTIALS_MESSAGE =
  'Set E2E_USER_EMAIL and E2E_USER_PASSWORD to run authenticated e2e scenarios'

/**
 * Returns the configured e2e credentials, or null when they are not set
 */
export function getE2ECredentials(): E2ECredentials | null {
  const email = process.env.E2E_USER_EMAIL
  const password = process.env.E2E_USER_PASSWORD

  if (!email || !password) return null

  return { email, password }
}

/**
 * Signs in via the login page and waits for the dashboard to open
 */
export async function loginWithCredentials(
  page: Page,
  credentials: E2ECredentials
): Promise<void> {
  await page.goto('/login')

  await page.getByPlaceholder('Email').fill(credentials.email)
  await page.getByPlaceholder('Пароль').fill(credentials.password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()

  await expect(page).not.toHaveURL(/\/login/, { timeout: 10000 })
}

/**
 * Temporary password `e2e/session-revocation.spec.ts` sets while it tests a
 * password change. The spec changes it back; `auth.setup.ts` also does if a
 * run was interrupted in between.
 */
export function getTemporaryPassword(credentials: E2ECredentials): string {
  return `${credentials.password}-T064`
}

/**
 * Tries to sign in; returns false when the login page rejects the password
 */
export async function tryLoginWithCredentials(
  page: Page,
  credentials: E2ECredentials
): Promise<boolean> {
  await page.goto('/login')

  await page.getByPlaceholder('Email').fill(credentials.email)
  await page.getByPlaceholder('Пароль').fill(credentials.password)
  await page.getByRole('button', { name: 'Войти', exact: true }).click()

  return page
    .waitForURL((url) => !url.pathname.startsWith('/login'), {
      timeout: 10000,
    })
    .then(
      () => true,
      () => false
    )
}

/**
 * Changes the password on /account and waits for «Пароль изменён»
 */
export async function changePasswordOnAccountPage(
  page: Page,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  await page.goto('/account')
  await expect(page).toHaveURL(/\/account$/, { timeout: 15000 })
  await page.getByPlaceholder('Текущий пароль').fill(currentPassword)
  await page.getByPlaceholder('Новый пароль', { exact: true }).fill(newPassword)
  await page.getByPlaceholder('Повторите новый пароль').fill(newPassword)
  await page.getByRole('button', { name: 'Сменить пароль' }).click()
  await expect(page.getByText('Пароль изменён')).toBeVisible({
    timeout: 15000,
  })
}

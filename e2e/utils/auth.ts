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

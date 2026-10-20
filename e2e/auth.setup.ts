/**
 * Shared sign-in for the e2e suite.
 *
 * Runs once as the `setup` project, signs in with E2E_USER_EMAIL and
 * E2E_USER_PASSWORD, and saves the session to E2E_STORAGE_STATE. Every other
 * project depends on `setup` and starts with that session. Missing credentials
 * fail the run instead of skipping it.
 */

import { test as setup } from '@playwright/test'

import {
  changePasswordOnAccountPage,
  E2E_STORAGE_STATE,
  getE2ECredentials,
  getTemporaryPassword,
  loginWithCredentials,
  MISSING_E2E_CREDENTIALS_MESSAGE,
  tryLoginWithCredentials,
} from './utils/auth'

setup('sign in the e2e user', async ({ page }) => {
  const credentials = getE2ECredentials()
  if (!credentials) throw new Error(MISSING_E2E_CREDENTIALS_MESSAGE)

  if (!(await tryLoginWithCredentials(page, credentials))) {
    // A run of session-revocation.spec.ts stopped while the account had its
    // temporary password: put the configured one back.
    const temporaryPassword = getTemporaryPassword(credentials)
    if (
      await tryLoginWithCredentials(page, {
        ...credentials,
        password: temporaryPassword,
      })
    ) {
      await changePasswordOnAccountPage(
        page,
        temporaryPassword,
        credentials.password
      )
    }
    await page.context().clearCookies({ name: /authjs\.session-token/ })
    await loginWithCredentials(page, credentials)
  }
  await page.context().storageState({ path: E2E_STORAGE_STATE })
})

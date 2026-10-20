/**
 * The Playwright `test` every e2e file uses. Import `test` and `expect` from
 * here, not from `@playwright/test`.
 *
 * Vercel injects its toolbar script (vercel.live) into Preview pages. That
 * third-party request can hang, and with it the page `load` that `goto` waits
 * for. The `x-vercel-skip-toolbar` header documented for automated tests
 * (https://vercel.com/docs/vercel-toolbar/managing-toolbar) does not stop the
 * `feedback.js` request, so every context aborts vercel.live requests.
 */

import { test as base, type BrowserContext, type Page } from '@playwright/test'

export { expect } from '@playwright/test'

const VERCEL_TOOLBAR = /^https:\/\/vercel\.live\//

/** Aborts Vercel toolbar requests; for pages made with `browser.newPage()`. */
export async function blockVercelToolbar(
  target: BrowserContext | Page
): Promise<void> {
  await target.route(VERCEL_TOOLBAR, (route) => route.abort())
}

export const test = base.extend({
  context: async ({ context }, provide) => {
    await blockVercelToolbar(context)
    await provide(context)
  },
})

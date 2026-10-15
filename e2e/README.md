# E2E Tests

End-to-end tests using Playwright.

## Structure

- `auth.setup.ts` - Shared sign-in (`setup` project, see below)
- `app.spec.ts`, `dashboard.spec.ts`, `expenses.spec.ts`, `layout.spec.ts` -
  Dashboard, journal, and layout scenarios
- `mobile-forms.spec.ts`, `no-horizontal-scroll.spec.ts`,
  `responsive-layout.spec.ts`, `touch-targets.spec.ts`,
  `viewport-resize.spec.ts` - Responsive and mobile checks
- `pockets.spec.ts`, `savings-calculator.spec.ts` - Scenarios with their own
  sign-in
- `utils/auth.ts` - Credentials and login helper
- `utils/expenses.ts` - Expense helper and `expenses` fixture
- `utils/layout.ts` - Read, swap, and restore the server-side desktop layout
- `utils/viewport-helpers.ts` - Responsive assertions

Every file is listed in `.github/e2e-specs.txt` and gated by the `e2e` check
against the Vercel Preview.

## Shared Sign-In

The `setup` project runs `auth.setup.ts` once: it signs in with
`E2E_USER_EMAIL` and `E2E_USER_PASSWORD` and saves the session to
`playwright/.auth/user.json`. Every other project depends on `setup` and
starts signed in. Missing credentials fail the run instead of skipping it.
`pockets.spec.ts` and `savings-calculator.spec.ts` start signed out and sign
in themselves.

## Shared Account Data

All tests run against one test account that already holds operations from
earlier runs and manual use. Tests must not depend on pre-existing account
data: no empty lists, fixed totals, or first-row positions. Compare totals as
before/after deltas and locate only rows the test created.

The `expenses` fixture in `utils/expenses.ts` adds an expense through the
journal form with a stable description and a per-run unique amount, scopes
every lookup to that description and amount, and after the test deletes every
expense it added, even when the test failed. The layout persistence test
restores the original server-side layout after it swaps two widgets.

## Pockets Scenario

`pockets.spec.ts` signs in through `/login` and walks one pocket through its
dashboard flow: create, set the month budget, add a purchase and a transfer,
check the used/remaining totals and both histories, reload, open the pocket in
the mobile accordion, then delete the operations and archive the pocket.

Requirements:

- `E2E_USER_EMAIL` and `E2E_USER_PASSWORD` - credentials of an existing
  email/password user. Without them the scenario is skipped.
- A database with the current schema, including the pockets tables, reachable
  through the app's usual `DATABASE_URL`. The user needs at least one category.
- Use a disposable account: every run leaves one archived pocket (pockets
  cannot be deleted) and may save one keyword mapping for the purchase comment.

The scenario is serial, writes to that single account, and therefore runs only
in the `chromium` project; other projects skip it.

```bash
E2E_USER_EMAIL=... E2E_USER_PASSWORD=... \
  npx playwright test e2e/pockets.spec.ts --project=chromium
```

## Test Coverage

### Smoke Tests

- Page loads with title and header
- Date navigation controls render
- Dashboard widgets render

### Add Expense Flow

- Add expense via form and verify in list
- Form clears after successful submission
- Daily total updates after adding expenses

### Expense Analysis

- Category appears in analysis widget
- Analysis totals update with new expenses

### Data Persistence

- Expenses persist after page reload
- Multiple expenses persist after reload
- Layout configuration persists on the server and is restored

### Date Navigation

- Previous and next day arrows move the header date
- Month picker moves one month back or forward

### Edit Mode

- Toggle edit mode on/off
- Widget titles visible in edit mode

## Running Tests

```bash
# Install browsers first
npx playwright install

# Run tests
npm run test:e2e
```

## Prerequisites

Playwright requires system dependencies. Install with:

```bash
npx playwright install-deps
```

## Test Conventions

- Never rely on pre-existing account data; clean up what a test creates
- Use Russian placeholders and button text for assertions
- Server Action falls back to "Другое" category without AI keys
- 10 second timeouts for async operations

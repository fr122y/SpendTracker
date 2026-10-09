# E2E Tests

End-to-end tests using Playwright.

## Structure

- `app.spec.ts` - Main application tests (Phase 7 verification)
- `pockets.spec.ts` - Authenticated pockets scenario (see below)
- `utils/auth.ts` - Login helper for authenticated scenarios

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
- Month navigation controls render
- Dashboard widgets render (form, weekly budget)

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
- Layout configuration persists

### Month Navigation

- Navigate to previous month
- Navigate to next month

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

- Clear localStorage before each test for clean state
- Use Russian placeholders and button text for assertions
- Server Action falls back to "Другое" category without AI keys
- 10 second timeouts for async operations

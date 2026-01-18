# E2E Tests

End-to-end tests using Playwright.

## Structure

- `app.spec.ts` - Main application tests (Phase 7 verification)

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

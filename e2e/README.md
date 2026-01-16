# E2E Tests

End-to-end tests using Playwright.

## Structure

- `app.spec.ts` - Main application tests
- `*.spec.ts` - Feature-specific test files

## Running Tests

```bash
npm run test:e2e
```

## Test Conventions

- Use descriptive test names in Russian where applicable
- Test user flows, not implementation details
- Mock external services (AI, APIs) for deterministic tests

# Test Utilities

Shared testing utilities for feature tests.

## expense-form-helpers.tsx

Reusable test helpers for ExpenseForm and ProjectExpenseForm tests.

### Exports

#### Mock Data

- `mockCategories` - Standard category list for tests
- `mockSelectedDate` - Fixed date for consistent testing
- `testExpenseData` - Common test data sets (simple, project, fallback)
- `mockCategoryResponses` - AI categorization responses (groceries, other)

#### Test Setup

- `createTestWrapper()` - Creates QueryClient wrapper with retry disabled
- `setupExpenseFormMocks()` - Sets up query-hook mocks plus legacy store aliases

#### Form Helpers

- `getFormElements(screen)` - Returns {descriptionInput, amountInput, submitButton}
- `fillExpenseForm(screen, fireEvent, data)` - Fills form inputs
- `submitExpenseForm(screen, fireEvent)` - Clicks submit button
- `fillAndSubmitForm(screen, fireEvent, data)` - Combined fill + submit action

#### Testing Utilities

- `createDelayedResolver<T>()` - Creates promise with manual resolver for loading state tests

## Benefits

- Reduces test code duplication
- Ensures consistent test data across similar tests
- Centralizes test setup logic

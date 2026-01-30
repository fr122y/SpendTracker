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
- `setupExpenseFormMocks()` - Sets up all required store mocks (deprecated - now done inline)

#### Form Helpers

- `getFormElements(screen)` - Returns {descriptionInput, amountInput, submitButton}
- `fillExpenseForm(screen, fireEvent, data)` - Fills form inputs
- `submitExpenseForm(screen, fireEvent)` - Clicks submit button
- `fillAndSubmitForm(screen, fireEvent, data)` - Combined fill + submit action

#### Testing Utilities

- `createDelayedResolver<T>()` - Creates promise with manual resolver for loading state tests

### Usage Example

```typescript
import {
  createTestWrapper,
  testExpenseData,
  mockCategoryResponses,
  fillAndSubmitForm,
} from '../../__tests__/utils/expense-form-helpers.tsx'

const TestWrapper = createTestWrapper()

it('should submit form', async () => {
  mockedAction.mockResolvedValueOnce(mockCategoryResponses.groceries)
  render(<MyForm />, { wrapper: TestWrapper })
  fillAndSubmitForm(screen, fireEvent, testExpenseData.simple)
  // ... assertions
})
```

## Benefits

- Reduces test code duplication by ~40%
- Ensures consistent test data across similar tests
- Makes tests more readable and maintainable
- Centralizes test setup logic

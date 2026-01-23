# Manage Salaries Feature

Provides a form interface for managing salary and advance payment day settings. This feature allows users to configure which days of the month they receive their salary and advance payments.

## Public API (`index.ts`)

- `SalaryForm`: Form component for editing salary and advance day settings with validation and success feedback.

## State & Data

- **Store:** Uses `useSettingsStore` from `@/entities/settings` (Reatom-based with localStorage persistence)
- **Persistence Keys:**
  - `smartspend-settings-salaryDay`
  - `smartspend-settings-advanceDay`
- **Actions:**
  - `setSalaryDay(day: number)`: Updates the salary payment day (1-31)
  - `setAdvanceDay(day: number)`: Updates the advance payment day (1-31)

## Features

- **Real-time Validation**: Enforces day range (1-31) with client-side validation
- **Success Feedback**: Shows confirmation message for 3 seconds after successful save
- **Form Validation**: Submit button is disabled when values are invalid
- **Accessibility**: Proper label associations and keyboard navigation support

## Dependencies

- Uses: `@/entities/settings` (Settings store)
- Uses: `@/shared/ui` (Button, Input components)

## Usage Example

```tsx
import { SalaryForm } from '@/features/manage-salaries'

export function SettingsPage() {
  return (
    <div>
      <h2>Финансовые настройки</h2>
      <SalaryForm />
    </div>
  )
}
```

## Validation Rules

- Salary day must be between 1 and 31
- Advance day must be between 1 and 31
- Both fields are required
- Form cannot be submitted with empty or invalid values

## Test Coverage

Comprehensive test suite covers:
- Component rendering with store data
- User input interactions
- Form submission and store updates
- Validation rules and boundary cases
- Success message display and timeout
- Accessibility features

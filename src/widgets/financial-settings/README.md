# Financial Settings Widget

Wrapper widget for financial configuration parameters.

## Public API (`index.ts`)

- `FinancialSettingsSection`: Wrapper around FinancialSettings entity component

## State & Data

- Delegates to `FinancialSettings` from `@/entities/settings`
- **Store:** Uses `useSettingsStore` (Persistence Key: `smartspend-settings`)

## Features

- Header with section title
- Salary day configuration
- Advance day configuration
- Weekly limit setting

## Dependencies

- Uses: `@/entities/settings`

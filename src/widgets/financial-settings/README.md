# Financial Settings Widget

Wrapper widget for financial configuration parameters.

## Public API (`index.ts`)

- `FinancialSettingsSection`: Wrapper around the FinancialSettings entity component

## State & Data

- Delegates to `FinancialSettings` from `@/entities/settings`
- `useSettings` / `useUpdateSettings` provide the DB-backed state and mutation

## Features

- Header with section title
- Salary day configuration
- Advance day configuration
- Weekly limit setting

## Dependencies

- Uses: `@/entities/settings`

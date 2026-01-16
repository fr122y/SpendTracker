# Financial Settings Widget

Configures financial parameters like salary day and spending limits.

## Public API (`index.ts`)

- `FinancialSettingsWidget`: Settings form for financial configuration

## State & Data

- **Store:** Uses `useSettingsStore` (Persistence Key: `smartspend-settings`)
- **Actions:** Update salary day, spending limits, budget parameters

## Dependencies

- Uses: `@/shared/ui`, `@/shared/lib`

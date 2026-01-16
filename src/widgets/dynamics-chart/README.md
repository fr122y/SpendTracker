# Dynamics Chart Widget

Visualizes spending trends over time with line/bar charts.

## Public API (`index.ts`)

- `DynamicsChartWidget`: Time-series chart showing expense dynamics

## State & Data

- **Store:** Reads from `useExpenseStore`
- **Actions:** Chart type toggle, time range adjustment

## Dependencies

- Uses: `@/entities/expense`, `@/shared/lib`

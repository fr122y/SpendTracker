# Increase Test Coverage

For each file below, call `test-implementer` agent with isolated context.

## Files to Test

### Entities

1. `src/entities/settings/model/settings-store.ts`
2. `src/entities/bucket/model/bucket-store.ts`
3. `src/entities/project/model/project-store.ts`

### Features

4. `src/features/manage-salaries/model/salary-store.ts`
5. `src/features/manage-salaries/ui/salary-form.tsx`
6. `src/features/manage-salaries/ui/advance-form.tsx`

### Widgets

7. `src/widgets/weekly-budget/ui/weekly-budget.tsx`
8. `src/widgets/expense-log/ui/expense-log.tsx`
9. `src/widgets/dynamics-chart/ui/daily-spending-chart.tsx`
10. `src/widgets/analysis/ui/analysis-dashboard.tsx`
11. `src/widgets/projects/ui/projects-section.tsx`

## Execution

For each file (1-11):

```
Launch test-implementer agent:
"Add tests for [FILE_PATH]. Read file, create tests, verify they pass."
```

Wait for agent completion before starting next file.

## After All Complete

Run: `npm test -- --coverage`

Target: all metrics ≥ 70%

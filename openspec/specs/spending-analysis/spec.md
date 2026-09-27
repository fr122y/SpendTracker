# Spending Analysis

## Purpose

Describe the current monthly spending analysis shown on the dashboard.

## Requirements

### Requirement: Analyze expenses for the selected month

The analysis MUST use the month and year from the selected dashboard date. It MUST include expense operations dated within that month and exclude other operation types.

#### Scenario: Show the selected month

- GIVEN the dashboard has a selected date
- WHEN the analysis is rendered
- THEN its heading shows that date's month and year
- AND its category totals use expenses from that month only

### Requirement: Filter analysis by expense scope

The analysis MUST provide `all`, `personal`, and `shared` scopes. `all` includes personal, project-linked, and shared-budget expenses. `personal` includes expenses without a `sharedBudgetId`, including project-linked expenses. `shared` includes expenses with a `sharedBudgetId`. The selected scope MUST determine the total and category statistics.

#### Scenario: Show all expense scopes

- GIVEN the selected month contains personal, project-linked, and shared-budget expenses
- WHEN the `all` scope is selected
- THEN all three kinds of expense contribute to the analysis

#### Scenario: Show personal scope

- GIVEN the selected month contains personal, project-linked, and shared-budget expenses
- WHEN the `personal` scope is selected
- THEN personal and project-linked expenses contribute to the analysis
- AND shared-budget expenses are excluded

#### Scenario: Show shared scope

- GIVEN the selected month contains personal, project-linked, and shared-budget expenses
- WHEN the `shared` scope is selected
- THEN shared-budget expenses contribute to the analysis
- AND personal and project-linked expenses are excluded

### Requirement: Group spending by category

The analysis MUST combine included expenses with the same category, show each category's share of the included total as a percentage, and order categories by amount from highest to lowest.

#### Scenario: Combine category amounts

- GIVEN the selected month and scope include multiple expenses in one category
- WHEN category statistics are calculated
- THEN their amounts contribute to one category total
- AND the category percentage is based on the total for the selected scope
- AND categories are ordered by descending amount

### Requirement: Show an empty state when there is no spending data

The analysis MUST show an empty state when no expense operations match the selected month and scope.

#### Scenario: No matching expenses

- GIVEN no expense operations match the selected month and scope
- WHEN the analysis is rendered
- THEN it shows `Нет данных за этот месяц`

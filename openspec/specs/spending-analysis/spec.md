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

### Requirement: Open read-only details from an analysis category

The analysis MUST let a user activate a category and open its expense details for the same selected month and scope. The details MUST appear as a centered dialog on desktop and a full-screen dialog on a phone. Closing the dialog MUST return to the analysis without changing its month or scope.

#### Scenario: Open details from a category

- **GIVEN** the analysis shows a category for the selected month and scope
- **WHEN** the user activates that category
- **THEN** the dialog shows the expenses that contributed to that category in the same month and scope
- **AND** the analysis month and scope remain unchanged

#### Scenario: Open category details with a keyboard

- **GIVEN** the user has keyboard focus on an analysis category
- **WHEN** the user activates the category with the keyboard
- **THEN** the same expense-details dialog opens

#### Scenario: Use the dialog on a phone

- **GIVEN** the analysis is open on a phone-sized viewport
- **WHEN** the user activates a category
- **THEN** the details dialog fills the viewport

#### Scenario: Close details and return to analysis

- **GIVEN** category details are open
- **WHEN** the user closes the dialog
- **THEN** the analysis is visible with its prior month and scope

### Requirement: Show matching expenses as read-only daily groups

The details MUST contain only `expense` operations for the activated category, selected month, and inherited scope. The `personal` scope MUST continue to include project-linked expenses without a `sharedBudgetId`; transfers and project movements MUST be excluded. Expenses MUST be grouped by date with the newest date first, preserve their stored descriptions and amounts, and provide no edit or delete action.

#### Scenario: Keep the category, month, and scope filters

- **GIVEN** visible expenses from different categories, months, and scopes
- **WHEN** the user opens one category's details
- **THEN** only expenses matching that category, month, and scope appear

#### Scenario: Include project expenses in personal scope

- **GIVEN** the base analysis uses `personal` scope and the selected month contains personal, project-linked, and shared expenses in the category
- **WHEN** the user opens the category details
- **THEN** personal and project-linked expenses appear
- **AND** shared expenses do not appear

#### Scenario: Exclude project movements

- **GIVEN** the selected month contains project withdrawal or return operations
- **WHEN** category details are formed
- **THEN** those operations do not appear as expenses

#### Scenario: Group matching expenses by descending date

- **GIVEN** matching expenses exist on several dates
- **WHEN** the detail list is displayed
- **THEN** expenses are grouped under their date
- **AND** date groups are ordered from newest to oldest

#### Scenario: Keep detail rows read-only

- **GIVEN** expense rows appear in category details
- **WHEN** the user views or activates a row
- **THEN** the row exposes no edit or delete action
- **AND** its original description and amount remain unchanged

### Requirement: Group similar expense descriptions for filtering

The details MUST derive name groups from descriptions in the unfiltered base set for that category, month, and scope. Names that differ only by case or surrounding whitespace MUST normalize to the same name. The descriptions `столовка`, `столовая`, and `столорка` MUST appear in one automatic group. A group MUST show a count of its distinct normalized variants and an accessible way to inspect those variants. By default, the most frequent existing trimmed spelling is the display label; ties MUST resolve deterministically by normalized name and then source spelling. If normalization produces an empty name, the group MUST display `Без описания` while keeping the source description and filtering behavior unchanged. Grouping MUST NOT change stored descriptions or amounts.

#### Scenario: Group the agreed spelling variants

- **GIVEN** the base set contains expenses named `столовка`, `столовая`, and `столорка`
- **WHEN** name groups are formed
- **THEN** all three names belong to one group
- **AND** the group label is one of the existing descriptions
- **AND** the user can inspect the descriptions represented by the group

#### Scenario: Normalize case and surrounding whitespace

- **GIVEN** the base set contains descriptions differing only by letter case or surrounding whitespace
- **WHEN** name groups are formed
- **THEN** those descriptions belong to the same exact-normalized name

#### Scenario: Show an empty-name placeholder without changing source descriptions

- **GIVEN** the base set contains an expense whose description is empty or whitespace-only
- **WHEN** name groups are formed and displayed
- **THEN** the group is labeled `Без описания`
- **AND** the original description remains unchanged in the expense data
- **AND** selecting the group filters the source expense correctly

#### Scenario: Keep distinct words and number variants separate

- **GIVEN** descriptions contain different words such as `оплата такси` and `оплата связи`, `кофе большой` and `кофе дорогой`, or different numeric tokens such as `столовая 1` and `столовая 2`
- **WHEN** name groups are formed
- **THEN** the distinct words or numbers are not merged by fuzzy matching

#### Scenario: Build groups before applying name filters

- **GIVEN** a user has already selected one or more name groups
- **WHEN** the detail view computes the available groups
- **THEN** the groups still represent the full base set before name filtering

### Requirement: Filter details by selectable name groups

The details MUST show selectable name-group chips, initially show eight groups, and let the user expand or collapse the list. Selected groups MUST remain visible while the list is collapsed. Selecting multiple groups MUST filter by OR and update immediately; with no groups selected, all base expenses MUST be shown. The details MUST show the filtered expense count and sum relative to the base category count and sum. A base set with no expenses and a selected-name filter with no matches MUST have distinct empty states.

#### Scenario: Expand and collapse name groups

- **GIVEN** more than eight name groups are available
- **WHEN** the user expands or collapses the chip list
- **THEN** the list shows all groups or the initial eight groups
- **AND** any selected groups remain visible while collapsed

#### Scenario: Filter by multiple groups with OR

- **GIVEN** the user selects two or more name groups
- **WHEN** the detail view updates
- **THEN** it shows expenses whose descriptions belong to any selected group
- **AND** the filtered count and sum update immediately

#### Scenario: Show all base expenses with no selected groups

- **GIVEN** no name groups are selected
- **WHEN** the detail view updates
- **THEN** all expenses in the base category, month, and scope are shown
- **AND** filtered count and sum equal the base category count and sum

#### Scenario: Reset name selection when the base changes

- **GIVEN** one or more name groups are selected
- **WHEN** the dialog closes or its category, month, or scope changes
- **THEN** the name selection is cleared
- **AND** the analysis month and scope themselves remain unchanged by closing

#### Scenario: Distinguish empty states

- **GIVEN** either the base category has no matching expenses or a selected-name filter has no matches
- **WHEN** the detail view renders
- **THEN** it shows the empty state for that specific condition

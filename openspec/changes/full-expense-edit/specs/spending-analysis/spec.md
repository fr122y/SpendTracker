# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Show matching expenses as read-only daily groups`
- TO: `### Requirement: Show matching expenses as editable daily groups`

## MODIFIED Requirements

### Requirement: Show matching expenses as editable daily groups

The details MUST contain only `expense` operations for the activated category, selected month, and inherited scope. The `personal` scope MUST continue to include project-linked expenses without a `sharedBudgetId`; transfers and project movements MUST be excluded. Expenses MUST be grouped by date with the newest date first, and preserve their stored descriptions and amounts. Activating a row MUST open the expense editor for that record; rows MUST NOT offer a delete action. While the editor is open, Escape and outside clicks MUST close only the editor.

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
- **WHEN** the user views a row
- **THEN** the row itself exposes no inline edit or delete action
- **AND** its original description and amount remain unchanged
- **WHEN** the user activates the row
- **THEN** the expense editor opens for that record above the details
- **AND** closing the editor returns to the same details

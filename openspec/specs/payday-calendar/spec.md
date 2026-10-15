# payday-calendar Specification

## Purpose

Календарь отмечает дни зарплаты и аванса в каждом месяце и позволяет понятно изменить эти дни.

## Requirements

### Requirement: Mark payday on the clamped day of each month

The calendar MUST mark the salary day and the advance day of the shown month on day `min(saved day, number of days in that month)`. A saved day beyond the end of a short month MUST be marked on the last day of that month. The marker MUST NOT move off a weekend. When the salary day and the advance day fall on the same day of the shown month, including after clamping, that day MUST show both markers and its accessible name MUST name both («Зарплата и аванс»).

#### Scenario: Salary day 31 in a 30-day month

- **GIVEN** the salary day is 31
- **WHEN** the calendar shows November
- **THEN** November 30 is marked as the salary day

#### Scenario: Salary day 31 in February

- **GIVEN** the salary day is 31
- **WHEN** the calendar shows February of a non-leap year
- **THEN** February 28 is marked as the salary day

#### Scenario: Payday on a weekend

- **GIVEN** the advance day falls on a Saturday in the shown month
- **WHEN** the calendar is rendered
- **THEN** that Saturday is marked as the advance day

#### Scenario: Salary and advance clamp to the same day

- **GIVEN** the salary day is 31 and the advance day is 30
- **WHEN** the calendar shows November
- **THEN** November 30 shows both the salary and the advance marker
- **AND** its accessible name is «30, Зарплата и аванс»

#### Scenario: Salary and advance saved on the same day

- **GIVEN** the salary day and the advance day are both 15
- **WHEN** the calendar is rendered
- **THEN** day 15 shows both markers

### Requirement: Edit payday with visible range and validation

The salary and advance day editor MUST keep its label visible while editing, MUST show the valid range 1–31, and MUST show how to save (Enter) and cancel (Escape). A value that is not an integer from 1 to 31 MUST show an error and MUST NOT be saved or silently replaced. The server MUST reject a salary or advance day that is not an integer from 1 to 31.

#### Scenario: Out-of-range input

- **GIVEN** the user edits the salary day
- **WHEN** the user enters 35 and presses Enter
- **THEN** an error about the range 1–31 is shown
- **AND** the salary day is not saved

#### Scenario: Valid input

- **GIVEN** the user edits the advance day
- **WHEN** the user enters 20 and presses Enter
- **THEN** the advance day is saved as 20

#### Scenario: Server rejects an invalid day

- **WHEN** the settings action receives a salary day of 0 or 32
- **THEN** it fails without updating the settings

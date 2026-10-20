# Spec Delta

## ADDED Requirements

### Requirement: Show money amounts in the Russian format

Every displayed money amount MUST use the ru-RU format: a non-breaking space between thousands, a comma before kopecks, and a `₽` suffix. Kopecks MUST be shown with two digits when they are not zero and MUST be omitted otherwise. An amount put into an editable field MUST use a comma before kopecks and no thousands separator; the field MUST keep accepting both `,` and `.`.

#### Scenario: Journal row and delete confirmation

- **GIVEN** an expense of 350.5 rubles
- **WHEN** the journal shows it and the user asks to delete it
- **THEN** the row shows `350,50 ₽` and the confirmation names `350,50 ₽`

#### Scenario: Whole amount

- **WHEN** an amount of 1234 rubles is shown
- **THEN** it reads `1 234 ₽`

#### Scenario: Edit field

- **WHEN** the user starts editing an amount of 123.45 rubles
- **THEN** the field holds `123,45`

### Requirement: Name expense row buttons in Russian

The amount button and the delete button of an expense row MUST have the accessible names «Изменить сумму» and «Удалить операцию».

#### Scenario: Screen reader names

- **WHEN** a screen reader reads an expense row
- **THEN** it announces «Изменить сумму» and «Удалить операцию»

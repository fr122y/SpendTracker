# Spec Delta

## Purpose

Позволяет пользователю задавать категории месячного распределения дохода денежной суммой или процентом и проверять рассчитанные суммы, остаток и превышение дохода.

## ADDED Requirements

### Requirement: Edit allocation categories by percentage or amount

The widget MUST keep percentage and amount fields editable for every allocation category. Editing either field MUST update the other field and save which field was last edited as that category's basis. Percentage-based categories MUST retain their percentage when income changes; amount-based categories MUST retain their exact amount when income changes. Editing the other field MUST switch that category's basis. A plan MUST support both bases at once.

#### Scenario: Enter a percentage

- **WHEN** the user enters 20% for a category with monthly income of 80,000 ₽
- **THEN** the category amount is 16,000 ₽
- **AND** the category retains percentage as its basis

#### Scenario: Enter an amount

- **WHEN** the user enters 15,000 ₽ for a category with monthly income of 80,000 ₽
- **THEN** the category percentage is displayed as 18.75%
- **AND** the category retains 15,000 ₽ as its amount basis

#### Scenario: Preserve mixed bases when income changes

- **GIVEN** a 20% category and a 15,000 ₽ amount-based category
- **WHEN** monthly income changes from 80,000 ₽ to 100,000 ₽
- **THEN** their amounts are 20,000 ₽ and 15,000 ₽ respectively
- **AND** the amount-based category percentage is 15%

#### Scenario: Keep the basis after reload

- **GIVEN** a category whose last edited field was its amount
- **WHEN** the user reloads the widget
- **THEN** the amount remains exact and is still the category's basis

### Requirement: Preserve currency precision and format calculated percentages

The widget MUST accept and retain monetary amounts to the nearest kopeck. Calculated monetary values MUST be rounded to kopecks. A displayed calculated percentage MUST use no more than two decimal places and MUST omit trailing zeroes; display rounding MUST NOT change the category's stored basis or value.

#### Scenario: Display a rounded percentage without changing the amount

- **WHEN** the user enters 10,000 ₽ with monthly income of 73,000 ₽
- **THEN** the widget displays 13.7%
- **AND** retains 10,000 ₽ as the category amount

#### Scenario: Calculate fractional kopecks from a percentage

- **WHEN** a percentage-based category produces a fraction of a kopeck
- **THEN** its displayed and saved calculated amount is rounded to the nearest kopeck

### Requirement: Support amount allocation without a positive income

The widget MUST allow the user to enter and save an amount-based category when income is zero or unset. Its percentage MUST display `—` until income is positive, then display the calculated percentage without changing the saved amount.

#### Scenario: Enter an amount with no income

- **GIVEN** monthly income is zero or unset
- **WHEN** the user enters an amount for a category
- **THEN** the amount is saved
- **AND** the percentage displays `—`

#### Scenario: Show the percentage after income is entered

- **GIVEN** an amount-based category and zero income
- **WHEN** the user enters positive monthly income
- **THEN** the category percentage is calculated from its saved amount
- **AND** its saved amount remains unchanged

### Requirement: Save and explain plans that exceed income

The widget MUST save valid non-negative finite allocation edits even when allocated amounts exceed income. It MUST display the exact overage and show the «Операции» remainder as a negative amount equal to that overage. Reducing income below an existing allocation MUST have the same behavior; the plan MUST NOT be reduced automatically.

#### Scenario: Directly enter an amount that exceeds income

- **GIVEN** monthly income is 10,000 ₽
- **WHEN** the user enters 15,000 ₽ for a category
- **THEN** the 15,000 ₽ amount is saved
- **AND** the widget warns that allocation exceeds income by 5,000 ₽
- **AND** «Операции» shows −5,000 ₽

#### Scenario: Directly enter percentages whose total exceeds income

- **GIVEN** a plan whose current allocations fit within income
- **WHEN** the user edits a percentage so total allocation exceeds 100%
- **THEN** the percentage is saved
- **AND** the widget warns with the exact monetary overage
- **AND** «Операции» shows the same negative remainder

#### Scenario: Reduce income below the saved plan

- **GIVEN** a category with a fixed amount of 15,000 ₽
- **WHEN** income is reduced to 10,000 ₽
- **THEN** income and the category amount are saved unchanged
- **AND** the widget warns that allocation exceeds income by 5,000 ₽
- **AND** «Операции» shows −5,000 ₽

### Requirement: Preserve existing percentage allocations

Categories created before this change MUST continue to use their saved percentage as their basis and MUST calculate the same amounts as before the change.

#### Scenario: Load an existing category

- **GIVEN** a category saved before amount allocation is available
- **WHEN** the user opens the widget
- **THEN** its saved percentage remains unchanged
- **AND** its calculated amount matches the previous percentage-based behavior

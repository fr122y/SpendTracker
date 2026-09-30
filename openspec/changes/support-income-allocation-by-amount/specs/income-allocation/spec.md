# Spec Delta

## Purpose

Позволяет задавать категории месячного распределения процентом или вводить сумму, из которой для текущего дохода рассчитывается процент.

## ADDED Requirements

### Requirement: Keep percentage as the canonical allocation value

The widget MUST keep percentage as the only canonical saved allocation value. The percentage and amount fields MUST remain available together. Editing the percentage MUST save that percentage. Editing the amount MUST calculate and save its full-precision percentage for the current positive income. When income changes, the saved percentage MUST remain unchanged and the amount MUST be recalculated from it.

#### Scenario: Enter a percentage

- **WHEN** the user enters 20% for a category with monthly income of 80,000 ₽
- **THEN** the category amount is 16,000 ₽
- **AND** 20% remains its canonical value

#### Scenario: Enter an amount

- **WHEN** the user enters 15,000 ₽ for a category with monthly income of 80,000 ₽
- **THEN** the canonical percentage becomes 18.75%
- **AND** the amount is calculated from that percentage

#### Scenario: Preserve percentage when income changes

- **GIVEN** a category with canonical percentage 18.75% and monthly income of 80,000 ₽
- **WHEN** monthly income changes to 100,000 ₽
- **THEN** its amount becomes 18,750 ₽
- **AND** its percentage remains 18.75%

#### Scenario: Preserve an existing fixed-amount allocation during conversion

- **GIVEN** a legacy category with saved amount 15,000 ₽ and positive current income of 80,000 ₽
- **WHEN** the server converts that category to the canonical percentage model
- **THEN** its canonical percentage is derived from the legacy amount and current income before the old amount basis is cleared
- **AND** the current calculated amount remains 15,000 ₽ to the nearest kopeck

### Requirement: Preserve currency precision and format percentages for display

The widget MUST accept monetary input to the nearest kopeck and round calculated money once to the nearest kopeck. The percentage derived from an amount MUST retain enough precision to reproduce that amount after persistence. A displayed percentage MUST use at most two decimal places and omit trailing zeroes. Display rounding MUST NOT alter the canonical percentage. Percentage storage MUST preserve the precision needed by the amount-to-percentage conversion.

#### Scenario: Display a rounded percentage without changing the calculated amount

- **WHEN** the user enters 10,000 ₽ with monthly income of 73,000 ₽
- **THEN** the widget displays 13.7%
- **AND** its calculated amount remains 10,000 ₽

#### Scenario: Persist precision for a fractional-ruble allocation

- **WHEN** the user enters 333,333.33 ₽ with monthly income of 1,000,000 ₽
- **THEN** the saved percentage retains enough precision to calculate 333,333.33 ₽ after reload
- **AND** percentage storage does not reduce the result by a kopeck

### Requirement: Handle zero income and over-budget plans

When income is zero or unset, the amount input MUST be disabled with an explanation, the percentage input MUST remain editable, and each calculated category amount MUST be zero. The widget MUST save valid finite non-negative percentage edits even when their sum exceeds 100%. It MUST show the exact monetary overage and the same negative remainder for «Операции». Reducing income below the existing percentage plan MUST preserve percentages and recalculate the warning without clamping allocations.

#### Scenario: Disable amount input with no income

- **GIVEN** monthly income is zero or unset
- **WHEN** the user opens the widget
- **THEN** the amount input is disabled with an explanation
- **AND** the percentage input remains editable
- **AND** the calculated amount is zero

#### Scenario: Save percentage allocations above income

- **GIVEN** monthly income is 100,000 ₽
- **WHEN** the user enters 95% and another category already has 10%
- **THEN** the 105% allocation is saved
- **AND** the widget warns that allocation exceeds income by 5,000 ₽
- **AND** «Операции» shows −5,000 ₽

#### Scenario: Reduce income below the saved plan

- **GIVEN** a category with canonical percentage of 150% and income of 10,000 ₽
- **WHEN** income is reduced to 8,000 ₽
- **THEN** the category remains at 150% and calculates to 12,000 ₽
- **AND** the widget warns that allocation exceeds income by 4,000 ₽
- **AND** «Операции» shows −4,000 ₽

### Requirement: Preserve existing percentage allocations

Categories already saved as percentages MUST retain their saved percentage and calculate the same amounts, rounded to kopecks, after this change. Legacy fixed-amount rows MUST be converted using their current amount and positive current salary before salary changes or replacement saves can discard their old basis. If a legacy fixed-amount row has no positive salary, the server MUST fail closed and MUST NOT replace its amount with zero or an invented percentage.

#### Scenario: Load an existing percentage category

- **GIVEN** a category saved before this change with percentage 20%
- **WHEN** the user opens the widget with income of 80,000 ₽
- **THEN** its percentage remains 20%
- **AND** its amount is 16,000 ₽

#### Scenario: Refuse unsafe legacy conversion

- **GIVEN** a legacy fixed-amount category and no positive saved salary
- **WHEN** the server attempts to convert or overwrite that category
- **THEN** the write fails with an actionable error
- **AND** the old amount data remains unchanged

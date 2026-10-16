# Spec Delta

## MODIFIED Requirements

### Requirement: Insert live savings values

Above the keypad the calculator MUST show one horizontally scrollable row of chips «название · сумма» for the monthly income, each allocation category, and «Операции (остаток)», with the same amounts as the «Накопления» widget; while the income or the allocation categories are still loading, the calculator MUST NOT show or allow inserting any value chip and MUST show a neutral loading placeholder without amounts instead; short labels such as «Месячный доход» MUST be shown in full and only long labels truncated. Tapping a chip MUST insert at the caret an indivisible value element shown by an abbreviated label (for example «Мес. д.», «Под.», «Оп.»). The caret MUST jump over a value element and backspace MUST delete it whole; if the deletion leaves a redundant operator, that operator MUST be removed too: of two adjacent binary operators the right one; a binary operator other than `−` left at the start or right after `(`; a binary operator left at the end or right before `)`. Inserting a value directly after a number or another value MUST insert `+` between them, and typing a digit or decimal separator directly after or before a value MUST likewise insert `+` between the value and the new number. A value's amount MUST never merge with adjacent digits; an expression that would place a number directly next to a value without an operator MUST NOT show a numeric result. The result MUST use the current amount of the value, so it updates when the amount changes in «Накопления»; if the category no longer exists, the element MUST show and use its last known amount.

#### Scenario: Insert a percentage category

- **GIVEN** monthly income 80,000 ₽ and category «Подушка» at 20%
- **WHEN** the user taps `100` and then the chip «Подушка · 16 000 ₽»
- **THEN** the expression shows `100 + Под.`
- **AND** the result is 16 100

#### Scenario: Type a digit after a value

- **GIVEN** the expression `5 + Кв.` where «Квартира» is 30,000 ₽
- **WHEN** the user taps `7`
- **THEN** the expression shows `5 + Кв. + 7`
- **AND** the result is 30 012

#### Scenario: Follow a changed amount

- **GIVEN** the expression contains «Подушка» and the income changes from 80,000 ₽ to 100,000 ₽
- **THEN** the result uses 20,000 ₽ for «Подушка»

#### Scenario: Delete a value between numbers

- **GIVEN** the expression `5 + Кв. + 7` with the caret after «Кв.»
- **WHEN** the user taps backspace
- **THEN** the expression becomes `5 + 7`

#### Scenario: Delete a value at the edge

- **GIVEN** the expression `5 + Кв.` or `(5 + Кв.)` with the caret after «Кв.»
- **WHEN** the user taps backspace
- **THEN** the expression becomes `5` or `(5)`

#### Scenario: Fall back for a deleted category

- **GIVEN** the expression contains a category that was then deleted, last known as 16,000 ₽
- **THEN** the expression shows `16000` in its place and the result uses that amount

#### Scenario: Chips while savings values load

- **WHEN** the user opens the calculator while the income or the allocation categories are still loading
- **THEN** no chip «название · сумма» is shown and no value can be inserted
- **AND** once loading finishes, the chip «Месячный доход» shows and inserts the actual income

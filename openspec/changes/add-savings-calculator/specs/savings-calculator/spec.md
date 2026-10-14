# Spec Delta

## Purpose

Калькулятор поверх приложения помогает считать суммы для переводов, подставляя значения из «Накоплений» и копируя результат обычным числом.

## ADDED Requirements

### Requirement: Open the calculator from a floating button

An authenticated app screen MUST show a round floating calculator button in the bottom-right corner. The button MUST be hidden while the calculator is open. On a wide viewport the button MUST open the calculator as a dialog over the screen that closes with its close control or Escape. On a narrow (mobile) viewport it MUST open the calculator as a full-width bottom panel that closes with its close control, a downward touch swipe, or a tap on the backdrop; while the panel is open the page behind it MUST NOT scroll, and scrolling MUST be restored on close.

#### Scenario: Open and close on desktop

- **GIVEN** a wide viewport
- **WHEN** the user taps the calculator button
- **THEN** the calculator opens as a dialog and the button is hidden
- **AND** Escape closes the dialog and shows the button again

#### Scenario: Open and dismiss on mobile

- **GIVEN** a narrow viewport
- **WHEN** the user opens the calculator
- **THEN** it opens as a full-width bottom panel and the page behind it does not scroll
- **AND** a downward swipe longer than the close threshold closes it and restores scrolling
- **AND** a shorter swipe keeps it open

### Requirement: Calculate with on-screen buttons and a caret

The calculator MUST accept input only from its on-screen buttons: digits, a decimal separator, `+ − × ÷`, parentheses, backspace, clear, `=`, and «←» «→» caret buttons placed in the backspace row. The expression line MUST show a visible caret that the user can place by tapping a position in the expression or move with the arrow buttons. Input MUST be inserted at the caret, and backspace MUST delete the element before the caret. The calculator MUST show the result rounded to kopecks; an incomplete or invalid expression, including division by zero, MUST NOT show a numeric result.

#### Scenario: Evaluate an expression

- **WHEN** the user enters `1000 + 250,5 × 2` and taps `=`
- **THEN** the result is 1501

#### Scenario: Edit in the middle of the expression

- **GIVEN** the expression `12+3`
- **WHEN** the user moves the caret left twice and taps `5`
- **THEN** the expression becomes `125+3`

#### Scenario: Divide by zero

- **WHEN** the user enters `5 ÷ 0`
- **THEN** no numeric result is shown

### Requirement: Insert live savings values

Above the keypad the calculator MUST show one horizontally scrollable row of chips «название · сумма» for the monthly income, each allocation category, and «Операции (остаток)», with the same amounts as the «Накопления» widget; short labels such as «Месячный доход» MUST be shown in full and only long labels truncated. Tapping a chip MUST insert at the caret an indivisible value element shown by an abbreviated label (for example «Мес. д.», «Под.», «Оп.»). The caret MUST jump over a value element and backspace MUST delete it whole. Inserting a value directly after a number or another value MUST insert `+` between them, and typing a digit or decimal separator directly after or before a value MUST likewise insert `+` between the value and the new number. A value's amount MUST never merge with adjacent digits; an expression that would place a number directly next to a value without an operator MUST NOT show a numeric result. The result MUST use the current amount of the value, so it updates when the amount changes in «Накопления»; if the category no longer exists, the element MUST show and use its last known amount.

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

#### Scenario: Fall back for a deleted category

- **GIVEN** the expression contains a category that was then deleted, last known as 16,000 ₽
- **THEN** the expression shows `16000` in its place and the result uses that amount

### Requirement: Keep the expression across sessions

The calculator MUST keep the current expression in this browser across closing the calculator and reloading the page. Unreadable or outdated saved data MUST be ignored, leaving an empty expression.

#### Scenario: Restore after reload

- **GIVEN** the user entered an expression and closed the calculator
- **WHEN** the page is reloaded and the calculator is opened
- **THEN** the same expression is shown

### Requirement: Copy the result

The result line MUST contain an icon-only copy control named «Скопировать» that copies the result as a plain number without thousand separators or currency, using `.` as the decimal separator. After copying, the icon MUST briefly change to a confirmation mark and an announcement MUST be made to assistive technology.

#### Scenario: Copy a fractional result

- **GIVEN** the result is 12 345,67
- **WHEN** the user taps «Скопировать»
- **THEN** the clipboard contains `12345.67`
- **AND** the control briefly shows a check mark and «Скопировано» is announced

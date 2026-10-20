# savings-calculator Specification

## Purpose

Калькулятор поверх приложения помогает считать суммы для переводов, подставляя значения из «Накоплений» и копируя результат обычным числом.

## Requirements

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

The calculator MUST accept input from its on-screen buttons: digits, a decimal separator, `+ − × ÷`, parentheses, backspace, clear, `=`, and «←» «→» caret buttons placed in the backspace row. The expression line MUST show a visible caret that the user can place by tapping a position in the expression or move with the arrow buttons. Input MUST be inserted at the caret, and backspace MUST delete the element before the caret. After `=` the result MUST replace the expression: a digit, decimal separator, `(`, or value then MUST start a new expression, an operator MUST continue from the result, and backspace, arrows, or a tap on the expression MUST edit the result as an ordinary number. The calculator MUST show the result rounded to kopecks; an incomplete or invalid expression, including division by zero, MUST NOT show a numeric result.

#### Scenario: Evaluate an expression

- **WHEN** the user enters `1000 + 250,5 × 2` and taps `=`
- **THEN** the result is 1501

#### Scenario: Start a new expression after the result

- **GIVEN** the user tapped `=` and the expression shows the result `36`
- **WHEN** the user types `(2+3)÷4`
- **THEN** the expression becomes `(2+3)÷4` and the result is 1,25

#### Scenario: Continue from the result with an operator

- **GIVEN** the expression shows the result `36` after `=`
- **WHEN** the user types `+5`
- **THEN** the expression becomes `36+5` and the result is 41

#### Scenario: Edit the result

- **GIVEN** the expression shows the result `36` after `=`
- **WHEN** the user taps backspace, an arrow, or a position in the expression
- **THEN** the result is edited as an ordinary number (backspace gives `3`), and later input continues it

#### Scenario: Edit in the middle of the expression

- **GIVEN** the expression `12+3`
- **WHEN** the user moves the caret left twice and taps `5`
- **THEN** the expression becomes `125+3`

#### Scenario: Divide by zero

- **WHEN** the user enters `5 ÷ 0`
- **THEN** no numeric result is shown

### Requirement: Accept physical keyboard input

While the calculator is open, a physical keyboard MUST drive it exactly like the on-screen buttons, including the caret, automatic `+`, and evaluation: digits (including the numeric keypad), `+ - * /` (including the keypad), `,` and `.` (including the keypad decimal key) as the decimal separator, `(` `)`, `Enter` and `=` for the result, `Backspace` to delete the element before the caret, `Delete` to clear the expression, `←` `→` to move the caret, and `Escape` to close. Keys typed into an editable field outside the calculator MUST go to that field. Keys with Ctrl, Meta, or Alt and keys during text composition MUST be ignored. The calculator MUST suppress the browser's default action only for keys it handles, and pressing Enter on a focused calculator button MUST activate only that button.

#### Scenario: Type an expression

- **GIVEN** the calculator is open
- **WHEN** the user types `12*3` on the keyboard and presses Enter
- **THEN** the expression shows `12×3` and then `36`

#### Scenario: Type into a form while the calculator is open

- **GIVEN** the calculator is open and an expense amount field outside it has focus
- **WHEN** the user types `5`
- **THEN** the digit goes to the field and the calculator expression does not change

#### Scenario: Keep browser shortcuts

- **GIVEN** the calculator is open
- **WHEN** the user presses Ctrl+C
- **THEN** the calculator ignores the key and the browser handles it

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

### Requirement: Name a division by zero

When a complete expression divides by zero, the calculator MUST show «деление на 0» instead of a result.

#### Scenario: One divided by zero

- **WHEN** the user enters `1÷0`
- **THEN** the result line shows «деление на 0»

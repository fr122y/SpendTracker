# Spec Delta

## Purpose

Калькулятор поверх приложения помогает считать суммы для переводов, подставляя значения из «Накоплений» и копируя результат обычным числом.

## ADDED Requirements

### Requirement: Open the calculator from a floating button

An authenticated app screen MUST show a round floating calculator button in the bottom-right corner. On a wide viewport the button MUST open the calculator as a dialog over the screen. On a narrow (mobile) viewport it MUST open the calculator as a full-width bottom panel. The calculator MUST close with a close control, and the bottom panel MUST also close with a downward swipe.

#### Scenario: Open on desktop

- **GIVEN** a wide viewport
- **WHEN** the user taps the calculator button
- **THEN** the calculator opens as a dialog over the screen

#### Scenario: Open and dismiss on mobile

- **GIVEN** a narrow viewport
- **WHEN** the user taps the calculator button
- **THEN** the calculator opens as a full-width bottom panel
- **AND** a downward swipe on the panel closes it

### Requirement: Calculate with on-screen buttons

The calculator MUST accept input only from its on-screen buttons: digits, a decimal separator, `+ − × ÷`, parentheses, backspace, clear, and `=`. It MUST show the current expression and its result rounded to kopecks. An incomplete or invalid expression, including division by zero, MUST NOT show a numeric result.

#### Scenario: Evaluate an expression

- **WHEN** the user enters `1000 + 250,5 × 2` and taps `=`
- **THEN** the result is 1501

#### Scenario: Divide by zero

- **WHEN** the user enters `5 ÷ 0`
- **THEN** no numeric result is shown

### Requirement: Insert savings values

Above the keypad the calculator MUST show one horizontally scrollable row of compact chips «название · сумма» for the monthly income, each allocation category, and «Операции (остаток)», with the same amounts as the «Накопления» widget; a percentage category MUST show its amount calculated from the income. Tapping a chip MUST insert its amount in rubles as a plain number with at most two decimals. A negative amount MUST be inserted in parentheses.

#### Scenario: Insert a percentage category

- **GIVEN** monthly income 80,000 ₽ and category «Подушка» at 20%
- **WHEN** the user taps the chip «Подушка · 16 000 ₽»
- **THEN** the expression receives `16000`

#### Scenario: Insert the remainder

- **GIVEN** monthly income 80,000 ₽ and categories totalling 30%
- **WHEN** the user taps «Операции (остаток)» and then `÷ 2 =`
- **THEN** the result is 28000

### Requirement: Copy the result

The calculator MUST provide a «Скопировать» control that copies the result as a plain number without thousand separators or currency, using `.` as the decimal separator, and briefly confirms the copy.

#### Scenario: Copy a fractional result

- **GIVEN** the result is 12 345,67
- **WHEN** the user taps «Скопировать»
- **THEN** the clipboard contains `12345.67`
- **AND** the calculator shows «Скопировано»

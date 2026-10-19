# Spec Delta

## ADDED Requirements

### Requirement: Scroll the mobile dashboard as one page

Below 768 px the dashboard MUST scroll as one page: the widget accordion and the expense journal list MUST NOT have their own vertical scroll. The content MUST end with bottom space at least the height of the floating calculator button, and scrolling a field into view MUST keep it clear of that button. From 768 px the layout keeps its columns with their own scroll.

#### Scenario: Long journal on a phone

- **GIVEN** a 375×667 viewport and an expanded journal
- **WHEN** the user scrolls
- **THEN** the page scrolls and the journal list has no inner scroll

#### Scenario: Calculator button does not cover the form

- **GIVEN** a 375×667 viewport and an expanded journal
- **WHEN** the amount field or «Добавить» is scrolled to the bottom edge of the screen
- **THEN** it does not intersect the calculator button

### Requirement: Mount collapsed accordion widgets lazily

A collapsed accordion widget MUST NOT be mounted and MUST NOT request its data until it is first expanded. Collapsed content MUST be `inert`. A widget that was expanded MAY stay mounted after collapsing to keep its state.

#### Scenario: First load on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the dashboard loads with all sections collapsed
- **THEN** no widget content is mounted

### Requirement: Reveal the journal on a calendar day tap

On the mobile accordion, tapping a calendar day MUST select the date, expand the journal, and scroll it into view. Wider layouts MUST only select the date.

#### Scenario: Tap a day

- **GIVEN** a 375×667 viewport with the calendar expanded and the journal collapsed
- **WHEN** the user taps a day
- **THEN** the journal expands and is scrolled into view

### Requirement: Compact dismissible email verification banner

The email verification reminder MUST take one compact row and offer «Скрыть напоминание». A dismissed reminder MUST stay hidden for the rest of the browser session and MUST return in a new session while the email is unconfirmed.

#### Scenario: Dismiss the reminder

- **GIVEN** an unverified user on the dashboard
- **WHEN** the user taps «Скрыть напоминание» and reloads the page
- **THEN** the reminder is not shown

### Requirement: Avoid a desktop flash before the viewport is known

Until the client has measured the viewport, the dashboard MUST NOT render a viewport-specific widget tree; it MUST show a placeholder whose shape is chosen by CSS media queries.

#### Scenario: Hydration on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the server-rendered dashboard hydrates
- **THEN** no desktop column layout is rendered at any point

# Spec Delta

## ADDED Requirements

### Requirement: Treat a landscape phone as a phone

The dashboard MUST choose the phone layout when the viewport is narrower than 768 px or is landscape with a height below 500 px. A landscape phone MUST keep the accordion layout; tablets and desktops keep their layouts. CSS-driven layout parts MUST use the same rule.

#### Scenario: Rotate a phone

- **GIVEN** a 393×852 viewport showing the accordion
- **WHEN** the viewport becomes 852×393
- **THEN** the accordion is still shown and no column layout is rendered

### Requirement: Keep form drafts across remounts

Values typed into a dashboard form MUST survive the form being unmounted and mounted again in the same page session, including a layout switch or rotation. A successful submit MUST clear the draft. Drafts MUST NOT be written to persistent browser storage.

#### Scenario: Rotate with a filled form

- **GIVEN** a phone with the expense description and amount filled
- **WHEN** the viewport is rotated to landscape and back
- **THEN** the description and amount keep their values

### Requirement: Close dialogs with the Back button

Opening a dialog MUST add one browser history entry. Browser Back MUST close the topmost open dialog and keep the user on the page. Closing a dialog any other way MUST remove its history entry.

#### Scenario: Back with an open dialog

- **GIVEN** an open dialog on the dashboard
- **WHEN** the user presses Back
- **THEN** the dialog closes and the dashboard stays open

### Requirement: Avoid zoom on input focus on phones

On the phone layout, text inputs, selects and textareas MUST have a font size of at least 16 px. Wider layouts MAY keep smaller fields.

#### Scenario: Focus a field on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the expense form is shown
- **THEN** its inputs and selects have a computed font size of at least 16 px

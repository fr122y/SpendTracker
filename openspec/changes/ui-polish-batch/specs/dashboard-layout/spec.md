# Spec Delta

## ADDED Requirements

### Requirement: Keep the calculator button off controls on phones

On the phone layout the floating calculator button MUST NOT cover the journal filter chips or the day total at any scroll position, and MUST be hidden while a category is being edited.

#### Scenario: Journal on a phone

- **GIVEN** a 375 px wide phone or a phone in landscape
- **WHEN** the user scrolls the journal so the «Карманы» chip or the day total reaches the bottom of the screen
- **THEN** the calculator button does not cover it

#### Scenario: Editing a category

- **WHEN** the user opens a category for editing on a 375 px wide phone
- **THEN** the calculator button is hidden until the editor closes

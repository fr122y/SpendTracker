# Spec Delta

## ADDED Requirements

### Requirement: Phone touch targets on the login page are at least 44 px

On a phone viewport the sign-in and register tabs, the «Забыли пароль?» link and the switch links between the forms MUST have a hit box of at least 44×44 px.

#### Scenario: Login tabs on a phone

- **GIVEN** a 375×667 viewport on /login
- **WHEN** the tabs and links are measured
- **THEN** each box is at least 44 px wide and 44 px high

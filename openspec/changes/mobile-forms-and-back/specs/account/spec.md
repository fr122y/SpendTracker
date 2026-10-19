# Spec Delta

## ADDED Requirements

### Requirement: Leave the login page out of history after sign-in

After a successful sign-in or registration, the app MUST replace the current history entry with the destination page, so browser Back MUST NOT return to /login.

#### Scenario: Back after login

- **GIVEN** a user signed in on /login and redirected to the dashboard
- **WHEN** the user presses Back
- **THEN** the browser does not show /login

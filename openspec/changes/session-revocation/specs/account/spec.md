# Spec Delta

## ADDED Requirements

### Requirement: Sign-out ends the session on the server

«Выйти» MUST end the current session on the server: a session cookie saved before sign-out MUST NOT open / or /account when it is sent again, the session endpoint MUST answer it with no session, and Server Actions MUST reject it no later than 5 minutes after sign-out. Sessions of the same account on other devices MUST stay signed in.

#### Scenario: Reuse a cookie saved before sign-out

- **GIVEN** a user signed in and the session cookie was copied
- **WHEN** the user presses «Выйти» and the copied cookie is put back into the browser
- **THEN** opening / leads to /login
- **AND** opening /account leads to /login with `callbackUrl=/account`
- **AND** `/api/auth/session` returns no user

#### Scenario: Other devices after sign-out

- **GIVEN** the user is signed in on two devices
- **WHEN** the user presses «Выйти» on one of them
- **THEN** the other device stays signed in

### Requirement: A password change ends the other sessions

A successful password change on /account MUST end every other session of the account: page loads of / and /account MUST reject them at once, and Server Actions MUST reject them within 5 minutes. The session where the password was changed MUST stay signed in. A password reset by email link MUST end every session of the account.

#### Scenario: Change the password while signed in on another device

- **GIVEN** the user is signed in on devices A and B
- **WHEN** the user changes the password on A
- **THEN** / and /account on B lead to /login
- **AND** /account on A still opens without a new sign-in

#### Scenario: Reset the password by email link

- **GIVEN** the user is signed in on a device
- **WHEN** the password is reset through the email link
- **THEN** its next page load leads to /login

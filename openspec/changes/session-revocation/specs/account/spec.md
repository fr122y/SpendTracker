# Spec Delta

## ADDED Requirements

### Requirement: Sign-out ends the session on the server

«Выйти» MUST end the current session on the server: a session cookie saved before sign-out MUST NOT open /account when it is sent again, and MUST NOT open any other page later than 5 minutes after sign-out. Sessions of the same account on other devices MUST stay signed in.

#### Scenario: Reuse a cookie saved before sign-out

- **GIVEN** a user signed in and the session cookie was copied
- **WHEN** the user presses «Выйти» and the copied cookie is put back into the browser
- **THEN** opening /account leads to /login with `callbackUrl=/account`
- **AND** the login form is shown

#### Scenario: Other devices after sign-out

- **GIVEN** the user is signed in on two devices
- **WHEN** the user presses «Выйти» on one of them
- **THEN** the other device stays signed in

### Requirement: A password change ends the other sessions

A successful password change on /account MUST end every other session of the account: /account MUST reject them at once, and other pages MUST reject them within 5 minutes. The session where the password was changed MUST stay signed in. A password reset by email link MUST end every session of the account.

#### Scenario: Change the password while signed in on another device

- **GIVEN** the user is signed in on devices A and B
- **WHEN** the user changes the password on A
- **THEN** /account on B leads to /login
- **AND** /account on A still opens without a new sign-in

#### Scenario: Reset the password by email link

- **GIVEN** the user is signed in on a device
- **WHEN** the password is reset through the email link
- **THEN** that device is signed out within 5 minutes, at once on /account

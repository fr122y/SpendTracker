# account Specification

## Purpose

Страница аккаунта показывает данные пользователя по-русски и позволяет сменить отображаемое имя и пароль.

## Requirements

### Requirement: Show account information in Russian

Страница /account MUST показывать имя, email и способ входа с русскими подписями; способ входа по email и паролю MUST показываться как «Email и пароль», а не внутренним идентификатором провайдера.

#### Scenario: Credentials user opens the account page

- **GIVEN** пользователь зарегистрирован по email и паролю
- **WHEN** он открывает /account
- **THEN** способ входа показан как «Email и пароль»
- **AND** на странице нет подписей «Credentials» и «Account»

### Requirement: Change the display name

Пользователь MUST иметь возможность сменить имя на /account. Имя MUST обрезаться по краям и соответствовать правилам регистрации: от 2 до 50 символов. После сохранения новое имя MUST сразу показываться на странице без повторного входа.

#### Scenario: Save a new name

- **WHEN** пользователь вводит « Илья » и сохраняет
- **THEN** показано сообщение «Имя сохранено»
- **AND** на странице показано имя «Илья»

#### Scenario: Reject an empty name

- **WHEN** пользователь сохраняет имя из одних пробелов
- **THEN** имя не меняется и показано сообщение «Имя должно содержать минимум 2 символа»

### Requirement: Change the password

Пользователь с паролем MUST иметь возможность сменить пароль на /account, указав текущий пароль, новый пароль и его повтор. Система MUST отклонять смену, если текущий пароль неверен, повтор не совпадает, новый пароль не проходит правила регистрации или совпадает с текущим. Сообщения об ошибках MUST быть на русском и MUST NOT раскрывать хеши и технические детали. Пользователю без пароля (вход через Google) форма смены пароля MUST NOT показываться.

#### Scenario: Change the password successfully

- **GIVEN** текущий пароль пользователя верен
- **WHEN** он вводит новый пароль из 8+ символов, отличный от текущего, и тот же повтор
- **THEN** показано сообщение «Пароль изменён»
- **AND** следующий вход проходит с новым паролем и не проходит со старым

#### Scenario: Wrong current password

- **WHEN** пользователь указывает неверный текущий пароль
- **THEN** пароль не меняется и показано сообщение «Текущий пароль указан неверно»

#### Scenario: New password equals the current one

- **WHEN** новый пароль совпадает с текущим
- **THEN** пароль не меняется и показано сообщение «Новый пароль должен отличаться от текущего»

### Requirement: Leave the login page out of history after sign-in

After a successful sign-in or registration, the app MUST replace the current history entry with the destination page, so browser Back MUST NOT return to /login.

#### Scenario: Back after login

- **GIVEN** a user signed in on /login and redirected to the dashboard
- **WHEN** the user presses Back
- **THEN** the browser does not show /login

### Requirement: Phone touch targets on the login page are at least 44 px

On a phone viewport the sign-in and register tabs, the «Забыли пароль?» link and the switch links between the forms MUST have a hit box of at least 44×44 px.

#### Scenario: Login tabs on a phone

- **GIVEN** a 375×667 viewport on /login
- **WHEN** the tabs and links are measured
- **THEN** each box is at least 44 px wide and 44 px high

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

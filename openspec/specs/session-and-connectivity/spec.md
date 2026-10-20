# session-and-connectivity Specification

## Purpose

Свежесть данных при возврате на вкладку, обработка истёкшей сессии и офлайн-сохранений.

## Requirements

### Requirement: Refresh stale data when the user returns to the tab

When the tab becomes visible again or the network returns, data older than 30 seconds MUST be read again from the server; data younger than 30 seconds MUST NOT be. While a save is running or waiting for the network, this refresh MUST NOT run, so an optimistic record MUST NOT disappear or flicker.

#### Scenario: Return after a change in another tab

- **GIVEN** the dashboard is open in tabs A and B
- **WHEN** the user adds an expense in A and returns to B more than 30 seconds after B loaded its data
- **THEN** B shows the new expense without a reload

#### Scenario: Quick tab switch

- **WHEN** the user returns to a tab whose data is younger than 30 seconds
- **THEN** no data is requested again

#### Scenario: Return while a save is pending

- **GIVEN** an added expense is still being saved
- **WHEN** the user returns to the tab
- **THEN** the expense stays on screen and is not overwritten by older data

### Requirement: Send the user to sign in when the session expired

When a request fails because the session is gone, the app MUST show «Сессия истекла — войдите снова» instead of a generic save error, MUST open `/login` with `callbackUrl` set to the current page, and after sign-in MUST return there with the unsaved form input, including an operation whose save was rejected, back in its form. A signed-out visit to a page other than the dashboard MUST lead to `/login` with `callbackUrl` set to that page.

#### Scenario: Save after signing out in another tab

- **GIVEN** the user signed out in tab A
- **WHEN** the user submits an expense in tab B
- **THEN** tab B opens `/login?callbackUrl=…` with the message «Сессия истекла — войдите снова»
- **AND** after sign-in the form shows the submitted description and amount, and no expense was saved

#### Scenario: Submit the restored draft while the dashboard loads

- **GIVEN** the user signed in again and the restored expense is in the form
- **WHEN** the user presses «Добавить» before the categories and keyword rules have loaded
- **THEN** the button shows it is busy and the expense is saved once they load, exactly once

#### Scenario: Account page without a session

- **WHEN** a signed-out user opens `/account`
- **THEN** the app opens `/login?callbackUrl=%2Faccount`

### Requirement: Show offline state and pending saves

Without network, the app MUST show «Нет сети — изменения сохранятся, когда связь вернётся». A change made offline MUST stay on screen, MUST be marked «Сохраняется…», and MUST be saved when the network returns. An online save that takes longer than one second MUST also be marked «Сохраняется…».

#### Scenario: Add an expense offline

- **GIVEN** the browser is offline
- **WHEN** the user adds an expense
- **THEN** the expense is shown with «Сохраняется…» and the offline message
- **AND** when the network returns the expense is saved and both messages disappear

### Requirement: Warn before leaving with unsaved changes

Leaving or reloading the page MUST ask for confirmation while a form holds typed text or a save is running or waiting for the network. A deferred delete in its undo window MUST NOT trigger the warning, and neither MUST the redirect to sign in after an expired session.

#### Scenario: Reload with a save waiting for the network

- **GIVEN** an expense was added offline and is waiting for the network
- **WHEN** the user reloads the page
- **THEN** the browser asks to confirm leaving

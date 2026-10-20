# Spec Delta

## MODIFIED Requirements

### Requirement: Name the record and allow undo on delete

A delete confirmation MUST name the record by description, amount, and date. In the journal, a confirmed delete MUST hide the record at once and show the toast «Расход удалён» with the action «Отменить» for about 5 seconds; the server delete MUST run only after that window unless the user undoes it. A waiting delete MUST be committed immediately when the page is hidden or the journal unmounts. A waiting delete MUST always reach the server, including when the user reloads or closes the tab during the window: it MUST be sent by a request that survives page unload, and a delete not confirmed by the server MUST be sent again on the next app load and the record MUST stay hidden until then. Where undo is not offered, the confirmation MUST keep its warning that the delete cannot be undone.

#### Scenario: Undo a delete

- **GIVEN** the user confirmed deleting «Обед»
- **WHEN** the user activates «Отменить» within the window
- **THEN** the record reappears and no server delete happens

#### Scenario: Delete commits after the window

- **GIVEN** the user confirmed deleting «Обед»
- **WHEN** about 5 seconds pass without undo
- **THEN** the record is deleted on the server

#### Scenario: Leave the page during the window

- **GIVEN** a delete is waiting for its undo window
- **WHEN** the page is hidden or the journal unmounts
- **THEN** the delete is committed immediately

#### Scenario: Reload during the window

- **GIVEN** the user confirmed deleting «Обед»
- **WHEN** the user reloads the page within 2 seconds
- **THEN** after the reload «Обед» is not in the journal and is deleted on the server

#### Scenario: Flush only the user's own expenses

- **WHEN** the flush request names an expense of another user, a temporary id, or an id that no longer exists
- **THEN** that id is skipped without an error and the request can be repeated safely

# Spec Delta

## ADDED Requirements

### Requirement: Edit an operation in full

The journal MUST let a user open an editor for an operation that changes its amount, description, category, and date, including a date in another day or month. Saving MUST send one update with only the changed fields and MUST use the existing server validation: the amount is parsed like other amount fields, rounded to kopecks, and bounded. The description MUST NOT be empty. Changing the category MUST store the category name and emoji and MUST NOT create or change keyword rules.

#### Scenario: Change every field at once

- **GIVEN** a personal expense «Обед», 500 ₽, category «Еда», dated 31.01.2026
- **WHEN** the user changes the description, the amount to `300+50,5`, the category to «Такси», and the date to 01.02.2026, and saves
- **THEN** one update stores «Такси домой», 350,5 ₽, «Такси» with its emoji, and 2026-02-01
- **AND** no keyword rule is created

#### Scenario: Save is unavailable without a valid change

- **GIVEN** the editor is open
- **WHEN** nothing has changed, or the amount is zero, negative, or not a number
- **THEN** the save action is disabled

### Requirement: Keep both periods current after a move

After an edit, every view derived from operations MUST reflect it without a page reload: the journal, daily and monthly totals, analysis, and the weekly budget of both the original and the new period. When the operation belongs to a pocket, pocket budgets MUST refresh too.

#### Scenario: Move an expense to the next month

- **GIVEN** an expense dated 31.01.2026
- **WHEN** the user moves it to 01.02.2026
- **THEN** January no longer counts it and February does
- **AND** the operation list is refetched from the server

### Requirement: Respect existing operation guards in the editor

The editor MUST NOT offer a change the server rejects. A shared-budget expense MUST keep its category, shown disabled with a hint. A pocket transfer MUST keep its category and MAY drop to an amount of 0 but not below. A project withdrawal or return MUST keep its amount and category; only its description and date change. An operation of an archived pocket MUST open read-only with the hint «Карман в архиве — восстановите, чтобы изменить», and the journal MUST NOT show its edit action.

#### Scenario: Shared expense category is locked

- **GIVEN** an expense of a shared budget
- **WHEN** the user opens the editor
- **THEN** the category field is disabled with the hint «Категорию общего расхода нельзя изменить здесь»
- **AND** saving another amount sends no category or emoji

#### Scenario: Archived pocket operation is read-only

- **GIVEN** a purchase from an archived pocket
- **WHEN** the editor opens for it
- **THEN** every field and the save action are disabled and the archive hint is shown

### Requirement: Name the record and allow undo on delete

A delete confirmation MUST name the record by description, amount, and date. In the journal, a confirmed delete MUST hide the record at once and show the toast «Расход удалён» with the action «Отменить» for about 5 seconds; the server delete MUST run only after that window unless the user undoes it. A waiting delete MUST be committed immediately when the page is hidden or the journal unmounts. Where undo is not offered, the confirmation MUST keep its warning that the delete cannot be undone.

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

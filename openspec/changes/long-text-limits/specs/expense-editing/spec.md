# Spec Delta

## ADDED Requirements

### Requirement: Limit the operation description length

An operation description MUST NOT exceed 200 characters, counted as JavaScript string length after trimming. Every description field MUST stop input at the limit and explain it. The server MUST reject a new or changed description over the limit with the message «Комментарий не длиннее 200 символов». A stored description over the limit MUST stay unchanged and MUST NOT block edits of other fields; once the user changes it, it MUST be shortened before saving.

#### Scenario: Reject a 201-character description

- **WHEN** a client sends a new operation with a 201-character description
- **THEN** the server rejects it with «Комментарий не длиннее 200 символов»
- **AND** nothing is stored

#### Scenario: Edit another field of a legacy long operation

- **GIVEN** a stored operation with a 500-character description
- **WHEN** the user changes only its date and saves
- **THEN** the date is saved and the description is unchanged

### Requirement: Keep long text inside a journal row

A journal row MUST keep its amount and its edit and delete actions visible at any viewport width from 375 px. A long description or category name MUST be truncated on one line with the full text available as the element title and in the editor. The daily total MUST NOT wrap. The page MUST NOT scroll horizontally.

#### Scenario: Long text on a phone

- **GIVEN** an operation with a 200-character description in a category named with 90 characters without spaces
- **WHEN** the journal is shown at 375 px
- **THEN** the amount and the delete action are inside the viewport
- **AND** the page has no horizontal scroll

# Spec Delta

## ADDED Requirements

### Requirement: Limit the category name length

A personal or shared category name MUST NOT exceed 40 characters, counted as JavaScript string length after trimming. The name field MUST stop input at the limit and explain it. The server MUST reject a new or renamed category over the limit with the message «Название категории не длиннее 40 символов». A stored name over the limit MUST stay unchanged and MUST NOT block changing the emoji or color.

#### Scenario: Reject a 41-character name

- **WHEN** a client adds or renames a category to a 41-character name
- **THEN** the server rejects it with «Название категории не длиннее 40 символов»

#### Scenario: Recolor a legacy long category

- **GIVEN** a stored category with a 90-character name
- **WHEN** the user changes only its color
- **THEN** the color is saved and the name is unchanged

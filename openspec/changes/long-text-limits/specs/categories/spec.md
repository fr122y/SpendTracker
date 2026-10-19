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

### Requirement: Show long category names in the category list

The category list MUST show as much of a category name as fits on one line, truncated with an ellipsis and with the full name as the element title. When the categories widget is wide, the edit and delete actions MUST sit beside the name and MUST NOT shrink; the name MUST take at least half of the remaining row width. When the widget is narrow, the actions MUST move to a compact row under the name, and the name MUST take at least half of the row width. The layout MUST follow the widget width (a container query), not the viewport width.

#### Scenario: Narrow categories widget on a desktop

- **GIVEN** the categories widget sits in a narrow dashboard column at 1280 px
- **AND** a category is named with 40 characters without spaces
- **WHEN** the category list is shown
- **THEN** «Изменить» and «Удалить» are under the name
- **AND** the name takes at least half of the row width

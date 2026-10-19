# Spec Delta

## ADDED Requirements

### Requirement: Keep long category names inside analysis tiles

An analysis tile MUST truncate a long category name on one line and keep the full name as the element title and in the details dialog title. Tiles MUST NOT overlap and the page MUST NOT scroll horizontally. The hover tooltip MUST appear only for a mouse and MUST NOT intercept taps, so the first tap on any tile opens its details dialog.

#### Scenario: First tap opens the dialog

- **GIVEN** the analysis shows several tiles on a touch screen
- **WHEN** the user taps a tile with a 90-character name
- **THEN** its details dialog opens
- **AND** no tooltip of another tile is shown

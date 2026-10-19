# Spec Delta

## ADDED Requirements

### Requirement: Dashboard header controls do not overlap

The dashboard header MUST keep its controls from overlapping at every width. From 768 px the brand, the date navigation, and the actions MUST stay on one row; below 1280 px the «Сегодня», «Аккаунт», and «Редактировать/Готово» actions MUST be icon buttons with Russian `aria-label` and `title`.

#### Scenario: Tablet width

- **GIVEN** the dashboard is open at 820 px width
- **WHEN** the user clicks «Следующий день»
- **THEN** the selected date moves one day forward
- **AND** no header control overlaps another

#### Scenario: 200% zoom

- **GIVEN** the dashboard is open at 640 CSS px width
- **THEN** the date navigation wraps below the brand and actions without overlapping them

### Requirement: Stable dashboard header actions

The header MUST reserve the slot of «Сегодня» when the selected date is today so the other actions do not move when it appears. «Редактировать/Готово» MUST keep a fixed width and MUST be hidden below 768 px.

#### Scenario: Leaving today

- **GIVEN** the selected date is today
- **WHEN** the user moves to the next day
- **THEN** «Сегодня» appears in the reserved slot
- **AND** «Аккаунт» keeps its position

#### Scenario: Phone

- **GIVEN** the dashboard is open at 375 px width
- **THEN** «Редактировать» is not shown

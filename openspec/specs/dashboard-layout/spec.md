# dashboard-layout Specification

## Purpose

Редактор раскладки дашборда позволяет скрывать и возвращать виджеты и сбрасывать раскладку к исходной, не ломая сохранённые ранее раскладки.

## Requirements

### Requirement: Hide a dashboard widget

In edit mode the dashboard MUST offer a «Скрыть виджет» control for each widget on desktop. A hidden widget MUST NOT be rendered on desktop, tablet, or mobile. The control MUST be disabled for the last visible widget, and the server MUST reject a layout that hides every widget.

#### Scenario: Hide a widget

- **GIVEN** the dashboard is in edit mode on desktop
- **WHEN** the user clicks «Скрыть виджет» on «Динамика»
- **THEN** «Динамика» is no longer rendered
- **AND** it stays hidden after a reload and on mobile

#### Scenario: Last visible widget

- **GIVEN** only one widget is visible
- **THEN** its «Скрыть виджет» control is disabled

### Requirement: Show a hidden widget

In edit mode the dashboard MUST show a «Скрытые виджеты» panel that lists hidden widgets by their Russian titles, each with a «Показать» button. A shown widget MUST return to its default column, before the first widget that follows it there in the default layout, or at the end of that column.

#### Scenario: Show a widget

- **GIVEN** «Динамика» is hidden and the default column order is not changed
- **WHEN** the user clicks «Показать» next to «Динамика»
- **THEN** «Динамика» appears between «Анализ» and «Проекты»

### Requirement: Reset the dashboard layout

In edit mode the dashboard MUST offer a «Сбросить раскладку» button. After the user confirms it in a dialog, the layout MUST equal the default layout with every widget visible; cancelling MUST leave the layout unchanged.

#### Scenario: Reset after confirmation

- **GIVEN** a widget is hidden and columns are resized
- **WHEN** the user clicks «Сбросить раскладку» and confirms
- **THEN** the default columns, order, and widths are restored and no widget is hidden

### Requirement: Backward-compatible hidden widgets

A saved layout without `hidden` MUST be read as nothing hidden and MUST NOT be rewritten. Unknown or duplicate ids in `hidden` MUST be dropped when reading. A widget absent from both the columns and `hidden` MUST be shown.

#### Scenario: Widget added to the app later

- **GIVEN** a saved layout whose columns and `hidden` both lack a widget
- **WHEN** the layout is loaded
- **THEN** that widget is shown

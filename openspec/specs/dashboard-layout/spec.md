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

### Requirement: Scroll the mobile dashboard as one page

Below 768 px the dashboard MUST scroll as one page: the widget accordion and the expense journal list MUST NOT have their own vertical scroll. The content MUST end with bottom space at least the height of the floating calculator button, and scrolling a field into view MUST keep it clear of that button. From 768 px the layout keeps its columns with their own scroll.

#### Scenario: Long journal on a phone

- **GIVEN** a 375×667 viewport and an expanded journal
- **WHEN** the user scrolls
- **THEN** the page scrolls and the journal list has no inner scroll

#### Scenario: Calculator button does not cover the form

- **GIVEN** a 375×667 viewport and an expanded journal
- **WHEN** the amount field or «Добавить» is scrolled to the bottom edge of the screen
- **THEN** it does not intersect the calculator button

### Requirement: Mount collapsed accordion widgets lazily

A collapsed accordion widget MUST NOT be mounted and MUST NOT request its data until it is first expanded. Collapsed content MUST be `inert`. A widget that was expanded MAY stay mounted after collapsing to keep its state.

#### Scenario: First load on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the dashboard loads with all sections collapsed
- **THEN** no widget content is mounted

### Requirement: Reveal the journal on a calendar day tap

On the mobile accordion, tapping a calendar day MUST select the date, expand the journal, and scroll it into view. Wider layouts MUST only select the date.

#### Scenario: Tap a day

- **GIVEN** a 375×667 viewport with the calendar expanded and the journal collapsed
- **WHEN** the user taps a day
- **THEN** the journal expands and is scrolled into view

### Requirement: Compact dismissible email verification banner

The email verification reminder MUST take one compact row and offer «Скрыть напоминание». A dismissed reminder MUST stay hidden for the rest of the browser session and MUST return in a new session while the email is unconfirmed.

#### Scenario: Dismiss the reminder

- **GIVEN** an unverified user on the dashboard
- **WHEN** the user taps «Скрыть напоминание» and reloads the page
- **THEN** the reminder is not shown

### Requirement: Avoid a desktop flash before the viewport is known

Until the client has measured the viewport, the dashboard MUST NOT render a viewport-specific widget tree; it MUST show a placeholder whose shape is chosen by CSS media queries.

#### Scenario: Hydration on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the server-rendered dashboard hydrates
- **THEN** no desktop column layout is rendered at any point

### Requirement: Treat a landscape phone as a phone

The dashboard MUST choose the phone layout when the viewport is narrower than 768 px or is landscape with a height below 500 px. A landscape phone MUST keep the accordion layout; tablets and desktops keep their layouts. CSS-driven layout parts MUST use the same rule.

#### Scenario: Rotate a phone

- **GIVEN** a 393×852 viewport showing the accordion
- **WHEN** the viewport becomes 852×393
- **THEN** the accordion is still shown and no column layout is rendered

### Requirement: Keep form drafts across remounts

Values typed into a dashboard form MUST survive the form being unmounted and mounted again in the same page session, including a layout switch or rotation. A successful submit MUST clear the draft. Drafts MUST NOT be written to persistent browser storage.

#### Scenario: Rotate with a filled form

- **GIVEN** a phone with the expense description and amount filled
- **WHEN** the viewport is rotated to landscape and back
- **THEN** the description and amount keep their values

### Requirement: Close dialogs with the Back button

Opening a dialog MUST add one browser history entry. Browser Back MUST close the topmost open dialog and keep the user on the page. Closing a dialog any other way MUST remove its history entry.

#### Scenario: Back with an open dialog

- **GIVEN** an open dialog on the dashboard
- **WHEN** the user presses Back
- **THEN** the dialog closes and the dashboard stays open

### Requirement: Avoid zoom on input focus on phones

On the phone layout, text inputs, selects and textareas MUST have a font size of at least 16 px. Wider layouts MAY keep smaller fields.

#### Scenario: Focus a field on a phone

- **GIVEN** a 375×667 viewport
- **WHEN** the expense form is shown
- **THEN** its inputs and selects have a computed font size of at least 16 px

### Requirement: Phone touch targets are at least 44 px

On a phone viewport every interactive dashboard element MUST have a hit box of at least 44×44 px. Wide viewports MAY keep their compact sizes.

#### Scenario: Header month picker on a phone

- **GIVEN** a 375×667 viewport showing the dashboard
- **WHEN** the header month picker, filter chips, payday legend, calendar days and journal fields are measured
- **THEN** each box is at least 44 px wide and 44 px high

### Requirement: Keep the calculator button off controls on phones

On the phone layout the floating calculator button MUST NOT cover the journal filter chips or the day total at any scroll position, and MUST be hidden while a category is being edited.

#### Scenario: Journal on a phone

- **GIVEN** a 375 px wide phone or a phone in landscape
- **WHEN** the user scrolls the journal so the «Карманы» chip or the day total reaches the bottom of the screen
- **THEN** the calculator button does not cover it

#### Scenario: Editing a category

- **WHEN** the user opens a category for editing on a 375 px wide phone
- **THEN** the calculator button is hidden until the editor closes

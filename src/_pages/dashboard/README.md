# Dashboard Page

Main application page that composes all dashboard widgets into a unified view.

## Public API (`index.ts`)

- `Dashboard`: Main page component that renders the expense tracking dashboard

## Components

### Header

- **Purpose:** Application header with month navigation and edit mode toggle
- **Store:** `useSessionStore` (viewDate, nextMonth, prevMonth), `useLayoutStore` (isEditMode, toggleEditMode)
- **UI:** "SmartSpend Terminal" title, month navigation arrows, edit layout button

### DashboardGrid

- **Purpose:** Renders widgets in configurable columns with drag-and-drop support
- **Store:** `useLayoutStore` (layoutConfig, moveWidget, moveWidgetInColumn, isEditMode)
- **Features:** HTML5 Drag & Drop for widget reordering when in edit mode

## State & Data

- **Store:** Uses `useLayoutStore` for grid configuration
- **Store:** Uses `useSessionStore` for date navigation
- **Actions:** Layout customization, month navigation, edit mode toggle

## Dependencies

- Uses: `@/widgets/calendar`, `@/widgets/expense-log`, `@/widgets/analysis`, `@/widgets/dynamics-chart`, `@/widgets/weekly-budget`, `@/widgets/savings`, `@/widgets/categories-settings`, `@/widgets/financial-settings`, `@/widgets/projects`
- Uses: `@/shared/lib` (WIDGET_REGISTRY, cn)
- Uses: `@/entities/session` (useSessionStore)
- Uses: `@/features/layout-editor` (useLayoutStore)

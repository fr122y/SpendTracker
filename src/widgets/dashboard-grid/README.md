# Dashboard Grid Widget

Responsive dashboard grid that renders widgets based on viewport size with drag-and-drop support on desktop.

## Public API (`index.ts`)

- `DashboardGrid`: Main dashboard grid component with responsive layouts for mobile, tablet, and desktop viewports

## State & Data

- `useLayoutConfig`: layout configuration from the DB-backed query cache
- `useEditMode`: local edit-mode state
- Local state: draggedWidget, dropTarget, activeWidget (ephemeral)

## Features

### Mobile Layout (< 768px)

- Full-screen widget list via `MobileWidgetList`
- Full-screen modal for selected widget via `MobileWidgetModal`
- No drag-and-drop functionality

### Tablet Layout (768-1024px)

- 2-column equal-width grid
- Static widget distribution
- No drag-and-drop or edit mode

### Desktop Layout (> 1024px)

- Multi-column with dynamic widths
- HTML5 drag-and-drop for widget reordering
- Column resizing via `ColumnResizer`
- Edit mode toggle
- Visual drop targets and drag feedback

## Dependencies

- Uses: `@/features/layout-editor`, `@/features/mobile-widget-list`, `@/features/mobile-widget-modal`
- Uses: `@/shared/lib`, `@/features/widget-registry`, `@/shared/ui`
- Uses: `lucide-react`
- Uses: `react`

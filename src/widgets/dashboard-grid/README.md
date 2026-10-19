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

- Inline accordion via `MobileWidgetAccordion`; expansion state is local
- The page scrolls as a whole: the grid has no own scroll and keeps `pb-20`
  clear of the floating calculator button
- Subscribes to `subscribeWidgetReveal`: a reveal request (a calendar day tap)
  expands the widget and scrolls to it
- No drag-and-drop functionality

### Before The Viewport Is Known

`useResolvedViewport` is `null` on the server and during hydration. The grid
then renders `DashboardGridSkeleton`, which picks its mobile, tablet, or
desktop shape with CSS media queries (`md`, `xl`), so phones never flash the
desktop tree and no widget mounts or fetches before the layout is chosen.

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

- Uses: `@/features/layout-editor`, `@/features/mobile-widget-accordion`
- Uses: `@/shared/lib`, `@/features/widget-registry`, `@/shared/ui`
- Uses: `lucide-react`
- Uses: `react`

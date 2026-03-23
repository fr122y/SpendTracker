# Layout Editor Feature

Dashboard layout customization with DB-backed layout state and an ephemeral
edit-mode toggle.

## Public API (`index.ts`)

- `useLayoutConfig`: Query hook for the current dashboard layout
- `useUpdateLayout`: Mutation hook for layout mutations
- `useEditMode`: Reatom-backed toggle for local edit mode
- `ColumnResizer`: Draggable handle for resizing columns
- `WidgetPlaceholder`: Drop zone wrapper for widgets

## State & Data

- **Source of truth:** Database for layout config
- **Client cache:** TanStack Query
- **Ephemeral UI state:** Reatom for edit mode only

## Components

### ColumnResizer

- Renders drag handle for column width adjustment
- Only visible in edit mode
- Uses HTML5 Drag API for resize calculation

### WidgetPlaceholder

- Wraps widgets with drag-and-drop functionality
- Shows drag handle in edit mode
- Highlights drop zone on drag over

## Notes

- Uses native HTML5 Drag & Drop API
- Column widths are percentages (0-100)
- Widgets can be moved between columns or reordered within a column

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`

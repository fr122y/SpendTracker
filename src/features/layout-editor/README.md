# Layout Editor Feature

Dashboard layout customization with drag-and-drop grid editing.

## Public API (`index.ts`)

- `useLayoutStore`: Zustand store for layout configuration
- `ColumnResizer`: Draggable handle for resizing columns
- `WidgetPlaceholder`: Drop zone wrapper for widgets

## State & Data

- **Store:** `useLayoutStore` (Persistence Key: `smartspend-layout`)
- **State:** `layoutConfig` (columns, widgets), `isEditMode`
- **Actions:** `moveWidget`, `moveWidgetInColumn`, `resizeColumn`, `toggleEditMode`

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

- Uses native HTML5 Drag & Drop API (no external dnd libs)
- Column widths are percentages (0-100)
- Widgets can be moved between columns or reordered within a column

## Dependencies

- Uses: `@/shared/types`, `@/shared/lib`

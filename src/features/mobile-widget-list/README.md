# Mobile Widget List

Renders a compact list of widget headers for mobile navigation. Tapping a widget opens it in a full-screen modal.

## Public API (`index.ts`)

- `MobileWidgetList`: Displays all widgets as a tappable list with icons, titles, and chevrons

## Props

- `widgets: WidgetId[]` - Array of widget IDs to display
- `onSelect: (widgetId: WidgetId) => void` - Callback when a widget is tapped

## Dependencies

- Uses: `@/shared/lib/widget-registry` for widget metadata (icons, titles)
- Uses: `@/shared/types` for WidgetId type

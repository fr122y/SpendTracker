# Mobile Widget Modal

**DEPRECATED:** This component is no longer used. Replaced by `MobileWidgetAccordion` for inline expandable widgets.

Full-screen modal for displaying widget content on mobile devices. Provides immersive, focused interaction with individual widgets.

## Public API (`index.ts`)

- `MobileWidgetModal`: Full-screen overlay that renders a widget with header controls

## Props

- `widgetId: WidgetId` - ID of the widget to display
- `onClose: () => void` - Callback when modal is closed

## Features

- Full-screen overlay with slide-in animation
- Header with back button, widget icon/title, and close button
- Swipe down gesture to close (100px threshold)
- Escape key support for closing
- Touch-friendly 44px minimum tap targets

## Dependencies

- Uses: `@/shared/lib/widget-registry` for widget component and metadata
- Uses: `@/shared/types` for WidgetId type

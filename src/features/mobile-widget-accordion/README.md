# Mobile Widget Accordion

Collapsible accordion interface for mobile dashboard navigation. Replaces modal-based navigation with inline expandable widgets.

## Public API (`index.ts`)

- `MobileWidgetAccordion`: Accordion component that renders a list of widgets with expand/collapse functionality

## Features

- **Multiple Expansion**: Supports multiple widgets expanded simultaneously
- **CSS Grid Animation**: Smooth transitions using `grid-template-rows` (no external animation libraries)
- **Keyboard Accessible**: Full keyboard navigation support with proper ARIA attributes
- **Chevron Indicators**: Dynamic icons (ChevronDown/ChevronUp) based on expansion state
- **No State Persistence**: Expansion state is managed by parent component (not persisted to localStorage)

## Props

```typescript
interface MobileWidgetAccordionProps {
  widgets: WidgetId[] // Array of widget IDs to render
  expandedWidgets: Set<WidgetId> // Set of currently expanded widgets
  onToggle: (widgetId: WidgetId, shouldExpand: boolean) => void // Toggle callback
}
```

## Usage Example

```tsx
import { MobileWidgetAccordion } from '@/features/mobile-widget-accordion'
import { useState } from 'react'

function Dashboard() {
  const [expandedWidgets, setExpandedWidgets] = useState<Set<WidgetId>>(
    new Set()
  )

  const handleToggle = (widgetId: WidgetId, shouldExpand: boolean) => {
    setExpandedWidgets((prev) => {
      const next = new Set(prev)
      shouldExpand ? next.add(widgetId) : next.delete(widgetId)
      return next
    })
  }

  return (
    <MobileWidgetAccordion
      widgets={['CALENDAR', 'EXPENSE_LOG', 'ANALYSIS']}
      expandedWidgets={expandedWidgets}
      onToggle={handleToggle}
    />
  )
}
```

## Animation Details

The accordion uses CSS Grid transitions for smooth expand/collapse animations:

- **Collapsed**: `grid-rows-[0fr]` - Content height collapses to zero
- **Expanded**: `grid-rows-[1fr]` - Content expands to full height
- **Transition**: `transition-[grid-template-rows] duration-300 ease-in-out`

The inner wrapper uses `overflow-hidden` to hide content during collapse.

## Accessibility

- **Navigation Landmark**: `<nav aria-label="Виджеты">`
- **ARIA Expanded**: Buttons have `aria-expanded` attribute reflecting state
- **Keyboard Support**: Full Tab navigation and Enter/Space activation
- **Focus Indicators**: Emerald focus rings matching app design system

## Dependencies

- Uses: `@/features/widget-registry` (widget metadata)
- Uses: `@/shared/types` (WidgetId type)
- Uses: `lucide-react` (ChevronDown, ChevronUp icons)

## Design Decisions

1. **Set-based State**: Uses Set for O(1) lookup performance on expansion checks
2. **Parent-Controlled**: Stateless component, parent manages expansion state
3. **No Persistence**: Unlike layout configuration, accordion state is ephemeral
4. **CSS-only Animation**: Avoids JavaScript animation libraries for performance

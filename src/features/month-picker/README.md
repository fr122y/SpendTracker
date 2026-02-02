# Month Picker

A modal component for selecting months and years with an intuitive grid-based interface.

## Public API (`index.ts`)

- `MonthPickerModal`: Modal dialog component for month/year selection with Russian localization

## Component Interface

```typescript
interface MonthPickerModalProps {
  isOpen: boolean
  currentDate: Date // The currently viewed date
  onSelectMonth: (date: Date) => void
  onClose: () => void
}
```

## Features

- **Month Grid**: 3x4 grid displaying all 12 months in Russian
- **Year Navigation**: Previous/Next buttons with ±5 year range limitation
- **Current Month Highlight**: Visual indication of the currently selected month
- **Keyboard Support**: Close modal with Escape key
- **Backdrop Click**: Close modal by clicking outside the content
- **Accessibility**: Full ARIA attributes, focus-visible states, and 44px touch targets
- **Animations**: Smooth fade-in/out transitions (200ms)

## State & Data

- **Store:** None (stateless feature component)
- **Props:** Receives `currentDate` from parent, preserves day of month when selecting new month/year

## Dependencies

- Uses: `@/shared/lib` (cn utility for class merging)
- Icons: `lucide-react` (X, ChevronLeft, ChevronRight)

## Usage Example

```tsx
import { MonthPickerModal } from '@/features/month-picker'
import { useState } from 'react'

function Calendar() {
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)
  const [viewDate, setViewDate] = useState(new Date())

  return (
    <>
      <button onClick={() => setIsMonthPickerOpen(true)}>
        {monthName} {year}
      </button>

      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        currentDate={viewDate}
        onSelectMonth={(date) => {
          setViewDate(date)
          setIsMonthPickerOpen(false)
        }}
        onClose={() => setIsMonthPickerOpen(false)}
      />
    </>
  )
}
```

## Styling

- **Overlay**: Fixed fullscreen with backdrop blur and semi-transparent black background
- **Content**: Zinc-900 background, rounded corners, border, responsive padding
- **Buttons**: 44px minimum touch targets for mobile accessibility
- **Current Month**: Blue-600 background with white text
- **Other Months**: Zinc-800 background with hover states

## Year Range

The year selector is limited to ±5 years from the current date's year to prevent excessive scrolling and maintain practical usage boundaries.

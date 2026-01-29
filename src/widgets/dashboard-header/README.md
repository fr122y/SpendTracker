# Dashboard Header Widget

Dashboard page header section with branding, month navigation, and edit mode toggle.

## Public API (`index.ts`)

- `DashboardHeader`: Composite header component with responsive layout

## State & Data

- **Stores:**
  - `useSessionStore`: viewDate, nextMonth, prevMonth for month navigation
  - `useLayoutStore`: isEditMode, toggleEditMode for dashboard editing
- **Viewport Detection:** Uses `useViewport` and `isMobile` for responsive behavior

## Features

- **Branding:** "SmartSpend Terminal" title with emerald accent
- **Month Navigation:**
  - Prev/Next buttons with ChevronLeft/ChevronRight icons
  - Localized month display (Russian format: "январь 2026")
  - Touch-friendly buttons on mobile (44×44px minimum)
- **Edit Mode Toggle:**
  - Desktop: Shows "Редактировать" / "Готово" button with icon (right side)
  - Mobile: Shows icon-only button in top row (right of title)
  - Primary variant when active, ghost variant when inactive
- **Responsive Layout:**
  - Mobile: Flex column with 2 rows (title+edit / navigation)
  - Desktop: Single flex row with 3 sections (title / navigation / edit)

## Dependencies

- Uses: `@/entities/session`, `@/features/layout-editor`, `@/shared/lib`, `@/shared/ui`
- Icons: `lucide-react` (ChevronLeft, ChevronRight, Edit3)

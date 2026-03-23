# Dashboard Header Widget

Dashboard page header section with branding, month navigation, and edit mode toggle.

## Public API (`index.ts`)

- `DashboardHeader`: Composite header component with responsive layout

## State & Data

- `useSessionStore`: viewDate, nextMonth, prevMonth for month navigation
- `useEditMode`: edit-mode toggle state for dashboard editing
- `useViewport` and `isMobile`: responsive behavior helpers

## Features

- Branding title with accent
- Month navigation with localized month display
- Touch-friendly buttons on mobile
- Edit mode toggle with desktop and mobile variants
- Responsive layout for mobile and desktop

## Dependencies

- Uses: `@/entities/session`, `@/features/layout-editor`, `@/shared/lib`, `@/shared/ui`
- Icons: `lucide-react`

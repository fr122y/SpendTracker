# Dashboard Header Widget

Dashboard page header section with branding, month navigation, and edit mode toggle.

## Public API (`index.ts`)

- `DashboardHeader`: Composite header component with responsive layout

## State & Data

- `useSessionStore`: selectedDate, nextDay, prevDay, setToday for date navigation
- `useEditMode`: edit-mode toggle state for dashboard editing
- `useViewport` and `isMobile`: responsive behavior helpers

## Features

- Branding title with accent
- Day navigation with localized full date display
- Quick return to today's date
- Month picker entry point from the selected date
- Touch-friendly buttons on mobile
- Edit mode toggle with desktop and mobile variants
- Responsive layout for mobile and desktop

## Dependencies

- Uses: `@/entities/session`, `@/features/layout-editor`, `@/shared/lib`, `@/shared/ui`
- Icons: `lucide-react`

# Dashboard Header Widget

Dashboard page header widget for branding, date navigation, month selection,
and dashboard edit-mode entry.

## Public API (`index.ts`)

- `DashboardHeader`: Header widget exported as a single container component

## Structure

- `DashboardHeader` is the container for the widget
- Internal presentation is split into private UI parts such as
  `DashboardHeaderView`, `HeaderBrand`, `HeaderDateNavigation`, and
  `HeaderActions`
- Presentation components receive prepared props and do not read stores
  directly
- `MonthPickerModal` stays connected at the container level

## State & Actions

- `useSessionStore`: source of truth for `selectedDate`, day navigation, and
  returning to today
- `useEditMode`: Reatom-backed edit-mode state and toggle for dashboard editing
- Local UI state in the container controls month-picker visibility

## Behavior

- Renders the dashboard brand/title area
- Displays the selected date using localized formatting
- Supports previous/next day navigation
- Opens `MonthPickerModal` from the date trigger
- Shows a `Today` shortcut only when the selected date is not today
- Exposes an edit-mode toggle for dashboard layout editing
- Keeps mobile-friendly touch targets, while responsive layout is handled in UI
  composition rather than via viewport-specific store logic

## Dependencies

- Uses: `@/entities/session`, `@/features/layout-editor`,
  `@/features/month-picker`, `@/shared/ui`
- Does not depend on `useLayoutStore` for edit mode
- Does not require `useViewport` in the header container
- Icons: `lucide-react`

# Dashboard Header Widget

Dashboard page header widget for branding, date navigation, month selection,
account navigation, and dashboard edit-mode entry.

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
- Links authenticated users to `/account`
- Displays the selected date using localized formatting
- Supports previous/next day navigation
- Opens `MonthPickerModal` from the date trigger
- Reserves the `Today` slot; the button is visible only when the selected date
  is not today, so other actions do not move
- Exposes an edit-mode toggle with a fixed width, hidden below 768 px (the
  layout editor is not available on phones)
- From 768 px the header is one flex row that cannot overlap: the brand
  truncates and the actions never shrink below their content; below 768 px the
  date navigation wraps to a second row
- Below 1280 px actions are 44 px icon buttons with Russian `aria-label` and
  `title`; from 1280 px they show text labels
- Layout is handled with CSS breakpoints, not viewport-specific store logic

## Dependencies

- Uses: `next/link`, `@/entities/session`, `@/features/layout-editor`,
  `@/features/month-picker`, `@/shared/ui`
- Does not depend on `useLayoutStore` for edit mode
- Does not require `useViewport` in the header container
- Icons: `lucide-react`

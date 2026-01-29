# Dashboard Page

Main application page that composes dashboard widgets into a unified view.

## Public API (`index.ts`)

- `Dashboard`: Main page component that renders the expense tracking dashboard

## Architecture

This is a **pure composition component** following FSD architecture principles. The page only composes two widgets:

1. **`DashboardHeader`** - Application header with branding, month navigation, and edit mode toggle
2. **`DashboardGrid`** - Responsive widget grid with drag-and-drop support on desktop

## Structure

```tsx
<div className="flex h-screen flex-col">
  <DashboardHeader />
  <main className="flex-1 overflow-hidden">
    <DashboardGrid />
  </main>
</div>
```

## Dependencies

- Uses: `@/widgets/dashboard-header` - Page header with navigation
- Uses: `@/widgets/dashboard-grid` - Widget grid layout

## Notes

This page follows FSD best practices by:

- Only composing widgets (no business logic)
- Being minimal (~16 lines) - just layout composition
- Delegating all functionality to widget layer components

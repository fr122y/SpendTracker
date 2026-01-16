# Part 7: App Integration & Dashboard Composition

## Step 7.1: React Query Provider

**1. Setup Query Client**
Create `src/shared/api/query-client.ts`:

- Instantiate `new QueryClient()` with default options (e.g., `staleTime: 60000`).

**2. Create Provider Wrapper**
Create `src/providers/index.tsx`:

- Import `QueryClientProvider` from `@tanstack/react-query`.
- Import the client instance.
- Export a `Providers` component that wraps children **only** in `QueryClientProvider`.
- **Note:** Zustand stores do not need React Context providers.

## Step 7.2: Widget Registry

Create `src/shared/lib/widget-registry.tsx`.

- Import all widget components from `@/widgets/...`.
- Create a constant `WIDGET_REGISTRY` mapping `WidgetId` string to the React component, Title, and Icon.
- Example: `CALENDAR: { component: Calendar, title: 'Календарь', icon: CalendarIcon }`.

## Step 7.3: Dashboard Page Composition

Create `src/_pages/dashboard/ui/Dashboard.tsx`.

- Structure:
  - `<Header />`
  - `<main><DashboardGrid /></main>`

**1. Header Component**

- **Connect:** `useSessionStore` (viewDate, nextMonth, prevMonth, setViewDate), `useLayoutStore` (isEditMode, toggleEditMode, resetLayout).
- **UI:**
  - "SmartSpend Terminal" Title.
  - Month Navigation: `< Button` [Month Year] `Button >`.
  - "Edit Layout" toggle button.

**2. Dashboard Grid Component**

- **Connect:** `useLayoutStore` (layoutConfig, moveWidget, isEditMode).
- **Logic:**
  - Render columns based on config.
  - Inside columns, map through `widgets` IDs.
  - Look up component in `WIDGET_REGISTRY`.
  - **Drag & Drop:** Implement standard HTML5 Drag & Drop (onDragStart, onDrop) to reorder widgets if `isEditMode` is true.

## Step 7.4: App Entry Points

**1. Root Layout (`src/app/layout.tsx`)**

- Wrap `{children}` with the `<Providers>` component created in Step 7.1.
- Apply `Inter` and `JetBrains Mono` fonts via CSS variables.
- Set background to `bg-zinc-950` and text to `text-zinc-200`.

**2. Home Page (`src/app/page.tsx`)**

- Import `Dashboard` from `@/_pages/dashboard`.
- Return `<Dashboard />`.

**Action:** implementation of the App layer.

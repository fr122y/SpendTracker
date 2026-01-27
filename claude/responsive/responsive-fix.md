# Responsive Design Implementation Plan

## Overview

Transform SmartSpend Tracker from desktop-only to fully responsive across all devices.

**Target Viewports:**

- Mobile: 320px - 767px
- Tablet: 768px - 1279px
- Desktop: 1280px+

---

## Phase 1: Foundation (Shared Layer)

### Step 1.1: Create Viewport Detection Hook

**File:** `src/shared/lib/hooks/use-viewport.ts`

Create a reusable hook to detect current viewport:

```tsx
type Viewport = 'mobile' | 'tablet' | 'desktop'

export function useViewport(): Viewport
```

- Returns 'mobile' for < 768px
- Returns 'tablet' for 768px - 1279px
- Returns 'desktop' for >= 1280px
- Uses resize event listener with debounce
- SSR-safe (default to 'desktop')

### Step 1.2: Create Responsive Container Component

**File:** `src/shared/ui/responsive-container.tsx`

Wrapper component with responsive padding:

- Mobile: `p-3` (12px)
- Tablet: `p-4` (16px)
- Desktop: `p-6` (24px)

### Step 1.3: Update TerminalPanel for Responsive Padding

**File:** `src/shared/ui/terminal-panel.tsx`

Change fixed `p-6` to responsive: `p-3 sm:p-4 lg:p-6`

---

## Phase 2: Dashboard Layout

### Step 2.1: Make Dashboard Header Responsive

**File:** `src/_pages/dashboard/ui/dashboard.tsx`

Current layout (horizontal):

```
[Title] [Navigation Tabs] [Add Button]
```

Mobile layout (stacked):

```
[Title]
[Navigation Tabs]
[Add Button - full width or FAB]
```

Changes:

- Wrap header in flex with `flex-col sm:flex-row`
- Make navigation tabs scrollable on mobile
- Convert "Add" button to FAB or full-width on mobile

### Step 2.2: Make Dashboard Grid Responsive

**File:** `src/_pages/dashboard/ui/dashboard.tsx`

Current: Multi-column with percentage widths (breaks on mobile)

Target behavior:

- **Mobile (< 768px):** Single column, full width, vertical scroll
- **Tablet (768px - 1279px):** 2 columns max
- **Desktop (>= 1280px):** User-defined columns (current behavior)

Implementation:

1. Use `useViewport()` hook
2. On mobile: Render widgets in single stacked column
3. On tablet: Render max 2 columns
4. On desktop: Keep current multi-column behavior
5. Hide column resizers on mobile/tablet

### Step 2.3: Hide Column Management on Mobile

**File:** `src/_pages/dashboard/ui/dashboard.tsx`

- Hide "Add Column" button on mobile
- Hide column resize handles on mobile/tablet
- Hide column delete buttons on mobile

---

## Phase 3: Widget Responsiveness

### Step 3.1: Update ExpenseLog Widget

**File:** `src/widgets/expense-log/ui/expense-log.tsx`

Changes:

- Header: Stack title and actions vertically on mobile
- List items: Adjust padding `p-2 sm:p-3`
- Amount text: Smaller on mobile `text-base sm:text-lg`
- Category badges: Wrap instead of overflow

### Step 3.2: Update WeeklyBudget Widget

**File:** `src/widgets/weekly-budget/ui/weekly-budget.tsx`

Changes:

- Progress bars: Full width on all viewports
- Stats grid: `grid-cols-2` on mobile, `grid-cols-4` on desktop
- Font sizes: Scale down on mobile

### Step 3.3: Update Calendar Widget

**File:** `src/widgets/calendar/ui/calendar.tsx`

Changes:

- Day cells: Minimum 44px touch target
- Month navigation: Larger touch targets
- Day names: Abbreviate on mobile (Пн, Вт vs Понедельник)
- Selected day info: Stack below calendar on mobile

### Step 3.4: Update MonthlyOverview Widget

**File:** `src/widgets/monthly-overview/ui/monthly-overview.tsx`

Changes:

- Chart: Reduce height on mobile
- Legend: Stack vertically on mobile
- Values: Smaller font on mobile

### Step 3.5: Update ProjectsSection Widget

**File:** `src/widgets/projects-section/ui/projects-section.tsx`

Changes:

- Project cards: Full width on mobile
- Grid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- Card actions: Larger touch targets

### Step 3.6: Update SettingsPanel Widget

**File:** `src/widgets/settings-panel/ui/settings-panel.tsx`

Changes:

- Form layout: Full width inputs on mobile
- Save button: Full width on mobile
- Section spacing: Reduce on mobile

---

## Phase 4: Features Responsiveness

### Step 4.1: Update AddExpense Feature

**File:** `src/features/add-expense/ui/add-expense-form.tsx`

Changes:

- Form layout: Stack vertically on mobile
- Input fields: Full width on mobile
- Submit button: Full width on mobile
- Amount input: Larger font for easier input

### Step 4.2: Update EditExpense Feature

**File:** `src/features/edit-expense/ui/edit-expense-modal.tsx`

Changes:

- Modal: Full screen on mobile, centered on desktop
- Close button: Larger touch target
- Form fields: Same as AddExpense

### Step 4.3: Update CategorySelect Feature

**File:** `src/features/category-select/ui/category-select.tsx`

Changes:

- Dropdown: Full width on mobile
- Options: 48px height for touch
- Icons: Adequate spacing

---

## Phase 5: Navigation & Global UI

### Step 5.1: Create Mobile Navigation

**File:** `src/widgets/mobile-nav/ui/mobile-nav.tsx` (new)

Create bottom navigation bar for mobile:

- Fixed to bottom
- 4-5 main navigation items
- 56px height minimum
- Active state indication

### Step 5.2: Update Page Tabs

**File:** `src/_pages/dashboard/ui/dashboard.tsx`

Changes:

- Horizontal scroll on mobile
- Active tab indicator
- Touch-friendly sizing (48px height)

### Step 5.3: Responsive Typography Scale

**File:** `src/app/globals.css`

Add responsive typography utilities:

```css
/* Headings */
.text-responsive-xl {
  @apply text-lg sm:text-xl lg:text-2xl;
}
.text-responsive-lg {
  @apply text-base sm:text-lg lg:text-xl;
}
.text-responsive-base {
  @apply text-sm sm:text-base;
}
```

---

## Phase 6: Touch Optimization

### Step 6.1: Verify Touch Targets

Audit all interactive elements for 44x44px minimum:

- Buttons
- Links
- Form inputs
- Drag handles
- Close icons

### Step 6.2: Update Drag Handles

**File:** `src/_pages/dashboard/ui/dashboard.tsx`

Changes:

- Larger drag handle area on touch devices
- Visual feedback on touch
- Consider disabling drag-to-reorder on mobile

### Step 6.3: Swipe Actions (Optional)

Consider adding swipe-to-delete for expense items on mobile.

---

## Phase 7: Testing & Validation

### Step 7.1: Manual Testing Checklist

Test on these viewports:

- [ ] iPhone SE (375px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPhone 14 Pro Max (430px)
- [ ] iPad Mini (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1280px)
- [ ] Large Desktop (1920px)

### Step 7.2: Automated Tests

Update Playwright tests:

- Add viewport-specific test scenarios
- Test navigation on mobile
- Test form submission on mobile
- Test drag-and-drop disabled on mobile

### Step 7.3: Performance Check

- Verify no layout shifts on resize
- Check for smooth transitions between breakpoints
- Ensure no horizontal scrollbar appears

---

## Implementation Order

| Order | Task                                  | Priority | Complexity |
| ----- | ------------------------------------- | -------- | ---------- |
| 1     | Step 1.1: useViewport hook            | P0       | Low        |
| 2     | Step 2.2: Dashboard grid responsive   | P0       | High       |
| 3     | Step 2.1: Dashboard header responsive | P0       | Medium     |
| 4     | Step 1.3: TerminalPanel padding       | P1       | Low        |
| 5     | Step 3.1: ExpenseLog widget           | P1       | Medium     |
| 6     | Step 3.2: WeeklyBudget widget         | P1       | Medium     |
| 7     | Step 3.3: Calendar widget             | P1       | Medium     |
| 8     | Step 4.1: AddExpense form             | P1       | Low        |
| 9     | Step 4.2: EditExpense modal           | P1       | Low        |
| 10    | Step 5.2: Page tabs                   | P2       | Low        |
| 11    | Step 3.4-3.6: Other widgets           | P2       | Medium     |
| 12    | Step 6.1-6.3: Touch optimization      | P2       | Medium     |
| 13    | Step 7: Testing                       | P0       | Medium     |

---

## Success Criteria

- [ ] No horizontal scroll on any viewport
- [ ] All interactive elements >= 44x44px on mobile
- [ ] Single column layout on mobile (< 768px)
- [ ] Two column max on tablet (768px - 1279px)
- [ ] Full functionality preserved on desktop
- [ ] All forms usable on mobile
- [ ] Navigation accessible on all devices
- [ ] No layout shifts during viewport changes

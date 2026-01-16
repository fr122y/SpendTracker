# Part 9: Implementation Roadmap (Checklist)

**Rule:** Follow the **TDD Cycle** (Red -> Green -> Refactor) for every step.

### Phase 1: Foundation & Shared

1.  **Setup:** Next.js 16, Tailwind v4, ESLint, Prettier (scaffolding).
2.  **Infra:** Jest, MSW, Playwright setup.
3.  **Shared:** Implement `src/shared/types` and `finance-selectors.ts` (Pure functions, easy to test).
4.  **UI:** Implement `Button`, `Input`, `TerminalPanel` in `src/shared/ui` (Visual tests).

### Phase 2: Entities (Zustand Stores)

_Focus: Unit testing Store Actions and Persistence._

1.  **Expense:** Store (add/remove) + `ExpenseCard` UI.
2.  **Category:** Store (defaults) + `CategoryBadge` UI.
3.  **Project:** Store + `ProjectCard` UI.
4.  **Bucket:** Store (savings).
5.  **Settings:** Store (`weeklyLimit`, `salaryDay`).
6.  **Session:** Store (`selectedDate`, `viewDate`).

### Phase 3: Server Side (API)

1.  **Environment:** Secure `.env.local` setup.
2.  **Action:** Implement `categorizeExpenseAction` (`src/shared/api/ai-action.ts`).
3.  **Mock:** Create a manual mock for the Server Action to be used in client tests.

### Phase 4: Features (Logic & Mutations)

_Focus: Integration testing with React Query._

1.  **Add Expense:** Implement `ExpenseForm` with `useMutation` connecting to `categorizeExpenseAction`.
2.  **Managers:** Implement `CategoryManager`, `ProjectForms`, `BucketEditor` connected to Zustand stores.
3.  **Layout Logic:** Implement `useLayoutStore` (drag-drop logic).

### Phase 5: Widgets (Composition)

_Focus: Wiring Stores to UI._

1.  **Calendar:** Connect Session & Settings stores.
2.  **Log & Analysis:** Connect Expense store & Selectors.
3.  **Charts:** Dynamics & Weekly Budget widgets.
4.  **Settings:** Wrappers for Feature components.

### Phase 6: App Assembly

1.  **Registry:** `widget-registry.tsx`.
2.  **Layout:** Root layout with `QueryClientProvider`.
3.  **Dashboard:** Header + Grid + Drag & Drop implementation.

### Phase 7: Verification (E2E)

1.  **Smoke Test:** App loads, renders dashboard.
2.  **Flow:** Add Expense (Mocked AI) -> Verify in List -> Verify in Chart.
3.  **Persist:** Reload page -> Verify data remains (Zustand persist).

**Action:** Execute implementation in this exact order.

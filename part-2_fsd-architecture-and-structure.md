# Part 2: FSD Architecture & Structure

## Step 2.1: Directory Structure (FSD)

Create the following directory structure inside `src/` strictly following **Feature-Sliced Design** principles.

**1. App Layer (`src/app/`)**

- `layout.tsx`: Root layout containing **only** the `QueryClientProvider` (TanStack Query) wrap.
- `page.tsx`: Entry point that strictly imports the dashboard widget/page from `_pages`.
- `globals.css`: Tailwind v4 imports.

**2. Pages Layer (`src/_pages/`)**

- `dashboard/`: The main page slice containing the Dashboard UI composition.

**3. Widgets Layer (`src/widgets/`)**

- Compositional units that combine features and entities.
- Slices: `calendar`, `expense-log`, `analysis`, `dynamics-chart`, `weekly-budget`, `savings`, `categories-settings`, `financial-settings`, `projects`.

**4. Features Layer (`src/features/`)**

- User interactions requiring async logic (Server Actions) or mutations.
- Slices: `add-expense`, `manage-categories`, `manage-projects`, `manage-buckets`, `layout-editor`.

**5. Entities Layer (`src/entities/`)**

- Business domain models. **State management via Zustand lives here.**
- Slices: `expense`, `category`, `project`, `bucket`.
- Each slice must contain a `model/store.ts` (Zustand store).

**6. Shared Layer (`src/shared/`)**

- `api/`: Contains **Server Actions** (`'use server'`) acting as the API layer.
- `lib/`: Utilities (date formatting, currency, etc.).
- `ui/`: Reusable "dumb" UI components (Button, Input, Card).
- `types/`: Global TypeScript definitions.

**7. Testing & E2E**

- `src/test/`: Test setup and generic mocks.
- `e2e/`: Playwright tests (at project root).

## Step 2.2: Architecture Rules

1.  **State Management:**
    - Use **Zustand** for all client-side global state (Expenses, Categories).
    - Stores must be located in `entities/{slice}/model/store.ts`.
    - Use `persist` middleware for data that requires strictly local persistence (e.g., layout config), but prefer fetching data via Server Actions for business entities.
2.  **Async Data:**
    - Use **TanStack Query** (`useQuery`, `useMutation`) in Features/Widgets to call Server Actions.
3.  **Public API:**
    - Every slice must have an `index.ts` file exposing only necessary components/stores.
    - **Rule:** Never import from internal paths (e.g., `import ... from 'entities/expense/ui/Card'`). Always use the public API: `import ... from '@/entities/expense'`.
4.  **Client Components:**
    - Mark components using Zustand hooks or React Query as `'use client'`.

## Step 2.3: TDD Strategy

**Cycle:** Red (Write Test) -> Green (Write Code) -> Refactor.

**Testing Scope:**

1.  **Zustand Stores:** Test actions and state updates in isolation (unit tests).
2.  **Server Actions:** Mock the AI/DB calls and test the action logic.
3.  **UI Components:** Use _React Testing Library_ to test interaction (clicks, form submission).
4.  **Integration:** Use _MSW_ to mock Server Action network responses if needed, or mock the import of the server action directly.

**Action:** Scaffold this folder structure and create empty `index.ts` files for the defined slices.

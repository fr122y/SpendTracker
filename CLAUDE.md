# SmartSpend Tracker - Project Context

**Role:** Senior Frontend Architect & Engineer
**Task:** Build a production-ready Personal Finance SPA.
**Language:** TypeScript, Next.js 16
**UI Language:** Russian (Ru)

## Tech Stack & Architecture (STRICT)

1.  **Framework:** Next.js 16 (App Router) + React 19.
2.  **Styling:** Tailwind CSS v4 (Zero config, CSS-first).
3.  **State Management:**
    - **Reatom v1000+** (`@reatom/core@latest`, `@reatom/react`) for Client State. See **Reatom v1000 Rules** section below. **Context API is FORBIDDEN** for global state.
    - **TanStack Query v5** for Async/Server State.
    - **Optimistic Mutations Required:** All user-visible TanStack Query mutations must implement `onMutate`, rollback in `onError`, and `invalidateQueries` in `onSettled`.
    - **No `useEffect`** for storage synchronization.
4.  **Backend/AI:**
    - **Server Actions** (`'use server'`) ONLY. No API Routes.
    - **OpenAI SDK** (Universal client for DeepSeek/OpenAI).
    - **Security:** Keys in `.env.local` (Server-side only). No `NEXT_PUBLIC_` keys.
5.  **Architecture:** Feature-Sliced Design (FSD).

## Documentation Rules (CRITICAL)

**Rule:** Every FSD slice (folder inside `entities`, `features`, `widgets`, `shared`) MUST contain a `README.md` file (Micro-Documentation).

**Action:** When you implement a slice (e.g., `entities/expense`), you must immediately create its `README.md` following this template:

```markdown
# [Slice Name]

[Brief purpose description]

## Public API (`index.ts`)

- `ComponentName`: [What it does]
- `useHookName`: [What data it provides]

## State & Data

- **Store:** [Reatom Store Name] (Persistence Key: `smartspend-...`)
- **Actions:** [List main actions]

## Dependencies

- Uses: [List other slices used by this module]
```

## Architecture Map

Refer to and **maintain** these guides as you build:

- **[Entities & State Rules](src/entities/README.md)** → Business logic, Reatom stores definition.
- **[Features & Mutations](src/features/README.md)** → User interactions, Async forms, Fallback logic.
- **[Widgets & Composition](src/widgets/README.md)** → Dashboard assembly, Grid logic.
- **[Shared & API](src/shared/README.md)** → Server Actions, UI Kit, Utilities.

## Build & Test Commands

```bash
npm run dev        # Start Next.js dev server
npm run validate   # Run Typecheck + Lint + Tests (Run before commit!)
npm run test       # Run Unit tests (Jest)
npm run test:e2e   # Run E2E tests (Playwright)
```

## Coding Standards

- **TDD First:** Always write the test file (`__tests__`) _before_ the implementation.
- **Hydration:** Use `next/dynamic` with `{ ssr: false }` for components dependent on localStorage.
- **Naming:**
  - Components: `PascalCase` (e.g., `ExpenseCard`).
  - Files: `kebab-case` (e.g., `expense-card.tsx`).
  - Stores: `use[Entity]Store`.
- **Drag & Drop:** Use native HTML5 API (no external dnd libs).

## Reatom v1000 — Critical Rules

> **Reatom v1000 removed explicit context (`ctx`).** Context is now implicit. Before writing any Reatom code, verify the current API via context7 or https://v1000.reatom.dev.

**NEVER use (v3/v4 API — does not exist in v1000):**

| Obsolete (v3/v4)              | Replacement (v1000)             |
| ----------------------------- | ------------------------------- |
| `ctx.spy(atom)`               | `atom()` inside reactive scope  |
| `ctx.get(atom)`               | `peek(atom)`                    |
| `atom(ctx, newState)`         | `atom.set(newState)`            |
| `ctx.schedule(() => promise)` | `wrap(promise)`                 |
| `reatomAsync(ctx => ...)`     | `action(async () => { ... })`   |
| `createCtx()`                 | `context.start(fn)` (SSR/tests) |

**Key primitives:** `atom`, `computed`, `action`, `effect`, `wrap`, `peek`.

**SSR/Provider:** Use `context.start()` for isolated context per request. `reatomContext.Provider` is used in `src/shared/lib/reatom/provider.tsx`.

**Data flow:**

- Mutations: Reatom `action` → Server Action → DB/API.
- Reads: Server Component fetch → pass as props → `atom.set(initialData)` in Client Component.

## Key Features Overview

- **Expenses:** Managed via `useExpenseStore`. Can be personal or linked to a Project.
- **AI Categorization:** Done via Server Action. Optimistic updates or "Other" fallback on error.
- **Dashboard:** Customizable grid layout. Config persisted in `useLayoutStore`.
- **Settings:** Financial settings (Salary Day, Limits) persisted in `useSettingsStore`.

# Project Brief

SmartSpend Tracker is a personal finance application for expense tracking,
budget management, project budgets, savings buckets, analytics, and
categorization workflows. The user interface is Russian.

## Stack

- Next.js 16 App Router and React 19.
- TypeScript, Tailwind CSS v4, Jest, React Testing Library, Playwright.
- Feature-Sliced Design under `src/`.
- Reatom for global and ephemeral client state.
- TanStack Query for async and server state.
- Server Actions for backend and AI/backend integration.
- Drizzle ORM, PostgreSQL, and NextAuth/Auth.js for persisted user data and
  authentication.

## Architecture Rules

- Dependency direction is strict:
  `shared -> entities -> features -> widgets -> _pages/app`.
- Do not introduce React Context for app state.
- User-visible TanStack Query mutations must use optimistic updates with
  rollback and refetch.
- Backend and AI integrations must use Server Actions, not API Routes.
- Secrets belong in `.env.local` and must not use `NEXT_PUBLIC_` for API keys.
- UI that depends on localStorage should be isolated behind
  `next/dynamic(..., { ssr: false })`.

## Validation

Use `npm run validate` before PRs for application changes. Use
`python3 scripts/validate_task_tracker.py` after task tracker changes.

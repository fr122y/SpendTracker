# Repository Guidelines

## Project Structure & Architecture Rules

The codebase follows Feature-Sliced Design in `src/`: `app`, `_pages`, `entities`, `features`, `widgets`, `shared`, `providers`.

Dependency direction is strict: `shared -> entities -> features -> widgets -> _pages/app`.

Non-negotiable rules from project context:

- Global state uses **Reatom** only (`@reatom/react`); do not introduce Context API for app state.
- Async/server state uses **TanStack Query**.
- AI/backend integration must use **Server Actions** (`'use server'`) only; no API Routes.
- Keep secrets in `.env.local` (server side only), never `NEXT_PUBLIC_` for API keys.
- For localStorage-dependent UI, prefer `next/dynamic` with `{ ssr: false }`.

## Build, Test, and Development Commands

- `npm run dev`: start local app (`http://localhost:3000`).
- `npm run build` / `npm run start`: production build and run.
- `npm run typecheck`: TypeScript checks.
- `npm run lint`: ESLint with zero warnings.
- `npm run test`: Jest unit/integration tests.
- `npm run test:e2e`: Playwright end-to-end suite.
- `npm run validate`: required pre-PR gate (`typecheck + lint + test`).

## Coding Style & Naming

- TypeScript-first; Prettier defaults: 2 spaces, single quotes, no semicolons, 80 cols.
- Imports are ordered and grouped (enforced by ESLint).
- Components: `PascalCase` (example: `ExpenseCard`).
- Files: `kebab-case` (example: `expense-card.tsx`).
- Stores: `use[Entity]Store` naming.

## Testing Guidelines

- Prefer TDD: create/update tests before implementation changes.
- Unit/UI tests live in `__tests__` as `*.test.ts(x)`.
- E2E tests live in `e2e/` as `*.spec.ts`.
- Coverage threshold is 70% globally (branches/functions/lines/statements).

## Slice Documentation Requirement

Every FSD slice under `entities`, `features`, `widgets`, and `shared` must include a local `README.md` describing purpose, public API (`index.ts`), state/actions, and dependencies.

## Commit & Pull Request Guidelines

- Use concise, imperative commits, preferably `type: description` (`fix:`, `refactor:`, `test:`, `docs:`).
- PRs should include scope summary, linked task/issue, UI evidence for visual changes, and confirmation that `npm run validate` passes.

## Preview QA Credentials

- Email: `qa.skeleton.preview.20260324@yandex.ru`
- Password: `SkelTest#2026`

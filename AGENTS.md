# Repository Guidelines

Guidance for agents working on SmartSpend Tracker code.

## Repository workflow

- Before changing behavior, read the relevant code, tests, contracts, local
  instructions, and targeted Git history.
- Keep each change scoped to one logical outcome. Avoid unrelated refactoring,
  dependency updates, and neighboring fixes.
- Make changes on a scoped branch with the `task/` prefix and open a pull
  request for review. Do not commit, merge, or push directly to `main` without
  explicit owner approval.
- Before reporting work ready for review, inspect the full diff for scope,
  regressions, documentation, and verification gaps.
- Run `npm run validate` for application changes. Use the repository's native
  checks for other changes and state any skipped checks.
- Pull request titles and squash commit titles follow
  `docs/engineering/change-request.md`: `<type>(<scope>): <description>`.
- Do not leave meaningful changes uncommitted unless the owner asks for work in progress.

## Project Structure & Architecture Rules

The codebase follows Feature-Sliced Design in `src/`: `app`, `_pages`,
`entities`, `features`, `widgets`, `shared`, `providers`.

Dependency direction is strict: `shared -> entities -> features -> widgets ->
_pages/app`.

Non-negotiable rules from project context:

- Global state uses **Reatom** only (`@reatom/react`); do not introduce Context
  API for app state.
- Async/server state uses **TanStack Query**.
- All user-visible TanStack Query mutations must use optimistic updates
  (`onMutate` + rollback in `onError` + refetch in `onSettled`).
- AI/backend integration must use **Server Actions** (`'use server'`) only; no
  API Routes.
- Keep secrets in `.env.local` (server side only), never `NEXT_PUBLIC_` for API
  keys.
- For localStorage-dependent UI, prefer `next/dynamic` with `{ ssr: false }`.

## Build, Test, And Development Commands

- `npm run dev`: start local app (`http://localhost:3000`).
- `npm run build` / `npm run start`: production build and run.
- `npm run typecheck`: TypeScript checks.
- `npm run lint`: ESLint with zero warnings.
- `npm run test`: Jest unit/integration tests.
- `npm run test:e2e`: Playwright end-to-end suite.
- `npm run validate`: required pre-PR gate (`typecheck + lint + test`).

## Coding Style & Naming

- TypeScript-first; Prettier defaults: 2 spaces, single quotes, no semicolons,
  80 cols.
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

Every FSD slice under `entities`, `features`, `widgets`, and `shared` must
include a local `README.md` describing purpose, public API (`index.ts`),
state/actions, and dependencies.

## Documentation Rules

- Keep compact durable context in `docs/context/`.
- Keep architecture and design decisions in `docs/decisions/`.
- Update `docs/context/OPEN_QUESTIONS.md` when assumptions or unresolved
  issues appear.

## Commit & Pull Request Guidelines

- Use concise, imperative commits, preferably `type: description` (`fix:`,
  `refactor:`, `test:`, `docs:`).
- PRs should include scope summary, relevant context, UI evidence for visual
  changes, and confirmation that `npm run validate` passes.

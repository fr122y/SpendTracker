# Repository Guidelines

Guidance for AI agents working on SmartSpend Tracker.

## AI Development Operating System

For project status or meaningful work, start with the lightweight task
entrypoint:

1. Read `docs/planning/STATUS.md`.
2. Read `docs/planning/tasks.md`.
3. Read `docs/planning/tasks.yml` when task state, dependencies, write scope,
   or validation matter.
4. Read only the required context listed for the active task.

Do not scan all docs by default.

Meaningful implementation work requires a task ID in
`docs/planning/tasks.yml`. If the requested work has no task ID, first capture
or shape the task unless the request is a small direct answer.

Use scoped branches and pull requests for project changes. Use the `task/`
branch prefix unless the human owner requests another prefix.

Mandatory project-change gates:

- Dirty worktree gate: after meaningful file edits, do not end with unstaged or
  uncommitted changes unless the human owner asks to leave work in progress.
- Branch gate: project changes must happen on a scoped branch, not directly on
  `main`.
- PR gate: after committing and pushing a scoped branch, create or update the
  pull request before reporting the task as ready for review or merge.
- Direct-main stop rule: do not merge into, commit on, or push directly to
  `main` without explicit approval for that exact exception.
- Cleanup gate: after a PR merge or documented direct-merge exception, delete
  or reconcile obsolete task branches and remote-tracking references when safe.

Task IDs are identifiers, not execution order. Pick work by status,
dependencies, blockers, phase, priority, current focus, and human direction.

Keep implemented work in `review` until review, verification, PR state, and
merge readiness are clear. Mark a task `done` only after it is reviewed, merged
to the stable branch, and reconciled in the local task ledger and project
memory.

Use `.codex/skills/project-task-tracking/` for task tracking, issue authoring,
roadmap control, sprint updates, project review, Definition of Ready/Done
checks, and AI agent handoffs.

The skill is a procedural shortcut. The source of truth remains
`docs/planning/task-tracking.md`.

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
- `python3 scripts/validate_task_tracker.py`: validate task tracker integrity.

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
- Keep task state in `docs/planning/tasks.yml`.
- Keep the human-readable task registry in `docs/planning/tasks.md`.
- Update `docs/planning/project-log.md` after meaningful milestones.
- Update `docs/context/OPEN_QUESTIONS.md` when assumptions or unresolved
  issues appear.
- Use `python3 scripts/generate.py task-run ...` for task-run reports and
  `python3 scripts/generate.py task-draft ...` for pre-ledger task drafts.

## Commit & Pull Request Guidelines

- Use concise, imperative commits, preferably `type: description` (`fix:`,
  `refactor:`, `test:`, `docs:`).
- PRs should include scope summary, linked task/issue, UI evidence for visual
  changes, and confirmation that `npm run validate` passes.
- Task tracker changes should confirm
  `python3 scripts/validate_task_tracker.py` passes.

## Preview QA Credentials

- Email: `qa.skeleton.preview.20260324@yandex.ru`
- Password: `SkelTest#2026`

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

Owner-approved process exceptions without a new ledger task are allowed only
when the human owner explicitly grants the exception for that exact change. The
exception must still use a scoped branch, pull request, validation, and project
memory updates unless the owner explicitly narrows those gates too.

Use scoped branches and pull requests for project changes. Use the `task/`
branch prefix unless the human owner requests another prefix.

One task should produce one logical change set. Do not include unrelated
cleanup, opportunistic refactoring, dependency updates, or neighboring bug
fixes unless the task explicitly requires them.

Before changing existing behavior, read the relevant code, tests, contracts,
instructions, and targeted Git history for the affected area.

Pull request titles and squash commit titles must follow
`docs/engineering/change-request.md`: `<type>(<scope>): <description>`.
Non-trivial squash commits must include a body that explains why the change was
needed, what changed, why this approach was chosen, risks, and references.

Mandatory project-change gates:

- Dirty worktree gate: after meaningful file edits, do not end with unstaged or
  uncommitted changes unless the human owner asks to leave work in progress.
- Branch gate: project changes must happen on a scoped branch, not directly on
  `main`.
- PR gate: after committing and pushing a scoped branch, create or update the
  pull request before reporting the task as ready for review or merge.
- Direct-main stop rule: do not merge into, commit on, or push directly to
  `main` without explicit approval for that exact exception. The direct docs
  reconciliation exception below is pre-approved only for its narrow scope.
- Self-review gate: before reporting non-trivial work as complete, review the
  full diff against task scope, acceptance criteria, regressions, tracker
  consistency, docs, verification, and PR readiness.
- Cleanup gate: after a PR merge or documented direct-merge exception, delete
  or reconcile obsolete task branches and remote-tracking references when safe.

Default merge mode:

- When the human asks to "merge by the rules", use Compact Merge Flow unless
  they explicitly ask for strict merge handling.
- Compact Merge Flow means: verify the PR is mergeable and required checks are
  successful, merge the PR, delete/prune obsolete branches, reconcile the
  tracker once, and report the result concisely.
- Do not create cascading reconciliation PRs for non-blocking stale status
  text. Fix all post-merge tracker/status updates in the same reconciliation
  step, or carry minor stale text into the next task if it does not invalidate
  the task ledger.
- Do not wait on pending external checks for more than 60 seconds unless the
  human explicitly asks to complete that merge in the same turn.

Direct docs reconciliation exception:

- After a feature/process PR has merged, the agent may commit directly to
  `main` only for post-merge tracker reconciliation under `docs/planning/**`.
- This exception may update `tasks.yml`, `tasks.md`, `STATUS.md`,
  `project-log.md`, and task-run reports. It must not change application code,
  migrations, tests, configs, or non-planning docs.
- Before and after this direct docs reconciliation, run
  `python3 scripts/validate_task_tracker.py`; if it fails, stop and report
  instead of pushing.

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
`docs/planning/task-tracking.md` and `docs/engineering/`.

Detailed workflow references:

- Adoption audit: `docs/engineering/adoption-audit.md`
- Agent workflow: `docs/engineering/agent-workflow.md`
- Pull requests and commit history:
  `docs/engineering/change-request.md`
- Self-review: `docs/engineering/code-review.md`
- GitHub platform settings: `docs/engineering/platform-settings.md`

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

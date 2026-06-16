# Adoption Audit: SmartSpend Tracker

Date: 2026-06-16

Project slug: `spend-tracker`

Audit task: owner-approved process exception without a new task ledger entry.

## Repository Facts

- Platform: GitHub.
- Default branch: `main`.
- Monorepo: no.
- Versioned artifact: no public package or release artifact; private Next.js
  application.
- Primary stack: Next.js 16, React 19, TypeScript, Tailwind CSS, Jest,
  Playwright, Drizzle ORM, PostgreSQL, NextAuth/Auth.js.
- Important project-specific constraints: Feature-Sliced Design under `src/`,
  Reatom for app state, TanStack Query for async/server state, Server Actions
  for backend integration, secrets in `.env.local`.

## Tooling Commands

- Package manager: npm with `package-lock.json`.
- Install: `npm ci`.
- Lint: `npm run lint`.
- Typecheck: `npm run typecheck`.
- Test: `npm run test`.
- Build: `npm run build`.
- Other required checks: `npm run validate` for app changes and
  `python3 scripts/validate_task_tracker.py` after task tracker changes.

## Existing Workflow

- Instructions: `AGENTS.md`.
- Development docs: `docs/planning/task-tracking.md`,
  `docs/context/PROJECT_BRIEF.md`, and local task ledger docs.
- Task or issue tracker: local `docs/planning/tasks.yml` plus GitHub issues
  when needed.
- Branch naming: `task/` prefix.
- Change request template: `.github/pull_request_template.md`.
- Commit convention: concise imperative commits; this audit introduces scoped
  Conventional Commit titles for Pull Requests and squash commits.
- Review rules: PR gate, validation notes, project-memory updates, Compact
  Merge Flow, and direct docs reconciliation exception.

## Existing Automation

- CI files: `.github/workflows/tracker-integrity.yml` and
  `.github/workflows/db-migration.yml`.
- Reusable CI includes: none found.
- Git hook manager: Husky via `prepare`, with `lint-staged` configured in
  `package.json`.
- Commitlint: none.
- Release automation: none found.
- Changelog generation: none found.
- Security checks: no dedicated workflow found.

## Scope Taxonomy

- Proposed scopes: `budget`, `expense`, `category`, `analytics`, `auth`,
  `layout`, `data`, `ui`, `docs`, `ci`, `repo`.
- Rationale: scopes follow stable product domains and recurring infrastructure
  boundaries rather than Feature-Sliced Design folder names.
- Temporary scopes or expansion criteria: add a scope only when repeated work
  does not fit the current domain list.
- Rejected scopes: `misc`, `common`, `utils`, `stuff`, `changes`, `other`,
  `fixes`.

## Adapter Decision

- Selected adapter: GitHub.
- Files to install: adapt GitHub Pull Request template content into the
  existing `.github/pull_request_template.md`.
- Existing files to preserve: existing GitHub workflows, local task tracker
  schema, `github_issue` fields, Compact Merge Flow, and direct docs
  reconciliation exception.
- CI integration notes: no CI title validation in this iteration.
- Hook integration notes: do not add commitlint or new Husky hooks in this
  iteration.

## Enforcement Plan

- Documentation rules: add `docs/engineering/` process docs and link them from
  `AGENTS.md`, `docs/planning/task-tracking.md`, and the local skill.
- Commit title validation: manual in PR review for now.
- CI validation: unchanged.
- Local hook validation: unchanged.
- Manual checks: self-review for non-trivial work and PR template checkboxes.

## Manual Platform Settings

- Protected default branch: recommended for `main`.
- Direct push restrictions: recommended except documented process exceptions.
- Required checks: recommended before merge.
- Squash merge: recommended routine merge mode.
- Source branch cleanup: delete after merge when safe.
- Squash commit message template: preserve Pull Request title and useful body
  context where GitHub settings allow it.

## Risks And Trade-Offs

- Risks: documentation-only enforcement depends on agent and reviewer
  discipline.
- Intentional non-automation: no commitlint, PR title CI, or new hooks in the
  first iteration.
- Release automation decision: not needed for the current private app.
- Remaining limitations: `github_issue` remains GitHub-specific in the ledger
  until a dedicated migration task exists.

## Follow-Ups

- Consider a dedicated task for PR title CI or commitlint enforcement after the
  manual process proves useful.

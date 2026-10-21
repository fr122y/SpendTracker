# Agent Workflow

This document defines the default workflow for bounded agent development in
SmartSpend Tracker.

## Core Flow

Use one logical change per bounded work session:

```text
one bounded change
-> one bounded work session
-> one scoped branch
-> one GitHub Pull Request
-> checks and self-review
-> squash merge
-> one meaningful commit on main
```

The repository uses GitHub, so a change request means a GitHub Pull Request.

## Scope Control

Work only inside the current request's scope.

Do not silently:

- fix neighboring bugs;
- rename unrelated entities;
- format unrelated files;
- update dependencies;
- introduce future-facing abstractions;
- rewrite working code for subjective cleanup;
- expand the task into other domains.

Report unrelated discoveries separately instead of adding them to the current
diff.

## Context Before Changes

Before changing existing behavior, read the request, relevant instructions, nearby
code, existing tests, API contracts, and targeted history for the affected
area.

Use targeted history, not a full repository archaeology pass:

```bash
git log --oneline -- <relevant-path>
git log -p -- <relevant-path>
git blame <relevant-file>
git show <relevant-commit>
```

Check history especially before removing unusual conditions, simplifying error
handling, changing auth or permissions, changing caching, changing
server/client boundaries, deleting workarounds, or changing behavior that looks
strange but intentional.

## Planning

For non-trivial work, write a short plan before editing:

- expected behavior;
- affected parts of the system;
- verification approach;
- main risks;
- explicit out-of-scope work.

Keep the plan proportional to the task.

## Minimal Sufficient Change

Prefer the smallest change set that fully solves the task.

Minimal does not mean leaving a bug partially fixed, skipping a needed
regression test, ignoring errors, bypassing types, hiding failures with
suppressions, or copying code where a local shared solution is clearly needed.

## Architecture Boundaries

Do not silently change public APIs, data schemas, migrations, production
dependencies, auth semantics, supported behavior, backend protocols, or layer
responsibilities.

If such a change is required:

1. state the reason;
2. describe important alternatives;
3. list compatibility and rollout consequences;
4. add required tests;
5. record an ADR only when the decision is durable and architectural.

Do not create ADRs for ordinary local implementation choices.

## Testing Rules

Bug fixes should include a regression test when technically reasonable. The
test should reproduce the old failure, fail without the fix, pass with the fix,
and preserve the expected behavior.

Prefer behavior tests over implementation tests. Update existing tests when an
intentional contract change makes them stale.

Removing or skipping an existing test goes in its own Pull Request that says
which tests and why. The `test-integrity` check fails such a Pull Request, and
the owner merges it.

Final reports must distinguish:

- not run;
- run and passed;
- run and failed;
- blocked by environment.

Do not claim checks passed unless they were actually run.

## Waiting For CI

Wait for the `e2e` check of a Pull Request with:

```sh
npm run ci:wait -- <pr-number|sha> --rerun
```

The `--` is required: without it npm takes the flags for itself.

It polls the latest E2E run of the Pull Request's head commit through
`gh`, judges it by the job steps rather than the run status, prints one line
per state change, and stops at a final state or after `--timeout` minutes
(default 40). Options: `--once` checks once, `--json` prints the final state as
JSON, `--expected` sets the minutes after which a running test step counts as
stuck (default 12; the test step normally takes 8 to 11 minutes, after about 3 to 5 minutes of install and `next build`), `--interval` sets the poll
seconds (default 60), `--workflow` names another workflow.

| State                  | Meaning                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| `waiting-run`          | No run for the commit yet: GitHub has not started the E2E workflow for it.                                     |
| `queued`               | The job has not started: it waits for a runner or for its CI slot queue `e2e-slot-<n>`.                        |
| `running`              | The job is in progress within the expected time.                                                               |
| `stuck-running`        | The test step runs longer than `--expected`: likely a real hang.                                               |
| `stuck-after-pass`     | Every step, including the tests, passed at least 3 minutes ago, but GitHub has not completed the job or run.   |
| `passed`               | The run succeeded.                                                                                             |
| `failed`               | A step failed; the tool prints the step and the last 40 lines of its log.                                      |
| `cancelled-in-queue`   | Cancelled before the job started, superseded in the concurrency group.                                         |
| `cancelled-after-pass` | Cancelled although every step passed: GitHub did not register the completion and the job timeout cancelled it. |
| `cancelled`            | Cancelled during the tests, usually by the job timeout.                                                        |

Exit codes: `0` passed, `1` failed or cancelled, `2` still `stuck-running` at
the timeout, `3` timeout in another state (or `--once` on an unfinished run),
`4` usage or `gh` error.

Never call a run hung from its status alone; check its steps first, or run the
tool. On `stuck-after-pass` the tests have already passed: continue other work,
such as the manual Preview check. GitHub refuses to cancel or rerun the run
until it closes it; with `--rerun` the tool reruns it as soon as it is closed,
and reruns a `cancelled-in-queue` run that has no newer run for the same
commit. If it lasts, check <https://www.githubstatus.com/>.

## Project Memory

Use each durable container for its intended memory:

- Git history and Pull Requests: technical reason, behavior, implementation,
  risk, and verification for one logical change.
- ADRs: durable architectural decisions.

Do not turn every technical commit into a user changelog entry.

## OpenSpec Changes

The vault task register remains the source of truth for project tasks, task
status, and next steps. OpenSpec is a repository-local specification and
execution aid: each `openspec/changes/<change-id>/tasks.md` covers only that
change and is not copied from the vault backlog.

For substantive work that changes observable behavior, an API, a schema,
security, or architecture:

1. Choose an existing vault task and use `$openspec-propose` to create one
   scoped change with the requirements delta, design, and task checklist.
2. Review the artifacts against the vault task and repository context. Make
   sure the requirements state observable outcomes and identify scope,
   exclusions, dependencies, and risks.
3. Use `$openspec-apply-change` to implement the approved checklist. Keep the
   delta spec aligned with behavior and existing tests. Each commit carries
   exactly one trailer `Change: <change-id>`; commits outside any change carry
   `Change: none`, allowed only for `ci`, `build`, `chore`, `docs`, `test`, and
   `style`.
4. Run `npm run spec:check` for OpenSpec structure and specs, then
   `npm run validate` for typecheck, lint, and unit/integration tests. On
   every PR the `commitlint` job runs the OpenSpec check and the `verify` job
   runs typecheck, lint, and unit tests.
5. Open and merge the PR using this repository's review process. Archive the
   change in a separate follow-up only after integration and checks are
   confirmed, using `$openspec-archive-change`; the archive commit carries
   `Change: <change-id>` too.

Substantive implementation changes with no requirements change still get an
OpenSpec change with `skip_specs: true` in `.openspec.yaml`; do not add a
fictional spec delta. Typo, formatting, and mechanical fixes can skip a change.
T-025 is the one-time bootstrap exception because it creates the initial
configuration and current-behavior baseline.

The generated Codex skills in `.agents/skills/openspec-*/` are adapted to call
the project-local CLI with `npx --no-install openspec`. After `openspec init` or
skill regeneration, review the generated diff and reapply that command prefix
to CLI invocations. Keep the generated files otherwise intact; do not add a
wrapper or install the CLI globally.

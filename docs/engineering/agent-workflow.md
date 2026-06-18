# Agent Workflow

This document defines the default workflow for bounded agent development in
SmartSpend Tracker.

## Core Flow

Use one logical change for one task or explicit owner-approved process
exception:

```text
one task or approved exception
-> one bounded work session
-> one scoped branch
-> one GitHub Pull Request
-> checks and self-review
-> squash merge
-> one meaningful commit on main
```

The repository uses GitHub, so a change request means a GitHub Pull Request.
The local task tracker still uses `github_issue` fields; do not migrate them to
generic external issue fields without a dedicated task.

## Scope Control

Work only inside the current task or explicit human request.

Do not silently:

- fix neighboring bugs;
- rename unrelated entities;
- format unrelated files;
- update dependencies;
- introduce future-facing abstractions;
- rewrite working code for subjective cleanup;
- expand the task into other domains.

Record unrelated discoveries as follow-up tasks, backlog items, or open
questions instead of adding them to the current diff.

## Context Before Changes

Before changing existing behavior, read the task, relevant instructions, nearby
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

Final reports must distinguish:

- not run;
- run and passed;
- run and failed;
- blocked by environment.

Do not claim checks passed unless they were actually run.

## Project Memory

Use each durable container for its intended memory:

- Git history and Pull Requests: technical reason, behavior, implementation,
  risk, and verification for one logical change.
- Task tracker and task-run reports: task state and agent handoff details.
- ADRs: durable architectural decisions.
- Project log: meaningful completed milestones.

Do not turn every technical commit into a user changelog entry.

# Adoption Audit

An adoption audit is the required first gate before installing or substantially
adapting the project-task-tracking framework in a target repository.

Small follow-up edits to an already-adapted framework do not need a new audit
unless they change platform automation, branch policy, task workflow, scope
taxonomy, or enforcement.

## Purpose

The audit records facts before rules are copied or changed. It prevents agents
from installing the wrong platform adapter, inventing scopes, duplicating CI,
adding a second hook manager, or weakening existing checks.

Store audit reports in:

```text
docs/planning/adoption-audits/
```

Use this filename shape:

```text
YYYY-MM-DD-<project-slug>.md
```

Link the report from the adaptation task's `required_context` list. If the
human owner explicitly approves a process-only exception without a task ledger
entry, record that exception in the audit report.

## Required Facts

Before editing framework files in the target repository, identify:

- Git hosting platform and default branch;
- whether the repository is a monorepo;
- whether it publishes a versioned package, library, CLI, SDK, or release
  artifact;
- package manager and lock file;
- install, lint, typecheck, test, and build commands;
- existing instructions such as `AGENTS.md`, `README`, and `CONTRIBUTING`;
- existing CI files and reusable CI includes;
- existing change request templates;
- existing Git hook manager;
- existing commitlint, release, changelog, or semantic-release tooling;
- durable business domains or architecture boundaries for scopes.

Use targeted inspection. Do not scan unrelated history or files when the facts
are already clear.

## Scope Taxonomy

Choose a small controlled scope list from stable project domains, products,
apps, packages, or architecture boundaries.

Good scopes answer:

```text
What durable subsystem or domain did this change affect?
```

Prefer business and architecture boundaries over folder names. Add `deps`,
`ci`, `docs`, or `repo` only when they represent recurring work in the target
project.

Avoid empty scopes such as `misc`, `common`, `utils`, `stuff`, `changes`,
`other`, and `fixes`.

For cross-cutting changes, choose the primary affected domain and describe the
other affected areas in the Pull Request body.

## Adapter Decision

Install exactly one platform adapter unless the repository genuinely uses more
than one forge.

- GitHub: use the GitHub adapter and validate Pull Request titles manually or
  through GitHub Actions.
- GitLab: use the GitLab adapter and validate Merge Request titles manually or
  through GitLab CI.
- Other platforms: keep the core workflow and document the manual integration
  points for title validation, required checks, and squash merge.

Do not replace existing CI, package manager, or hook manager without an
explicit task requirement.

## Stop Rule

If no adoption audit exists for a first-time install or substantial framework
adaptation, stop implementation work and create the audit report first. Resume
the adaptation only after the report identifies the platform, commands,
existing automation, scope taxonomy, adapter decision, and manual settings.

# Pull Requests And Commit History

A change request in SmartSpend Tracker means a GitHub Pull Request. Pull
Requests and squash commits are the main review and history units for project
work.

## Title Format

Pull Request titles and squash commit titles must use:

```text
<type>(<scope>): <description>
```

Allowed types:

```text
feat
fix
refactor
perf
test
docs
build
ci
chore
revert
```

Use `chore` rarely. Type describes the intended effect, not the implementation
technique.

## Scope Taxonomy

`<scope>` is required and must come from this controlled list:

```text
budget
expense
category
analytics
auth
layout
data
ui
docs
ci
repo
```

Choose the primary affected domain. For cross-cutting changes, use the primary
domain in the title and explain the other affected areas in the Pull Request
body.

Avoid empty scopes such as `misc`, `common`, `utils`, `stuff`, `changes`,
`other`, and `fixes`.

## Description

Use this compact structure for meaningful Pull Requests:

```md
## Problem

What incorrect, missing, or inconvenient behavior is being addressed?

## Solution

What changed at the behavior and architecture level?

## Why this approach

Why this option? What important alternatives were considered?

## Out of scope

What related work is intentionally excluded?

## Risks

What can break? Include migration, compatibility, security, performance, or
rollout risks when relevant.

## Verification

What automated and manual checks were run?

## References

Issue, task, documentation, or related Pull Request.
```

Delete empty sections or explain why they do not apply.

## Squash Commit Body

For non-trivial changes, the squash commit body is required. GitHub builds it
from the commit messages of the Pull Request, not from the Pull Request
description, so write it in the commit message. It should explain:

- why the change was needed;
- what previous behavior was wrong or insufficient;
- why this approach was chosen;
- important risks;
- the task and OpenSpec change, as [trailers](#trailers).

Do not restate the diff line by line.

## Trailers

Trailers link a commit to the work it belongs to. From any line of code,
`git blame` leads to a commit, and its `Change:` trailer leads to the
proposal, design, and tasks that explain why the line exists.
`git log --grep '^Change: <change-id>'` finds every commit of a change, even
one that does not touch the change folder or was made after the folder was
archived.

- A commit that implements, continues, fixes, or archives work of an OpenSpec
  change carries `Change: <change-id>`. `<change-id>` is the kebab-case
  directory name of the change under `openspec/changes/`; for an archived
  change, the name without the `YYYY-MM-DD-` date prefix.
- A commit whose work belongs to a task in the owner's vault task register
  carries `Refs: <task-id>`, for example `Refs: T-027` or
  `Refs: GUARDRAILS-01`. Use it only for a real task; do not invent an id.
- Put trailers in the final block of the commit message, one per line.
- Do not add tool or assistant attribution to commits or Pull Requests: no
  `Co-Authored-By:` line naming an AI assistant and no "Generated with" line.
- Put them in the commit message, not only in the Pull Request description.
  The squash commit on `main` takes its body from the commit messages, so the
  description does not reach the history of `main`.

Example:

```text
feat(budget): add monthly pockets

Savings goals had no place in the monthly plan, so money set aside for them
showed up as unallocated. A pocket is a named monthly allocation that the
remaining-budget total subtracts.

Pockets are stored per month rather than as a recurring rule: the owner
changes the amounts every month. Existing months get no pockets, so their
totals do not change.

Change: add-monthly-pockets
Refs: T-027
```

## Enforcement

Commit messages are enforced locally by the Husky `commit-msg` hook with
commitlint. The hook validates every new commit message against this document's
type and scope rules.

GitHub Actions also validates Pull Request commit messages and the Pull Request
title. This catches commits created with `--no-verify` and keeps the eventual
squash title aligned with the same convention.

The `change-trailer` check fails a Pull Request that changes files under
`openspec/changes/` when no commit message in it carries
`Change: <change-id>` for each change touched; the fix is one more commit
with the trailer, and an empty commit is enough. `Refs:` is not checked,
because the task register lives outside the repository.

Do not change the scope taxonomy, disable the hook, or weaken CI validation
without a dedicated process task or an explicit owner-approved exception.

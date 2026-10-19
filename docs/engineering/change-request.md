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
`git log --grep '^Change: <change-id>$'` finds every commit of a change, even
one that does not touch the change folder or was made after the folder was
archived. Use `--grep`, not `%(trailers)`: a GitHub squash commit appends
`Co-authored-by:` after a `---------` line, so the `Change:` lines are no
longer in the final trailer block that `%(trailers)` reads.

- Every commit message carries exactly one line `Change: <id>`.
- `<id>` is an existing OpenSpec change: the kebab-case directory name under
  `openspec/changes/`, or for an archived change, the name under
  `openspec/changes/archive/` without the `YYYY-MM-DD-` date prefix. A commit
  that implements, continues, fixes, or archives work of a change names it.
- `Change: none` marks a commit that belongs to no change. It is allowed only
  for the types `ci`, `build`, `chore`, `docs`, `test`, and `style`. `feat`,
  `fix`, `refactor`, and `perf` always name a change; a follow-up or hotfix
  names the change whose work it fixes. Create the change's proposal before
  its first commit, so the id exists when the commit is made.
- Merge commits, `Revert "…"` commits created by `git revert`, and `fixup!` or
  `squash!` commits are exempt, so `git merge origin/main` keeps working.
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

A routine commit outside any change:

```text
ci(ci): pin the Node.js version of the verify job

Change: none
```

## Enforcement

Commit messages are enforced locally by the Husky `commit-msg` hook with
commitlint. The hook validates every new commit message against this document's
type and scope rules and, through the local rule `change-trailer`
(`scripts/commitlint/change-trailer-rule.cjs`), the `Change:` trailer rules
above, checking that the id exists in the working tree.

GitHub Actions also validates Pull Request commit messages and the Pull Request
title. This catches commits created with `--no-verify` and keeps the eventual
squash title aligned with the same convention. Every commit of the Pull
Request is linted, including the `Change:` trailer; the title is exempt from
the trailer rule only.

The `change-trailer` check fails a Pull Request that changes files under
`openspec/changes/` when no commit message in it carries
`Change: <change-id>` for each change touched (`Change: none` does not count);
the fix is one more commit with the trailer, and an empty commit is enough. It
also fails when a commit names an id that exists neither on the base branch
nor among the change folders the Pull Request adds. `Refs:` is not checked,
because the task register lives outside the repository.

Do not change the scope taxonomy, disable the hook, or weaken CI validation
without a dedicated process task or an explicit owner-approved exception.

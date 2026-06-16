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

For non-trivial changes, the squash commit body is required. It should explain:

- why the change was needed;
- what previous behavior was wrong or insufficient;
- why this approach was chosen;
- important risks;
- the task, issue, or Pull Request reference.

Do not restate the diff line by line.

## Enforcement

Commit messages are enforced locally by the Husky `commit-msg` hook with
commitlint. The hook validates every new commit message against this document's
type and scope rules.

GitHub Actions also validates Pull Request commit messages and the Pull Request
title. This catches commits created with `--no-verify` and keeps the eventual
squash title aligned with the same convention.

Do not change the scope taxonomy, disable the hook, or weaken CI validation
without a dedicated process task or an explicit owner-approved exception.

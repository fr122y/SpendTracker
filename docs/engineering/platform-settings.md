# Platform Settings

Some workflow rules cannot be enforced reliably by repository files alone.
Maintainers should configure GitHub settings after process changes when they
have the required permissions.

## GitHub

- Protect `main`.
- Prevent direct pushes to `main` for regular development.
- Require Pull Requests before merge.
- Require successful checks before merge.
- Enable squash merging and use it for routine task PRs.
- Delete source branches after merge when safe.
- Preserve the Pull Request title as the squash commit title where GitHub
  settings allow it.

## Automation Boundaries

Do not use GitHub APIs to change repository settings without explicit
maintainer approval and credentials for that exact action.

The current first iteration does not add commitlint, hooks, or CI checks for PR
title validation. Manual review enforces the convention until a dedicated
automation task exists.

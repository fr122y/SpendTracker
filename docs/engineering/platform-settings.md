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
- Treat the Conventional Commits workflow as a required check when branch
  protection settings allow it.

## Automation Boundaries

Do not use GitHub APIs to change repository settings without explicit
maintainer approval and credentials for that exact action.

The repository enforces commit message format with a local Husky `commit-msg`
hook and validates Pull Request commits and titles in GitHub Actions. Manual
review still checks the squash commit body quality for non-trivial changes.

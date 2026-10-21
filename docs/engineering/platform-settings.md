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

## Vercel

- `vercel.json` pins serverless functions to `dub1` (Dublin), next to the
  Supabase database in `eu-west-1`; each database query from another region
  pays a cross-Atlantic round trip. Middleware stays global.
- The project is on the Hobby plan. Its monthly Fluid Active CPU quota (4 h)
  covers every function, production included; exceeding it pauses functions
  for up to 30 days. In October 2026 e2e runs against Previews had used
  3 h 3 min of it (748K invocations, about 95% from e2e and test bursts), so
  the `e2e` check runs against a server inside the GitHub Actions runner
  instead (ADR 0005). Do not point automated tests at Vercel deployments.

## Automation Boundaries

Changing repository or platform settings is a protected operation; see
[Protected Operations](protected-operations.md).

The repository enforces commit message format with a local Husky `commit-msg`
hook and validates Pull Request commits and titles in GitHub Actions. Manual
review still checks the squash commit body quality for non-trivial changes.

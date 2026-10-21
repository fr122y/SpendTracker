# 0005. Run E2E Against a Server in CI, Not Vercel Previews

Date: 2026-10-21

## Status

Accepted

## Context

The `e2e` check ran the Playwright suite against each Pull Request's Vercel
Preview: the workflow started on the `deployment_status` event and sent every
request to the deployed functions. The project is on the Vercel Hobby plan,
whose monthly Fluid Active CPU quota (4 h) is shared by all deployments,
production included; exceeding it pauses functions for up to 30 days. By
2026-10-21 the month had used 3 h 3 min (76%) and 748K invocations, about 95%
of them from e2e runs and test bursts.

## Decision

The `e2e` workflow (`.github/workflows/e2e.yml`, workflow name `E2E`, job
`e2e`) starts on `pull_request` and on `workflow_dispatch`. It checks out the
Pull Request's head commit, runs `next build`, serves the build with
`next start` on `localhost:3000` inside the GitHub Actions runner, waits until
`/login` answers 200, and runs the gated specs against it. The server uses the
development database (`CI_DATABASE_URL`) and a CI-only auth secret
(`CI_AUTH_SECRET`). CI slots, the per-slot concurrency queue, the superseded
commit skip, and the skipped-test gate stay as they were.

The repository is public, so GitHub Actions minutes cost nothing. Vercel still
builds Previews for manual checks; builds do not use the function quota.

## Consequences

- e2e no longer depends on the Vercel deployment finishing, and never touches
  a Vercel function.
- The tested server is a production build of the commit, but not the Vercel
  runtime: region (`dub1`), edge middleware placement, and Vercel-specific
  headers are not covered. A Vercel-only regression shows up on the manual
  Preview check or in production.
- Each run adds about 3 to 5 minutes for install and `next build`.
- `VERCEL_AUTOMATION_BYPASS_SECRET` is no longer used by CI.

# 0004. Check JWT Sessions Against the Database

Date: 2026-10-20

## Status

Accepted

## Context

Sessions are stateless JWTs (`session: { strategy: 'jwt' }`) valid for 30
days. Signing out only cleared the browser cookie, so a copy of the token kept
working until it expired, and a password change left other devices signed in
(T-064). The owner decided on 2026-10-20 to keep the 30-day lifetime, end the
current session on sign-out, and end all other sessions on a password change.

The edge middleware cannot query the database, and each query costs about
150 ms while the dashboard already runs about 10 sequential Server Actions
(T-028).

## Decision

Keep JWT sessions and add a server-side check in the Node.js `jwt` callback:

- each token carries a random session id (`sid`) and the user's session
  version (`sv`);
- sign-out records the `sid` in `revoked_session` until the token expires;
- a password change or reset increments `user.sessionVersion`; the session
  that changed the password adopts the new version;
- page loads of /, /account, and /login, the password change, and the
  client's session probe `GET /api/auth/session` check at once (one indexed
  query); Server Actions query at most every 5 minutes per token (token
  `checkedAt` plus an in-memory cache per server instance), and a session an
  instance saw rejected is refused there without a query;
- the edge middleware keeps checking only the signature and expiry, and no
  longer redirects a signed-in visit to /login: the login page does it after
  the database check.

## Consequences

- A sign-out or password change takes effect at once on the next page load
  and session probe, and within 5 minutes for Server Actions of an already
  open page; the first rejected action makes the client probe and go to the
  login page.
- A rejected Server Action still throws `Unauthorized`, logged as a 500.
- One query per page load of /, /account, /login, per session probe, at
  sign-in, and per token every 5 minutes per instance for Server Actions.
- Tokens issued before this change have no `sid` and are rejected: every user
  signs in once more after the release.
- A database error during the check keeps the session, so an outage does not
  sign everyone out.
- Database sessions (`strategy: 'database'`) remain the alternative if an
  immediate effect everywhere becomes necessary.

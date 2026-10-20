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
- a routine check queries the database at most every 5 minutes per token
  (token `checkedAt` plus an in-memory cache per server instance); /account,
  the password change, and /login check at once;
- the edge middleware keeps checking only the signature and expiry, and no
  longer redirects a signed-in visit to /login: the login page does it after
  the database check.

## Consequences

- A sign-out or password change takes effect on other requests within 5
  minutes, on /account at once.
- One extra query per token every 5 minutes per server instance, one at
  sign-in, and one on each /account, /login, and password-change request.
- Tokens issued before this change have no `sid` and are rejected: every user
  signs in once more after the release.
- A database error during the check keeps the session, so an outage does not
  sign everyone out.
- Database sessions (`strategy: 'database'`) remain the alternative if an
  immediate effect everywhere becomes necessary.

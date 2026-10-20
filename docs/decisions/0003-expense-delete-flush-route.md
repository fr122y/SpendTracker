# 0003. Flush Deferred Expense Deletes Through an API Route

Date: 2026-10-20

## Status

Accepted

## Context

A journal delete waits 5 seconds for «Отменить» before it reaches the server.
The owner decided on 2026-10-20 that such a delete must always reach the
server, including when the user reloads or closes the tab inside the window
(T-034). The client committed waiting deletes from `pagehide` through the
`deleteExpense` Server Action, but a browser does not complete a request a
Server Action starts while the page unloads, so the delete was lost.

`fetch(..., { keepalive: true })` and `navigator.sendBeacon` survive unload,
but neither can call a Server Action: its endpoint and payload format are
internal to Next.js.

## Decision

Add one API Route, `POST /api/expenses/flush-deletes`. The page sends waiting
delete ids there with `fetch` and `keepalive: true` when it is hidden or
unloads. The route checks the session, rejects a foreign `Origin` and a body
that is not JSON, takes at most 100 ids, and deletes each with the same code
as `deleteExpense` (`deleteExpenseForUser`): temporary, malformed, foreign,
and guarded ids are skipped, and a repeat is safe.

Each waiting delete is also written to `localStorage` until the server
confirms it; the next app load resends past-due entries and hides them
until the server confirms. A page that hides commits its deletes at once, so
it marks their entries past due: a reload inside the undo window resends them
too.

The rule «backend uses Server Actions» stays; this route is its documented
exception.

## Consequences

- A delete reaches the server after a reload or a closed tab; an entry the
  keepalive request did not confirm is retried on the next load.
- The route is a second write path for expenses. It must keep the guards of
  `deleteExpense`; both call one function.
- `sendBeacon` was not chosen: it cannot send `application/json` and gives no
  response to confirm.

import 'server-only'

import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

import {
  insertRevokedSession,
  readSessionState,
  readSessionVersion,
} from './session-store'

import type { JWT } from '@auth/core/jwt'

/**
 * A token is re-checked against the database at most this often on routine
 * requests, so a sign-out or password change elsewhere takes effect within
 * this window. Sensitive requests check at once.
 */
export const SESSION_RECHECK_MS = 5 * 60 * 1000

const DEFAULT_SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000
const MAX_REMEMBERED_CHECKS = 5000

/**
 * `force`: check the database now, ignoring the throttle.
 * `adopt-version`: check now and move the token to the user's current session
 * version; only the server's own password change runs in this mode, never a
 * client request.
 */
export type SessionCheckMode = 'force' | 'adopt-version'

const checkMode = new AsyncLocalStorage<SessionCheckMode>()

/** Runs `fn` so that every session check inside it uses `mode`. */
export function withSessionCheck<T>(
  mode: SessionCheckMode,
  fn: () => Promise<T>
): Promise<T> {
  return checkMode.run(mode, fn)
}

interface RememberedCheck {
  userId: string
  sessionVersion: number
  checkedAt: number
}

/**
 * Successful checks of this server instance by session id. The token's own
 * `checkedAt` is refreshed only where Auth.js can write the cookie, so this
 * keeps Server Components and Server Actions from querying on every request.
 */
const rememberedChecks = new Map<string, RememberedCheck>()

function rememberCheck(sid: string, check: RememberedCheck) {
  rememberedChecks.delete(sid)
  rememberedChecks.set(sid, check)
  if (rememberedChecks.size <= MAX_REMEMBERED_CHECKS) return
  // Map keeps insertion order: the first entries are the oldest.
  for (const key of rememberedChecks.keys()) {
    rememberedChecks.delete(key)
    if (rememberedChecks.size <= MAX_REMEMBERED_CHECKS) break
  }
}

/**
 * A token that just adopted a new version, by session id. After a Server
 * Action writes the new cookie, Next.js re-renders the page in the same
 * request, and `auth()` there still reads the old cookie from the request
 * headers. For a short time the old version of this one token is accepted on
 * this instance, so that re-render does not sign the user out.
 */
const ADOPT_GRACE_MS = 60 * 1000
const adoptedVersions = new Map<
  string,
  { fromVersion: number; toVersion: number; until: number }
>()

function isAdoptedVersion(
  sid: string,
  tokenVersion: number,
  storedVersion: number,
  now: number
): boolean {
  const adopted = adoptedVersions.get(sid)
  return (
    adopted !== undefined &&
    adopted.fromVersion === tokenVersion &&
    adopted.toVersion === storedVersion &&
    now < adopted.until
  )
}

/** Drops this instance's remembered checks of one user. */
export function forgetUserSessionChecks(userId: string) {
  for (const [sid, check] of rememberedChecks) {
    if (check.userId === userId) rememberedChecks.delete(sid)
  }
}

/** For tests. */
export function resetSessionChecks() {
  rememberedChecks.clear()
  adoptedVersions.clear()
}

function isFresh(checkedAt: unknown, now: number): boolean {
  return (
    typeof checkedAt === 'number' &&
    checkedAt <= now &&
    now - checkedAt < SESSION_RECHECK_MS
  )
}

/** Gives a new token its session id and the user's current version. */
export async function issueSessionClaims(
  token: JWT,
  userId: string,
  now = Date.now()
): Promise<JWT> {
  const sessionVersion = (await readSessionVersion(userId)) ?? 0
  const sid = randomUUID()

  token.id = userId
  token.sid = sid
  token.sv = sessionVersion
  token.checkedAt = now
  rememberCheck(sid, { userId, sessionVersion, checkedAt: now })

  return token
}

/**
 * Returns the token while its session is still active, or `null` once it was
 * signed out, its version is older than the user's (password changed), or the
 * user is gone. Tokens issued before session ids existed are not accepted.
 */
export async function validateSessionToken(
  token: JWT,
  now = Date.now()
): Promise<JWT | null> {
  const { id: userId, sid, sv } = token

  if (
    typeof userId !== 'string' ||
    typeof sid !== 'string' ||
    typeof sv !== 'number'
  ) {
    return null
  }

  const mode = checkMode.getStore()

  if (!mode) {
    if (isFresh(token.checkedAt, now)) return token
    const remembered = rememberedChecks.get(sid)
    if (
      remembered?.userId === userId &&
      remembered.sessionVersion === sv &&
      isFresh(remembered.checkedAt, now)
    ) {
      return token
    }
  }

  let state
  try {
    state = await readSessionState(userId, sid)
  } catch (error) {
    // A database outage must not sign everyone out; the next request checks
    // again because nothing was marked as checked.
    console.error('[auth] session check failed', error)
    return token
  }

  if (!state || state.revoked) {
    rememberedChecks.delete(sid)
    return null
  }

  if (mode === 'adopt-version') {
    if (state.sessionVersion !== sv) {
      adoptedVersions.set(sid, {
        fromVersion: sv,
        toVersion: state.sessionVersion,
        until: now + ADOPT_GRACE_MS,
      })
    }
    token.sv = state.sessionVersion
  } else if (state.sessionVersion !== sv) {
    if (isAdoptedVersion(sid, sv, state.sessionVersion, now)) return token
    rememberedChecks.delete(sid)
    return null
  }

  token.checkedAt = now
  rememberCheck(sid, {
    userId,
    sessionVersion: state.sessionVersion,
    checkedAt: now,
  })

  return token
}

/** Ends the token's session on the server: its id is revoked until expiry. */
export async function revokeSession(
  token: JWT | null | undefined,
  now = Date.now()
): Promise<void> {
  if (!token || typeof token.sid !== 'string' || typeof token.id !== 'string') {
    return
  }

  const expiresAt = new Date(
    typeof token.exp === 'number'
      ? token.exp * 1000
      : now + DEFAULT_SESSION_MAX_AGE_MS
  )

  rememberedChecks.delete(token.sid)
  adoptedVersions.delete(token.sid)
  await insertRevokedSession(token.sid, token.id, expiresAt)
}

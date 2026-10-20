import { toast } from 'sonner'

import { getSafeCallbackUrl } from './auth-redirect'
import { persistFormDrafts } from './hooks/use-form-draft'

export const SESSION_EXPIRED_MESSAGE = 'Сессия истекла — войдите снова'
export const SESSION_EXPIRED_REASON = 'session-expired'

let redirecting = false

/**
 * Whether the page is leaving for the login page after the session expired.
 * The unsaved-changes guard stays silent then: the drafts are already kept.
 */
export function isLeavingForLogin(): boolean {
  return redirecting
}

/** For tests. */
export function resetSessionExpiry() {
  redirecting = false
}

/** `/login?callbackUrl=<path>&reason=session-expired` for the given path. */
export function buildSessionExpiredLoginUrl(currentPath: string): string {
  const params = new URLSearchParams({
    callbackUrl: getSafeCallbackUrl(currentPath),
    reason: SESSION_EXPIRED_REASON,
  })
  return `/login?${params.toString()}`
}

/**
 * Asks the auth endpoint whether the browser still has a session. Answers
 * `true` only on a definite "no session": a network failure or an unexpected
 * response is not an expired session, so an offline error keeps its own
 * handling.
 *
 * A Server Action cannot report 401 to the client: in production its thrown
 * `Unauthorized` reaches the browser as a generic error, and the middleware
 * answers a signed-out action request with a redirect. So a failed request is
 * classified by this one extra request instead.
 */
export async function isSessionExpired(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/session', {
      cache: 'no-store',
      credentials: 'same-origin',
    })
    if (!response.ok) return false
    const session: unknown = await response.json()
    return !(
      session &&
      typeof session === 'object' &&
      'user' in session &&
      session.user
    )
  } catch {
    return false
  }
}

function currentPath(): string {
  const { pathname, search, hash } = window.location
  return `${pathname}${search}${hash}`
}

/**
 * Keeps the unsaved form input in this tab's `sessionStorage`, shows one
 * toast and sends the user to the login page, which returns here after
 * sign-in. Runs once per page.
 */
export function handleSessionExpired() {
  if (redirecting) return
  redirecting = true
  persistFormDrafts()
  toast.error(SESSION_EXPIRED_MESSAGE)
  window.location.assign(buildSessionExpiredLoginUrl(currentPath()))
}

/**
 * Reports a failed request: an expired session leads to the login page,
 * anything else to `onOtherFailure`.
 */
export async function handleRequestFailure(onOtherFailure?: () => void) {
  if (redirecting) return
  if (await isSessionExpired()) {
    handleSessionExpired()
    return
  }
  onOtherFailure?.()
}

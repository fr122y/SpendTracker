import { toast } from 'sonner'

import { resetFormDrafts } from '../hooks/use-form-draft'
import { showMutationRollbackToast } from '../mutation-toast'
import {
  buildSessionExpiredLoginUrl,
  handleRequestFailure,
  isLeavingForLogin,
  isSessionExpired,
  resetSessionExpiry,
} from '../session-expiry'

jest.mock('sonner', () => ({ toast: { error: jest.fn() } }))

const assign = jest.fn()

function mockSession(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  }) as unknown as typeof fetch
}

describe('session expiry', () => {
  const originalLocation = window.location
  const originalFetch = global.fetch

  beforeAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        pathname: '/',
        search: '?date=2026-10-20',
        hash: '',
        assign,
      },
    })
  })

  afterAll(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    })
    global.fetch = originalFetch
  })

  beforeEach(() => {
    jest.clearAllMocks()
    resetSessionExpiry()
    resetFormDrafts()
    window.sessionStorage.clear()
  })

  it('builds a login URL that returns to the current page', () => {
    expect(buildSessionExpiredLoginUrl('/account?tab=1')).toBe(
      '/login?callbackUrl=%2Faccount%3Ftab%3D1&reason=session-expired'
    )
    expect(buildSessionExpiredLoginUrl('//evil.example')).toBe(
      '/login?callbackUrl=%2F&reason=session-expired'
    )
  })

  it('treats only a definite "no session" answer as expired', async () => {
    mockSession(null)
    await expect(isSessionExpired()).resolves.toBe(true)

    mockSession({ user: { id: 'u1' } })
    await expect(isSessionExpired()).resolves.toBe(false)

    mockSession(null, false)
    await expect(isSessionExpired()).resolves.toBe(false)

    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError('Failed to fetch')) as typeof fetch
    await expect(isSessionExpired()).resolves.toBe(false)
  })

  it('redirects once to sign in and keeps drafts when the session expired', async () => {
    mockSession(null)
    const other = jest.fn()

    await handleRequestFailure(other)
    await handleRequestFailure(other)

    expect(other).not.toHaveBeenCalled()
    expect(toast.error).toHaveBeenCalledTimes(1)
    expect(toast.error).toHaveBeenCalledWith('Сессия истекла — войдите снова')
    expect(assign).toHaveBeenCalledTimes(1)
    expect(assign).toHaveBeenCalledWith(
      '/login?callbackUrl=%2F%3Fdate%3D2026-10-20&reason=session-expired'
    )
    expect(isLeavingForLogin()).toBe(true)
  })

  it('shows the generic rollback toast for other failures', async () => {
    mockSession({ user: { id: 'u1' } })

    showMutationRollbackToast()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(toast.error).toHaveBeenCalledWith(
      'Не удалось сохранить. Изменения отменены.'
    )
    expect(assign).not.toHaveBeenCalled()
  })

  it('does not show the generic toast for an expired session', async () => {
    mockSession(null)

    showMutationRollbackToast()

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(toast.error).not.toHaveBeenCalledWith(
      'Не удалось сохранить. Изменения отменены.'
    )
    expect(assign).toHaveBeenCalledTimes(1)
  })
})

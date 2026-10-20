const mockReadSessionState = jest.fn()
const mockReadSessionVersion = jest.fn()
const mockInsertRevokedSession = jest.fn()
const mockUnstableUpdate = jest.fn()
const mockAuth = jest.fn()
interface CapturedConfig {
  callbacks: {
    jwt: (params: Record<string, unknown>) => Promise<JWT | null>
  }
  events: { signOut: (message: { token: JWT | null }) => Promise<void> }
}

jest.mock('server-only', () => ({}), { virtual: true })
jest.mock('@/shared/db', () => ({ db: {} }))
jest.mock('@auth/drizzle-adapter', () => ({ DrizzleAdapter: () => ({}) }))
jest.mock('next-auth/providers/google', () => ({}))
jest.mock('next-auth/providers/credentials', () => () => ({}))
jest.mock('../seed-defaults', () => ({ seedUserDefaults: jest.fn() }))
jest.mock('../account-profile', () => ({ getAccountProfile: jest.fn() }))
jest.mock('../session-store', () => ({
  readSessionState: (...args: unknown[]) => mockReadSessionState(...args),
  readSessionVersion: (...args: unknown[]) => mockReadSessionVersion(...args),
  insertRevokedSession: (...args: unknown[]) =>
    mockInsertRevokedSession(...args),
  nextSessionVersion: jest.fn(),
}))
jest.mock('next-auth', () =>
  jest.fn(() => ({
    handlers: {},
    auth: (...args: unknown[]) => mockAuth(...args),
    signIn: jest.fn(),
    signOut: jest.fn(),
    unstable_update: (...args: unknown[]) => mockUnstableUpdate(...args),
  }))
)

import NextAuth from 'next-auth'

import { authFresh, keepCurrentSessionAfterVersionBump } from '../index'
import {
  resetSessionChecks,
  SESSION_RECHECK_MS,
  validateSessionToken,
  withSessionCheck,
} from '../session-revocation'

import type { JWT } from '@auth/core/jwt'

const capturedConfig = (NextAuth as unknown as jest.Mock).mock
  .calls[0][0] as CapturedConfig

const jwt = (params: Record<string, unknown>) =>
  capturedConfig.callbacks.jwt(params)

const NOW = 1_800_000_000_000

function staleToken(overrides: Partial<JWT> = {}): JWT {
  return {
    id: 'user-1',
    sid: 'sid-1',
    sv: 2,
    checkedAt: NOW - SESSION_RECHECK_MS - 1,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers({ now: NOW })
  resetSessionChecks()
  mockReadSessionVersion.mockResolvedValue(2)
  mockReadSessionState.mockResolvedValue({ sessionVersion: 2, revoked: false })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('jwt callback', () => {
  it('gives a signed-in token a new session id and the current version', async () => {
    const first = await jwt({ token: {}, user: { id: 'user-1' } })
    const second = await jwt({ token: {}, user: { id: 'user-1' } })

    expect(first).toMatchObject({ id: 'user-1', sv: 2, checkedAt: NOW })
    expect(typeof first?.sid).toBe('string')
    expect(first?.sid).not.toBe(second?.sid)
    expect(mockReadSessionVersion).toHaveBeenCalledWith('user-1')
  })

  it('does not query while the last check is younger than the window', async () => {
    const token = staleToken({ checkedAt: NOW - SESSION_RECHECK_MS + 1000 })

    await expect(jwt({ token })).resolves.toBe(token)
    expect(mockReadSessionState).not.toHaveBeenCalled()
  })

  it('re-checks a stale token once and then trusts the remembered check', async () => {
    const token = staleToken()

    await expect(jwt({ token })).resolves.toMatchObject({ checkedAt: NOW })
    await jwt({ token: staleToken() })

    expect(mockReadSessionState).toHaveBeenCalledTimes(1)
    expect(mockReadSessionState).toHaveBeenCalledWith('user-1', 'sid-1')
  })

  it('ends a signed-out session', async () => {
    mockReadSessionState.mockResolvedValue({ sessionVersion: 2, revoked: true })

    await expect(jwt({ token: staleToken() })).resolves.toBeNull()
  })

  it('ends a session older than the last password change', async () => {
    mockReadSessionState.mockResolvedValue({
      sessionVersion: 3,
      revoked: false,
    })

    await expect(jwt({ token: staleToken() })).resolves.toBeNull()
  })

  it('ends a session of a deleted user', async () => {
    mockReadSessionState.mockResolvedValue(null)

    await expect(jwt({ token: staleToken() })).resolves.toBeNull()
  })

  it('does not accept a token issued before session ids existed', async () => {
    await expect(jwt({ token: { id: 'user-1' } })).resolves.toBeNull()
  })

  it('keeps the session when the database cannot be reached', async () => {
    mockReadSessionState.mockRejectedValue(new Error('timeout'))
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    const token = staleToken()

    await expect(jwt({ token })).resolves.toBe(token)
  })

  it('checks a fresh token at once for a sensitive request', async () => {
    mockReadSessionState.mockResolvedValue({ sessionVersion: 2, revoked: true })
    const token = staleToken({ checkedAt: NOW - 1000 })

    await expect(
      withSessionCheck('force', () => validateSessionToken(token))
    ).resolves.toBeNull()
  })

  it('ignores a client-sent session version on update', async () => {
    mockReadSessionState.mockResolvedValue({
      sessionVersion: 3,
      revoked: false,
    })

    await expect(
      jwt({ token: staleToken(), trigger: 'update', session: { sv: 3 } })
    ).resolves.toBeNull()
  })
})

describe('authFresh', () => {
  it('runs auth() with the immediate check', async () => {
    let modeSeen: unknown
    mockAuth.mockImplementation(async () => {
      modeSeen = await validateSessionToken(
        staleToken({ checkedAt: NOW - 1000 })
      )
      return { user: { id: 'user-1' } }
    })

    await authFresh()

    expect(mockReadSessionState).toHaveBeenCalledTimes(1)
    expect(modeSeen).not.toBeNull()
  })
})

describe('keepCurrentSessionAfterVersionBump', () => {
  it('moves the current token to the new version', async () => {
    mockReadSessionState.mockResolvedValue({
      sessionVersion: 3,
      revoked: false,
    })
    let updated: JWT | null = null
    mockUnstableUpdate.mockImplementation(async () => {
      updated = await jwt({
        token: staleToken({ checkedAt: NOW - 1000 }),
        trigger: 'update',
        session: {},
      })
    })

    await keepCurrentSessionAfterVersionBump('user-1')

    expect(updated).toMatchObject({ sid: 'sid-1', sv: 3, checkedAt: NOW })
  })

  it('does not revive a signed-out session', async () => {
    mockReadSessionState.mockResolvedValue({ sessionVersion: 3, revoked: true })
    let updated: JWT | null | undefined
    mockUnstableUpdate.mockImplementation(async () => {
      updated = await jwt({
        token: staleToken(),
        trigger: 'update',
        session: {},
      })
    })

    await keepCurrentSessionAfterVersionBump('user-1')

    expect(updated).toBeNull()
  })
})

describe('signOut event', () => {
  it('revokes the session id until the token expires', async () => {
    const exp = Math.floor(NOW / 1000) + 3600

    await capturedConfig.events.signOut({ token: staleToken({ exp }) })

    expect(mockInsertRevokedSession).toHaveBeenCalledWith(
      'sid-1',
      'user-1',
      new Date(exp * 1000)
    )
  })

  it('forgets the remembered check, so the next request is rejected', async () => {
    await jwt({ token: staleToken() })
    mockReadSessionState.mockResolvedValue({ sessionVersion: 2, revoked: true })

    await capturedConfig.events.signOut({ token: staleToken() })

    await expect(jwt({ token: staleToken() })).resolves.toBeNull()
  })

  it('does nothing for a token without a session id', async () => {
    await capturedConfig.events.signOut({ token: { id: 'user-1' } })

    expect(mockInsertRevokedSession).not.toHaveBeenCalled()
  })
})

const mockHashPassword = jest.fn()
const mockEnqueueAccountEmail = jest.fn()
const mockProcessAccountEmailOutbox = jest.fn()
const mockAfter = jest.fn((callback: () => unknown) => {
  void callback
})
const mockAuth = jest.fn()
const mockEq = jest.fn((left: unknown, right: unknown) => {
  void left
  void right
  return 'eq'
})
const mockAnd = jest.fn((...conditions: unknown[]) => conditions)
const mockIsNull = jest.fn((value: unknown) => ['isNull', value])

const mockLimit = jest.fn()
const mockWhere = jest.fn(() => ({ limit: mockLimit }))
const mockInnerJoin = jest.fn(() => ({ where: mockWhere }))
const mockFrom = jest.fn(() => ({
  innerJoin: mockInnerJoin,
  where: mockWhere,
}))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

const mockUpdateWhere = jest.fn()
const mockReturning = jest.fn()
const mockUpdateSet = jest.fn(() => ({ where: mockUpdateWhere }))
const mockUpdate = jest.fn(() => ({ set: mockUpdateSet }))
const mockInsertValues = jest.fn()
const mockInsert = jest.fn(() => ({ values: mockInsertValues }))
const mockTransaction = jest.fn()

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: (password: string, rounds: number) =>
      mockHashPassword(password, rounds),
  },
}))

jest.mock('drizzle-orm', () => ({
  and: (...conditions: unknown[]) => mockAnd(...conditions),
  eq: (left: unknown, right: unknown) => mockEq(left, right),
  isNull: (value: unknown) => mockIsNull(value),
}))

jest.mock('@/shared/lib/account-email-outbox', () => ({
  enqueueAccountEmail: (...args: unknown[]) => mockEnqueueAccountEmail(...args),
  processAccountEmailOutbox: (...args: unknown[]) =>
    mockProcessAccountEmailOutbox(...args),
}))

jest.mock('next/server', () => ({
  after: (callback: () => unknown) => mockAfter(callback),
}))

jest.mock('@/shared/auth', () => ({
  auth: () => mockAuth(),
}))

jest.mock('@/shared/auth/seed-defaults', () => ({
  seedUserDefaults: jest.fn(),
}))

jest.mock('@/shared/db', () => ({
  db: {
    select: () => mockSelect(),
    update: () => mockUpdate(),
    transaction: (callback: (tx: unknown) => Promise<void>) =>
      mockTransaction(callback),
  },
  passwordResetTokens: {
    id: 'passwordResetTokens.id',
    userId: 'passwordResetTokens.userId',
    tokenHash: 'passwordResetTokens.tokenHash',
    expiresAt: 'passwordResetTokens.expiresAt',
    usedAt: 'passwordResetTokens.usedAt',
  },
  emailVerificationTokens: {
    id: 'emailVerificationTokens.id',
    userId: 'emailVerificationTokens.userId',
    tokenHash: 'emailVerificationTokens.tokenHash',
    expiresAt: 'emailVerificationTokens.expiresAt',
    usedAt: 'emailVerificationTokens.usedAt',
  },
  users: {
    id: 'users.id',
    email: 'users.email',
    password: 'users.password',
    emailVerified: 'users.emailVerified',
  },
}))

import {
  getCurrentEmailVerificationStatus,
  getPasswordResetTokenStatus,
  requestPasswordReset,
  resendEmailVerification,
  resetPassword,
  verifyEmail,
} from '@/shared/api/auth-actions'

describe('password reset actions', () => {
  const originalEnv = process.env
  const originalConsoleError = console.error

  beforeEach(() => {
    jest.clearAllMocks()
    process.env = { ...originalEnv, APP_ORIGIN: 'https://app.example.com' }
    console.error = jest.fn()

    mockHashPassword.mockResolvedValue('hashed-new-password')
    mockAuth.mockResolvedValue(null)
    mockLimit.mockResolvedValue([])
    mockEnqueueAccountEmail.mockResolvedValue(undefined)
    mockProcessAccountEmailOutbox.mockResolvedValue({
      processed: 0,
      sent: 0,
      retried: 0,
      failed: 0,
      skipped: 0,
    })
    mockReturning.mockResolvedValue([{ id: 'token-1' }])
    mockUpdateWhere.mockReturnValue({ returning: mockReturning })
    mockInsertValues.mockResolvedValue(undefined)
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => void) => {
        return callback({
          update: mockUpdate,
          insert: mockInsert,
        })
      }
    )
  })

  it('reports current credentials email verification status', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } })
    mockLimit.mockResolvedValueOnce([
      {
        email: 'user@example.com',
        password: 'hashed-password',
        emailVerified: null,
      },
    ])

    await expect(getCurrentEmailVerificationStatus()).resolves.toEqual({
      requiresVerification: true,
      email: 'user@example.com',
    })
  })

  it('does not require verification for OAuth-only or verified users', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
    mockLimit
      .mockResolvedValueOnce([
        {
          email: 'oauth@example.com',
          password: null,
          emailVerified: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          email: 'verified@example.com',
          password: 'hashed-password',
          emailVerified: new Date(),
        },
      ])

    await expect(getCurrentEmailVerificationStatus()).resolves.toEqual({
      requiresVerification: false,
      email: 'oauth@example.com',
    })
    await expect(getCurrentEmailVerificationStatus()).resolves.toEqual({
      requiresVerification: false,
      email: 'verified@example.com',
    })
  })

  it('resends verification email for unverified credentials users', async () => {
    mockAuth.mockResolvedValueOnce({ user: { id: 'user-1' } })
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
        emailVerified: null,
      },
    ])

    const result = await resendEmailVerification()

    expect(result).toEqual({
      success: true,
      message: 'Мы отправили письмо для подтверждения email.',
    })
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      })
    )
    expect(mockEnqueueAccountEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.verify_email',
        to: 'user@example.com',
        userId: 'user-1',
        subject: 'Подтвердите email SmartSpend',
        text: expect.stringContaining('https://app.example.com/verify-email/'),
        html: expect.stringContaining('https://app.example.com/verify-email/'),
        idempotencyKey: expect.stringMatching(
          /^auth\.verify_email:user-1:[a-f0-9]{64}$/
        ),
      })
    )
    expect(mockAfter).toHaveBeenCalledTimes(1)
  })

  it('verifies a valid email token and marks it as used', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'token-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userPassword: 'hashed-password',
        userEmailVerified: null,
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ])

    const result = await verifyEmail('token')

    expect(result).toBe('success')
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith({ usedAt: expect.any(Date) })
    expect(mockUpdateSet).toHaveBeenCalledWith({
      emailVerified: expect.any(Date),
    })
    expect(mockReturning).toHaveBeenCalledWith({
      id: 'emailVerificationTokens.id',
    })
  })

  it('marks an already verified email token as used', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'token-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userPassword: 'hashed-password',
        userEmailVerified: new Date(),
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ])

    const result = await verifyEmail('token')

    expect(result).toBe('success')
    expect(mockUpdateSet).toHaveBeenCalledWith({ usedAt: expect.any(Date) })
  })

  it('reports invalid, expired, used, and concurrent email token states', async () => {
    mockLimit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 'token-1',
          userId: 'user-1',
          userPassword: 'hashed-password',
          userEmailVerified: null,
          expiresAt: new Date(Date.now() - 60_000),
          usedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'token-2',
          userId: 'user-1',
          userPassword: 'hashed-password',
          userEmailVerified: null,
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'token-3',
          userId: 'user-1',
          userPassword: 'hashed-password',
          userEmailVerified: null,
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: null,
        },
      ])
    mockReturning.mockResolvedValueOnce([])

    await expect(verifyEmail('invalid')).resolves.toBe('invalid')
    await expect(verifyEmail('expired')).resolves.toBe('expired')
    await expect(verifyEmail('used')).resolves.toBe('used')
    await expect(verifyEmail('concurrent')).resolves.toBe('used')
  })

  afterEach(() => {
    process.env = originalEnv
    console.error = originalConsoleError
  })

  it('creates a token and sends reset email for credentials users', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-1',
        email: 'USER@example.com',
        password: 'hashed-password',
      },
    ])

    const result = await requestPasswordReset({ email: 'USER@example.com' })

    expect(result.success).toBe(true)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        tokenHash: expect.any(String),
        expiresAt: expect.any(Date),
      })
    )
    expect(mockEnqueueAccountEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.reset_password',
        to: 'USER@example.com',
        userId: 'user-1',
        subject: 'Сброс пароля SmartSpend',
        text: expect.stringContaining(
          'https://app.example.com/reset-password/'
        ),
        html: expect.stringContaining(
          'https://app.example.com/reset-password/'
        ),
        idempotencyKey: expect.stringMatching(
          /^auth\.reset_password:user-1:[a-f0-9]{64}$/
        ),
      })
    )
    expect(mockAfter).toHaveBeenCalledTimes(1)
  })

  it('returns neutral success without email for unknown addresses', async () => {
    mockLimit.mockResolvedValueOnce([])

    const result = await requestPasswordReset({ email: 'missing@example.com' })

    expect(result.success).toBe(true)
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockEnqueueAccountEmail).not.toHaveBeenCalled()
  })

  it('returns neutral success without email for OAuth-only users', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-1',
        email: 'oauth@example.com',
        password: null,
      },
    ])

    const result = await requestPasswordReset({ email: 'oauth@example.com' })

    expect(result.success).toBe(true)
    expect(mockTransaction).not.toHaveBeenCalled()
    expect(mockEnqueueAccountEmail).not.toHaveBeenCalled()
  })

  it('returns neutral success when production origin is missing', async () => {
    process.env = { ...originalEnv, NODE_ENV: 'production' }
    mockLimit.mockResolvedValueOnce([
      {
        id: 'user-1',
        email: 'user@example.com',
        password: 'hashed-password',
      },
    ])

    const result = await requestPasswordReset({ email: 'user@example.com' })

    expect(result.success).toBe(true)
    expect(mockEnqueueAccountEmail).not.toHaveBeenCalled()
  })

  it('reports valid token status', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'token-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userPassword: 'hashed-password',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ])

    await expect(getPasswordResetTokenStatus('token')).resolves.toBe('valid')
  })

  it('reports expired, used, and invalid token statuses', async () => {
    mockLimit
      .mockResolvedValueOnce([
        {
          id: 'token-1',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userPassword: 'hashed-password',
          expiresAt: new Date(Date.now() - 60_000),
          usedAt: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'token-2',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userPassword: 'hashed-password',
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([])

    await expect(getPasswordResetTokenStatus('expired')).resolves.toBe(
      'expired'
    )
    await expect(getPasswordResetTokenStatus('used')).resolves.toBe('used')
    await expect(getPasswordResetTokenStatus('invalid')).resolves.toBe(
      'invalid'
    )
  })

  it('updates password and marks token as used for valid reset', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'token-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userPassword: 'hashed-password',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ])

    const result = await resetPassword({
      token: 'token',
      password: 'new-password',
    })

    expect(result).toEqual({ success: true })
    expect(mockHashPassword).toHaveBeenCalledWith('new-password', 12)
    expect(mockUpdate).toHaveBeenCalledTimes(2)
    expect(mockUpdateSet).toHaveBeenCalledWith({
      usedAt: expect.any(Date),
    })
    expect(mockUpdateSet).toHaveBeenCalledWith({
      password: 'hashed-new-password',
    })
    expect(mockReturning).toHaveBeenCalledWith({ id: 'passwordResetTokens.id' })
  })

  it('rejects a reset if the token was claimed concurrently', async () => {
    mockLimit.mockResolvedValueOnce([
      {
        id: 'token-1',
        userId: 'user-1',
        userEmail: 'user@example.com',
        userPassword: 'hashed-password',
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
      },
    ])
    mockReturning.mockResolvedValueOnce([])

    const result = await resetPassword({
      token: 'token',
      password: 'new-password',
    })

    expect(result).toEqual({
      success: false,
      error: 'Ссылка уже была использована',
    })
  })

  it('rejects used, expired, invalid, and short-password resets', async () => {
    mockLimit
      .mockResolvedValueOnce([
        {
          id: 'token-1',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userPassword: 'hashed-password',
          expiresAt: new Date(Date.now() + 60_000),
          usedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'token-2',
          userId: 'user-1',
          userEmail: 'user@example.com',
          userPassword: 'hashed-password',
          expiresAt: new Date(Date.now() - 60_000),
          usedAt: null,
        },
      ])
      .mockResolvedValueOnce([])

    await expect(
      resetPassword({ token: 'used', password: 'new-password' })
    ).resolves.toEqual({
      success: false,
      error: 'Ссылка уже была использована',
    })
    await expect(
      resetPassword({ token: 'expired', password: 'new-password' })
    ).resolves.toEqual({
      success: false,
      error: 'Срок действия ссылки истёк',
    })
    await expect(
      resetPassword({ token: 'invalid', password: 'new-password' })
    ).resolves.toEqual({
      success: false,
      error: 'Ссылка для сброса пароля недействительна',
    })
    await expect(
      resetPassword({ token: 'token', password: 'short' })
    ).resolves.toEqual({
      success: false,
      error: 'Пароль должен содержать минимум 8 символов',
    })
    expect(mockHashPassword).not.toHaveBeenCalled()
  })
})

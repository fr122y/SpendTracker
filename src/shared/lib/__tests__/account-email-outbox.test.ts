const mockSendAccountEmail = jest.fn()
const mockValidateAccountEmailInput = jest.fn()
const mockIsAccountEmailSuppressed = jest.fn()
const mockAsc = jest.fn((value: unknown) => ['asc', value])
const mockEq = jest.fn((left: unknown, right: unknown) => ['eq', left, right])
const mockAnd = jest.fn((...conditions: unknown[]) => ['and', conditions])
const mockOr = jest.fn((...conditions: unknown[]) => ['or', conditions])
const mockIsNull = jest.fn((value: unknown) => ['isNull', value])
const mockLte = jest.fn((left: unknown, right: unknown) => ['lte', left, right])

const mockOnConflictDoNothing = jest.fn()
const mockInsertValues = jest.fn(() => ({
  onConflictDoNothing: mockOnConflictDoNothing,
}))
const mockInsert = jest.fn(() => ({ values: mockInsertValues }))

const mockUpdateReturning = jest.fn()
const mockUpdateWhere = jest.fn(() => ({ returning: mockUpdateReturning }))
const mockUpdateSet = jest.fn(() => ({ where: mockUpdateWhere }))
const mockUpdate = jest.fn(() => ({ set: mockUpdateSet }))

const mockLimit = jest.fn()
const mockOrderBy = jest.fn(() => ({ limit: mockLimit }))
const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }))
const mockFrom = jest.fn(() => ({ where: mockWhere }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

jest.mock('drizzle-orm', () => ({
  and: (...conditions: unknown[]) => mockAnd(...conditions),
  asc: (value: unknown) => mockAsc(value),
  eq: (left: unknown, right: unknown) => mockEq(left, right),
  isNull: (value: unknown) => mockIsNull(value),
  lte: (left: unknown, right: unknown) => mockLte(left, right),
  or: (...conditions: unknown[]) => mockOr(...conditions),
}))

jest.mock('@/shared/db', () => ({
  accountEmailMessages: {
    id: 'accountEmailMessages.id',
    type: 'accountEmailMessages.type',
    recipientEmail: 'accountEmailMessages.recipientEmail',
    userId: 'accountEmailMessages.userId',
    status: 'accountEmailMessages.status',
    provider: 'accountEmailMessages.provider',
    providerMessageId: 'accountEmailMessages.providerMessageId',
    idempotencyKey: 'accountEmailMessages.idempotencyKey',
    subject: 'accountEmailMessages.subject',
    text: 'accountEmailMessages.text',
    html: 'accountEmailMessages.html',
    replyTo: 'accountEmailMessages.replyTo',
    attemptsCount: 'accountEmailMessages.attemptsCount',
    lastError: 'accountEmailMessages.lastError',
    nextRetryAt: 'accountEmailMessages.nextRetryAt',
    createdAt: 'accountEmailMessages.createdAt',
    updatedAt: 'accountEmailMessages.updatedAt',
    sentAt: 'accountEmailMessages.sentAt',
  },
  db: {
    insert: () => mockInsert(),
    update: () => mockUpdate(),
    select: () => mockSelect(),
  },
}))

jest.mock('../account-email', () => {
  class AccountEmailError extends Error {
    constructor(
      public readonly code: string,
      message: string
    ) {
      super(message)
      this.name = 'AccountEmailError'
    }
  }

  return {
    AccountEmailError,
    sendAccountEmail: (...args: unknown[]) => mockSendAccountEmail(...args),
    validateAccountEmailInput: (...args: unknown[]) =>
      mockValidateAccountEmailInput(...args),
  }
})

jest.mock('../account-email-suppression', () => ({
  isAccountEmailSuppressed: (...args: unknown[]) =>
    mockIsAccountEmailSuppressed(...args),
}))

import { AccountEmailError } from '../account-email'
import {
  enqueueAccountEmail,
  processAccountEmailOutbox,
} from '../account-email-outbox'

describe('account email outbox', () => {
  const now = new Date('2026-06-24T12:00:00.000Z')

  const message = {
    id: 'message-1',
    type: 'auth.reset_password',
    recipientEmail: 'user@example.com',
    userId: 'user-1',
    status: 'pending',
    provider: null,
    providerMessageId: null,
    idempotencyKey: 'auth.reset_password:user-1:token',
    subject: 'Reset password',
    text: 'Reset link',
    html: '<p>Reset link</p>',
    replyTo: null,
    attemptsCount: 0,
    lastError: null,
    nextRetryAt: null,
    createdAt: now,
    updatedAt: now,
    sentAt: null,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockOnConflictDoNothing.mockResolvedValue(undefined)
    mockUpdateReturning.mockResolvedValue([{ id: 'message-1' }])
    mockLimit.mockResolvedValue([])
    mockSendAccountEmail.mockResolvedValue({
      status: 'sent',
      provider: 'resend',
      providerMessageId: 'resend-message-1',
    })
    mockIsAccountEmailSuppressed.mockResolvedValue(false)
  })

  it('persists account emails with idempotency protection', async () => {
    await enqueueAccountEmail({
      type: 'auth.verify_email',
      to: 'user@example.com',
      userId: 'user-1',
      subject: 'Verify email',
      text: 'Verify link',
      html: '<p>Verify link</p>',
      idempotencyKey: 'auth.verify_email:user-1:token',
    })

    expect(mockValidateAccountEmailInput).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.verify_email',
        to: 'user@example.com',
      })
    )
    expect(mockInsertValues).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'auth.verify_email',
        recipientEmail: 'user@example.com',
        userId: 'user-1',
        idempotencyKey: 'auth.verify_email:user-1:token',
      })
    )
    expect(mockOnConflictDoNothing).toHaveBeenCalledWith({
      target: 'accountEmailMessages.idempotencyKey',
    })
  })

  it('sends due messages and stores provider delivery metadata', async () => {
    mockLimit.mockResolvedValueOnce([message])

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result).toEqual({
      processed: 1,
      sent: 1,
      retried: 0,
      failed: 0,
      suppressed: 0,
      skipped: 0,
    })
    expect(mockSendAccountEmail).toHaveBeenCalledWith({
      type: 'auth.reset_password',
      to: 'user@example.com',
      subject: 'Reset password',
      text: 'Reset link',
      html: '<p>Reset link</p>',
      idempotencyKey: 'auth.reset_password:user-1:token',
    })
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'sent',
        provider: 'resend',
        providerMessageId: 'resend-message-1',
        attemptsCount: 1,
        sentAt: now,
      })
    )
  })

  it('reschedules provider failures with bounded retry metadata', async () => {
    mockLimit.mockResolvedValueOnce([message])
    mockSendAccountEmail.mockRejectedValueOnce(new Error('Network timeout'))

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result.retried).toBe(1)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'pending',
        attemptsCount: 1,
        lastError: 'Network timeout',
        nextRetryAt: new Date('2026-06-24T12:01:00.000Z'),
      })
    )
  })

  it('marks suppressed recipients without calling the provider', async () => {
    mockLimit.mockResolvedValueOnce([message])
    mockIsAccountEmailSuppressed.mockResolvedValueOnce(true)

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result).toEqual({
      processed: 1,
      sent: 0,
      retried: 0,
      failed: 0,
      suppressed: 1,
      skipped: 0,
    })
    expect(mockSendAccountEmail).not.toHaveBeenCalled()
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'suppressed',
        lastError: 'Account email recipient is suppressed',
        nextRetryAt: null,
        updatedAt: now,
      })
    )
  })

  it('marks permanent errors as failed without retrying', async () => {
    mockLimit.mockResolvedValueOnce([message])
    mockSendAccountEmail.mockRejectedValueOnce(
      new AccountEmailError('configuration_error', 'RESEND_API_KEY is required')
    )

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result.failed).toBe(1)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        attemptsCount: 1,
        lastError: 'RESEND_API_KEY is required',
        nextRetryAt: null,
      })
    )
  })

  it('marks provider errors as failed after max attempts', async () => {
    mockLimit.mockResolvedValueOnce([{ ...message, attemptsCount: 4 }])
    mockSendAccountEmail.mockRejectedValueOnce(new Error('Too many requests'))

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result.failed).toBe(1)
    expect(mockUpdateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'failed',
        attemptsCount: 5,
        lastError: 'Too many requests',
        nextRetryAt: null,
      })
    )
  })

  it('skips messages that cannot be claimed', async () => {
    mockLimit.mockResolvedValueOnce([message])
    mockUpdateReturning.mockResolvedValueOnce([])

    const result = await processAccountEmailOutbox({ now, limit: 1 })

    expect(result).toEqual({
      processed: 0,
      sent: 0,
      retried: 0,
      failed: 0,
      suppressed: 0,
      skipped: 1,
    })
    expect(mockSendAccountEmail).not.toHaveBeenCalled()
  })
})

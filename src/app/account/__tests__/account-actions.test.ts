import bcrypt from 'bcryptjs'

const mockSignOut = jest.fn()
const mockAuth = jest.fn()
const mockUnstableUpdate = jest.fn()
const mockKeepCurrentSession = jest.fn()
const NEXT_VERSION = { sql: 'sessionVersion + 1' }
const mockRevalidatePath = jest.fn()
const mockLimit = jest.fn()
const mockUpdateWhere = jest.fn()
const mockSet = jest.fn(() => ({ where: mockUpdateWhere }))

jest.mock('@/shared/auth', () => ({
  auth: (...args: unknown[]) => mockAuth(...args),
  authFresh: (...args: unknown[]) => mockAuth(...args),
  keepCurrentSessionAfterVersionBump: (...args: unknown[]) =>
    mockKeepCurrentSession(...args),
  nextSessionVersion: () => NEXT_VERSION,
  signOut: (...args: unknown[]) => mockSignOut(...args),
  unstable_update: (...args: unknown[]) => mockUnstableUpdate(...args),
}))

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

jest.mock('@/shared/db', () => ({
  users: { id: 'id', password: 'password', name: 'name' },
  db: {
    select: jest.fn(() => ({
      from: () => ({ where: () => ({ limit: mockLimit }) }),
    })),
    update: jest.fn(() => ({ set: mockSet })),
  },
}))

import {
  changeAccountPassword,
  signOutCurrentUser,
  updateAccountName,
} from '../actions'

const CURRENT = 'current-pass-1'
let currentHash: string

beforeAll(async () => {
  currentHash = await bcrypt.hash(CURRENT, 4)
})

beforeEach(() => {
  jest.clearAllMocks()
  mockAuth.mockResolvedValue({ user: { id: 'user-1' } })
  mockLimit.mockResolvedValue([{ password: currentHash }])
  mockUpdateWhere.mockResolvedValue(undefined)
})

describe('signOutCurrentUser', () => {
  it('signs out and redirects to login', async () => {
    await signOutCurrentUser()

    expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/login' })
  })
})

describe('updateAccountName', () => {
  it('saves a trimmed name and refreshes the session', async () => {
    await expect(updateAccountName({ name: '  Илья  ' })).resolves.toEqual({
      success: true,
    })

    expect(mockSet).toHaveBeenCalledWith({ name: 'Илья' })
    expect(mockUnstableUpdate).toHaveBeenCalledWith({
      user: { name: 'Илья' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/account')
  })

  it.each([
    ['   ', 'Имя должно содержать минимум 2 символа'],
    ['а', 'Имя должно содержать минимум 2 символа'],
    ['а'.repeat(51), 'Имя должно содержать не больше 50 символов'],
  ])('rejects invalid name %p', async (name, error) => {
    await expect(updateAccountName({ name })).resolves.toEqual({
      success: false,
      error,
    })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('rejects unauthenticated calls', async () => {
    mockAuth.mockResolvedValueOnce(null)

    const result = await updateAccountName({ name: 'Илья' })

    expect(result.success).toBe(false)
    expect(mockSet).not.toHaveBeenCalled()
  })
})

describe('changeAccountPassword', () => {
  const valid = {
    currentPassword: CURRENT,
    newPassword: 'new-password-2',
    confirmPassword: 'new-password-2',
  }

  it('stores a new bcrypt hash on success', async () => {
    await expect(changeAccountPassword(valid)).resolves.toEqual({
      success: true,
    })

    const saved = (
      mockSet.mock.calls[0] as unknown as [{ password: string }]
    )[0].password
    expect(saved).not.toBe(currentHash)
    expect(saved).not.toBe(valid.newPassword)
    await expect(bcrypt.compare(valid.newPassword, saved)).resolves.toBe(true)
    expect(saved.startsWith('$2')).toBe(true)
    expect(saved.split('$')[2]).toBe('12')
  })

  it('ends other sessions and keeps the current one', async () => {
    await expect(changeAccountPassword(valid)).resolves.toEqual({
      success: true,
    })

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({ sessionVersion: NEXT_VERSION })
    )
    expect(mockKeepCurrentSession).toHaveBeenCalledWith('user-1')
    expect(mockUpdateWhere.mock.invocationCallOrder[0]).toBeLessThan(
      mockKeepCurrentSession.mock.invocationCallOrder[0]
    )
  })

  it('reports success when only keeping the current session fails', async () => {
    mockKeepCurrentSession.mockRejectedValueOnce(new Error('cookie'))

    await expect(changeAccountPassword(valid)).resolves.toEqual({
      success: true,
    })
  })

  it('does not end sessions when the password is not changed', async () => {
    await changeAccountPassword({ ...valid, currentPassword: 'wrong-pass-1' })

    expect(mockKeepCurrentSession).not.toHaveBeenCalled()
  })

  it('rejects a wrong current password', async () => {
    await expect(
      changeAccountPassword({ ...valid, currentPassword: 'wrong-pass-1' })
    ).resolves.toEqual({
      success: false,
      error: 'Текущий пароль указан неверно',
    })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('rejects mismatched new passwords', async () => {
    await expect(
      changeAccountPassword({ ...valid, confirmPassword: 'other-pass-3' })
    ).resolves.toEqual({ success: false, error: 'Новые пароли не совпадают' })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('rejects a weak new password', async () => {
    await expect(
      changeAccountPassword({
        ...valid,
        newPassword: 'short',
        confirmPassword: 'short',
      })
    ).resolves.toEqual({
      success: false,
      error: 'Пароль должен содержать минимум 8 символов',
    })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('rejects a new password equal to the current one', async () => {
    await expect(
      changeAccountPassword({
        ...valid,
        newPassword: CURRENT,
        confirmPassword: CURRENT,
      })
    ).resolves.toEqual({
      success: false,
      error: 'Новый пароль должен отличаться от текущего',
    })
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('rejects accounts without a password', async () => {
    mockLimit.mockResolvedValueOnce([{ password: null }])

    const result = await changeAccountPassword(valid)

    expect(result.success).toBe(false)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('returns a generic error without details on database failure', async () => {
    mockUpdateWhere.mockRejectedValueOnce(new Error('db down: $2a$secret'))

    await expect(changeAccountPassword(valid)).resolves.toEqual({
      success: false,
      error: 'Не удалось сохранить изменения. Попробуйте ещё раз.',
    })
  })
})

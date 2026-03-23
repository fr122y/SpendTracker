const mockHash = jest.fn()
const mockEq = jest.fn((left: unknown, right: unknown) => {
  void left
  void right
  return 'eq'
})
const mockSeedUserDefaults = jest.fn()

const mockLimit = jest.fn()
const mockWhere = jest.fn(() => ({ limit: mockLimit }))
const mockFrom = jest.fn(() => ({ where: mockWhere }))
const mockSelect = jest.fn(() => ({ from: mockFrom }))

const mockInsertValues = jest.fn()
const mockInsert = jest.fn(() => ({ values: mockInsertValues }))
const mockTransaction = jest.fn()

jest.mock('bcryptjs', () => ({
  __esModule: true,
  default: {
    hash: (password: string, rounds: number) => mockHash(password, rounds),
  },
}))

jest.mock('drizzle-orm', () => ({
  eq: (left: unknown, right: unknown) => mockEq(left, right),
}))

jest.mock('@/shared/auth/seed-defaults', () => ({
  seedUserDefaults: (tx: unknown, userId: string) =>
    mockSeedUserDefaults(tx, userId),
}))

jest.mock('@/shared/db', () => ({
  db: {
    select: () => mockSelect(),
    transaction: (callback: (tx: unknown) => Promise<void>) =>
      mockTransaction(callback),
  },
  users: {
    id: 'id',
    email: 'email',
  },
}))

import { registerUser } from '@/shared/api/auth-actions'

describe('registerUser', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockHash.mockResolvedValue('hashed-password')
    mockLimit.mockResolvedValue([])
    mockInsertValues.mockResolvedValue(undefined)
    mockSeedUserDefaults.mockResolvedValue(undefined)
    mockTransaction.mockImplementation(
      async (callback: (tx: unknown) => void) => {
        await callback({
          insert: mockInsert,
        })
      }
    )
  })

  it('creates user and seeds defaults with valid input', async () => {
    const result = await registerUser({
      name: 'Тест',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(mockHash).toHaveBeenCalledWith('password123', 12)
    expect(mockTransaction).toHaveBeenCalledTimes(1)
    expect(mockInsert).toHaveBeenCalledTimes(1)
    expect(mockSeedUserDefaults).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ success: true })
  })

  it('rejects invalid email format', async () => {
    const result = await registerUser({
      name: 'Тест',
      email: 'not-an-email',
      password: 'password123',
    })

    expect(result).toEqual({ success: false, error: 'Некорректный email' })
    expect(mockSelect).not.toHaveBeenCalled()
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('rejects short password', async () => {
    const result = await registerUser({
      name: 'Тест',
      email: 'test@example.com',
      password: '123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('минимум 8 символов')
    }
  })

  it('rejects short name', async () => {
    const result = await registerUser({
      name: 'А',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error).toContain('минимум 2 символа')
    }
  })

  it('rejects duplicate email', async () => {
    mockLimit.mockResolvedValueOnce([{ id: 'existing-id' }])

    const result = await registerUser({
      name: 'Тест',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({
      success: false,
      error: 'Пользователь с таким email уже существует',
    })
    expect(mockTransaction).not.toHaveBeenCalled()
  })

  it('returns generic error on transaction failure', async () => {
    mockTransaction.mockRejectedValueOnce(new Error('db error'))

    const result = await registerUser({
      name: 'Тест',
      email: 'test@example.com',
      password: 'password123',
    })

    expect(result).toEqual({
      success: false,
      error: 'Произошла ошибка. Попробуйте ещё раз',
    })
  })

  it('normalizes email to lowercase', async () => {
    await registerUser({
      name: 'Тест',
      email: 'TEST@EXAMPLE.COM',
      password: 'password123',
    })

    expect(mockWhere).toHaveBeenCalledWith('eq')
    const insertedPayload = mockInsertValues.mock.calls[0][0]
    expect(insertedPayload.email).toBe('test@example.com')
  })
})

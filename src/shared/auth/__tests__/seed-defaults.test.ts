const mockValues = jest.fn()
const mockInsert = jest.fn(() => ({ values: mockValues }))

jest.mock('@/shared/db', () => ({
  allocationBuckets: 'allocation-buckets-table',
  categories: 'categories-table',
  keywordMappings: 'keyword-mappings-table',
  layoutConfigs: 'layout-configs-table',
  userSettings: 'user-settings-table',
}))

import { seedUserDefaults } from '@/shared/auth/seed-defaults'

describe('seedUserDefaults', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockValues.mockResolvedValue(undefined)
  })

  it('inserts expected defaults for a new user', async () => {
    const userId = 'user-123'
    await seedUserDefaults(
      {
        insert: mockInsert,
      } as never,
      userId
    )

    expect(mockInsert).toHaveBeenCalledTimes(5)

    const categoryInsert = mockValues.mock.calls[0][0]
    expect(categoryInsert).toHaveLength(6)
    expect(
      categoryInsert.map((item: { name: string }) => item.name)
    ).toStrictEqual([
      'Продукты',
      'Транспорт',
      'Еда',
      'Здоровье',
      'Развлечения',
      'Другое',
    ])
    categoryInsert.forEach((item: { userId: string }) => {
      expect(item.userId).toBe(userId)
    })

    const keywordInsert = mockValues.mock.calls[1][0]
    expect(keywordInsert.length).toBeGreaterThan(0)
    keywordInsert.forEach((item: { userId: string; keyword: string }) => {
      expect(item.userId).toBe(userId)
      expect(item.keyword).toBe(item.keyword.toLowerCase())
    })

    const bucketInsert = mockValues.mock.calls[2][0]
    expect(bucketInsert).toHaveLength(2)
    expect(bucketInsert[0]).toMatchObject({
      label: 'Накопления',
      percentage: 20,
    })
    expect(bucketInsert[1]).toMatchObject({
      label: 'Инвестиции',
      percentage: 10,
    })
    bucketInsert.forEach((item: { userId: string }) => {
      expect(item.userId).toBe(userId)
    })

    const settingsInsert = mockValues.mock.calls[3][0]
    expect(settingsInsert).toMatchObject({
      userId,
      weeklyLimit: 10000,
      salaryDay: 10,
      advanceDay: 25,
      salary: 0,
    })

    const layoutInsert = mockValues.mock.calls[4][0]
    expect(layoutInsert.userId).toBe(userId)
    expect(layoutInsert.config.columns).toHaveLength(3)
  })
})

import {
  getMonthlyExpenses,
  getDailyExpenses,
  getCategoryStats,
  getPersonalExpenses,
  getProjectExpenses,
  getWeeklyStats,
  getWeeklyPersonalStats,
} from '../finance-selectors'

import type { Expense } from '@/shared/types'

const mockExpenses: Expense[] = [
  {
    id: '1',
    description: 'Молоко',
    amount: 100,
    date: '2024-01-15',
    category: 'Продукты',
    emoji: '🛒',
  },
  {
    id: '2',
    description: 'Хлеб',
    amount: 50,
    date: '2024-01-15',
    category: 'Продукты',
    emoji: '🛒',
  },
  {
    id: '3',
    description: 'Метро',
    amount: 200,
    date: '2024-01-16',
    category: 'Транспорт',
    emoji: '🚌',
  },
  {
    id: '4',
    description: 'Кино',
    amount: 500,
    date: '2024-01-20',
    category: 'Развлечения',
    emoji: '🎬',
  },
  {
    id: '5',
    description: 'Такси',
    amount: 300,
    date: '2024-02-01',
    category: 'Транспорт',
    emoji: '🚌',
  },
  {
    id: '6',
    description: 'Материалы',
    amount: 700,
    date: '2024-01-16',
    category: 'Ремонт',
    emoji: '🔨',
    projectId: 'project-1',
  },
]

describe('getMonthlyExpenses', () => {
  it('should return expenses for the specified month', () => {
    const date = new Date('2024-01-15')
    const result = getMonthlyExpenses(mockExpenses, date)

    expect(result).toHaveLength(5)
    expect(result.every((e) => e.date.startsWith('2024-01'))).toBe(true)
  })

  it('should return empty array if no expenses in month', () => {
    const date = new Date('2024-03-15')
    const result = getMonthlyExpenses(mockExpenses, date)

    expect(result).toHaveLength(0)
  })
})

describe('getDailyExpenses', () => {
  it('should return expenses for the specified date', () => {
    const date = new Date('2024-01-15')
    const result = getDailyExpenses(mockExpenses, date)

    expect(result).toHaveLength(2)
    expect(result.every((e) => e.date === '2024-01-15')).toBe(true)
  })

  it('should return empty array if no expenses on date', () => {
    const date = new Date('2024-01-01')
    const result = getDailyExpenses(mockExpenses, date)

    expect(result).toHaveLength(0)
  })
})

describe('getCategoryStats', () => {
  it('should return category statistics for the month sorted by value', () => {
    const date = new Date('2024-01-15')
    const result = getCategoryStats(mockExpenses, date)

    expect(result).toHaveLength(4)
    // Should be sorted by value descending
    expect(result[0].name).toBe('Ремонт')
    expect(result[0].value).toBe(700)
    expect(result[1].name).toBe('Развлечения')
    expect(result[1].value).toBe(500)
    expect(result[2].name).toBe('Транспорт')
    expect(result[2].value).toBe(200)
    expect(result[3].name).toBe('Продукты')
    expect(result[3].value).toBe(150)
  })

  it('should calculate correct percentages', () => {
    const date = new Date('2024-01-15')
    const result = getCategoryStats(mockExpenses, date)

    const total = 1550 // 700 + 500 + 200 + 150
    expect(result[0].percent).toBeCloseTo((700 / total) * 100)
    expect(result[1].percent).toBeCloseTo((500 / total) * 100)
    expect(result[2].percent).toBeCloseTo((200 / total) * 100)
    expect(result[3].percent).toBeCloseTo((150 / total) * 100)
  })

  it('should include emoji in results', () => {
    const date = new Date('2024-01-15')
    const result = getCategoryStats(mockExpenses, date)

    expect(result[0].emoji).toBe('🔨')
    expect(result[1].emoji).toBe('🎬')
    expect(result[2].emoji).toBe('🚌')
    expect(result[3].emoji).toBe('🛒')
  })
})

describe('project and personal expense selectors', () => {
  it('should return only personal expenses', () => {
    const result = getPersonalExpenses(mockExpenses)

    expect(result).toHaveLength(5)
    expect(result.every((expense) => !expense.projectId)).toBe(true)
  })

  it('should return expenses for the specified project', () => {
    const result = getProjectExpenses(mockExpenses, 'project-1')

    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('6')
  })
})

describe('getWeeklyStats', () => {
  it('should return weekly statistics with spent amount', () => {
    // Week containing 2024-01-15 (Monday 15 - Sunday 21)
    const date = new Date('2024-01-15')
    const result = getWeeklyStats(mockExpenses, date, 1000)

    expect(result.spent).toBe(1550) // 100 + 50 + 200 + 500 + 700
    expect(result.limit).toBe(1000)
  })

  it('should return correct week boundaries', () => {
    const date = new Date('2024-01-17') // Wednesday
    const result = getWeeklyStats(mockExpenses, date, 1000)

    // Week should start on Monday
    expect(result.start).toBe('2024-01-15')
    expect(result.end).toBe('2024-01-21')
  })

  it('should handle weeks with no expenses', () => {
    const date = new Date('2024-03-15')
    const result = getWeeklyStats(mockExpenses, date, 1000)

    expect(result.spent).toBe(0)
    expect(result.limit).toBe(1000)
  })
})

describe('getWeeklyPersonalStats', () => {
  it('should exclude project expenses from weekly spent amount', () => {
    const date = new Date('2024-01-15')
    const result = getWeeklyPersonalStats(mockExpenses, date, 1000)

    expect(result.spent).toBe(850)
    expect(result.limit).toBe(1000)
  })

  it('should keep correct week boundaries for personal expenses', () => {
    const date = new Date('2024-01-17')
    const result = getWeeklyPersonalStats(mockExpenses, date, 1000)

    expect(result.start).toBe('2024-01-15')
    expect(result.end).toBe('2024-01-21')
  })
})

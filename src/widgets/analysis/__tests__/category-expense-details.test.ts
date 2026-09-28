import {
  filterExpensesByNameGroups,
  getCategoryExpenseBase,
  groupExpenseDescriptions,
  groupExpensesByDate,
} from '../lib/category-expense-details'

import type { Expense } from '@/shared/types'

function expense(
  id: string,
  description: string,
  date = '2026-01-15',
  overrides: Partial<Expense> = {}
): Expense {
  return {
    id,
    description,
    amount: 100,
    date,
    category: 'Кафе',
    emoji: '☕',
    ...overrides,
  }
}

function findGroup(
  groups: ReturnType<typeof groupExpenseDescriptions>,
  name: string
) {
  return groups.find((group) => group.normalizedNames.includes(name))
}

describe('getCategoryExpenseBase', () => {
  const expenses = [
    expense('personal', 'Кофе', '2026-01-15'),
    expense('project', 'Кофе в проекте', '2026-01-16', { projectId: 'p1' }),
    expense('shared', 'Кофе общий', '2026-01-17', {
      sharedBudgetId: 'shared-1',
    }),
    expense('transfer', 'Взял из проекта', '2026-01-18', {
      projectId: 'p1',
      operationType: 'project_withdrawal',
    }),
    expense('other-month', 'Кофе февраль', '2026-02-01'),
    expense('other-category', 'Обед', '2026-01-15', { category: 'Еда' }),
  ]

  it('reuses month and all-scope expense selection and then filters the category', () => {
    const result = getCategoryExpenseBase(
      expenses,
      new Date(2026, 0, 15),
      'all',
      'Кафе'
    )

    expect(result.map((item) => item.id)).toEqual([
      'personal',
      'project',
      'shared',
    ])
  })

  it('keeps project-linked expenses in personal scope and excludes shared rows', () => {
    const result = getCategoryExpenseBase(
      expenses,
      new Date(2026, 0, 15),
      'personal',
      'Кафе'
    )

    expect(result.map((item) => item.id)).toEqual(['personal', 'project'])
  })

  it('returns only shared rows for shared scope', () => {
    const result = getCategoryExpenseBase(
      expenses,
      new Date(2026, 0, 15),
      'shared',
      'Кафе'
    )

    expect(result.map((item) => item.id)).toEqual(['shared'])
  })
})

describe('groupExpenseDescriptions', () => {
  it('groups the required Russian spelling variants and keeps existing spellings', () => {
    const expenses = [
      expense('1', 'столовка'),
      expense('2', 'столовка'),
      expense('3', 'столовая'),
      expense('4', 'столорка'),
    ]

    const [group] = groupExpenseDescriptions(expenses)

    expect(group.normalizedNames).toEqual(['столовая', 'столовка', 'столорка'])
    expect(group.label).toBe('столовка')
    expect(group.frequency).toBe(4)
    expect(group.variantCount).toBe(3)
    expect(group.variants).toEqual([
      { description: 'столовка', count: 2 },
      { description: 'столовая', count: 1 },
      { description: 'столорка', count: 1 },
    ])
  })

  it('normalizes letter case and surrounding whitespace for exact names', () => {
    const groups = groupExpenseDescriptions([
      expense('1', '  КОФЕ '),
      expense('2', 'кофе'),
    ])

    expect(groups).toHaveLength(1)
    expect(groups[0].normalizedNames).toEqual(['кофе'])
    expect(groups[0].frequency).toBe(2)
  })

  it('keeps blank descriptions in a selectable fallback group without changing rows', () => {
    const expenses = [
      expense('1', ''),
      expense('2', '   '),
      expense('3', 'Кофе'),
    ]
    const groups = groupExpenseDescriptions(expenses)
    const blankGroup = findGroup(groups, '')!

    expect(blankGroup.label).toBe('Без описания')
    expect(blankGroup.variantCount).toBe(1)
    expect(blankGroup.variants).toEqual([{ description: '', count: 2 }])
    expect(expenses.map((item) => item.description)).toEqual([
      '',
      '   ',
      'Кофе',
    ])
    expect(
      filterExpensesByNameGroups(
        expenses,
        groups,
        new Set([blankGroup.key])
      ).map((item) => item.id)
    ).toEqual(['1', '2'])
  })

  it('does not fuzzy-merge different short words, word qualifiers, or numbers', () => {
    const groups = groupExpenseDescriptions([
      expense('1', 'оплата такси'),
      expense('2', 'оплата связи'),
      expense('3', 'кофе большой'),
      expense('4', 'кофе дорогой'),
      expense('5', 'столовая 1'),
      expense('6', 'столовая 2'),
      expense('7', 'чай'),
      expense('8', 'чайка'),
    ])
    const find = (name: string) => findGroup(groups, name)

    expect(find('оплата такси')).not.toBe(find('оплата связи'))
    expect(find('кофе большой')).not.toBe(find('кофе дорогой'))
    expect(find('столовая 1')).not.toBe(find('столовая 2'))
    expect(find('чай')).not.toBe(find('чайка'))
  })

  it('keeps mixed-script spellings exact-only', () => {
    const groups = groupExpenseDescriptions([
      expense('1', 'столовка'),
      expense('2', 'стolovka'),
    ])

    expect(findGroup(groups, 'столовка')).not.toBe(
      findGroup(groups, 'стolovka')
    )
  })

  it('builds the same keys and representative regardless of expense order', () => {
    const expenses = [
      expense('1', 'столовка'),
      expense('2', 'столовая'),
      expense('3', 'столорка'),
      expense('4', 'столовка'),
    ]
    const forward = groupExpenseDescriptions(expenses)
    const reversed = groupExpenseDescriptions([...expenses].reverse())

    expect(reversed).toEqual(forward)
  })

  it('does not pull a transitive similarity chain into one group', () => {
    const groups = groupExpenseDescriptions([
      expense('a', 'abcdef'),
      expense('b', 'abcdxf'),
      expense('c', 'abxyef'),
    ])

    expect(findGroup(groups, 'abcdef')?.normalizedNames).toEqual([
      'abcdef',
      'abcdxf',
    ])
    expect(findGroup(groups, 'abxyef')).not.toBe(findGroup(groups, 'abcdef'))
  })

  it('uses a deterministic lexical label when source spellings tie', () => {
    const groups = groupExpenseDescriptions([
      expense('1', 'столовка'),
      expense('2', 'столовая'),
    ])

    expect(groups[0].label).toBe('столовая')
  })
})

describe('filterExpensesByNameGroups', () => {
  const expenses = [
    expense('1', 'столовка'),
    expense('2', 'столовая'),
    expense('3', 'магазин'),
  ]
  const groups = groupExpenseDescriptions(expenses)

  it('returns all base rows when no group is selected', () => {
    expect(filterExpensesByNameGroups(expenses, groups, new Set())).toEqual(
      expenses
    )
  })

  it('matches all source names in selected groups and combines groups with OR', () => {
    const selected = new Set([
      findGroup(groups, 'столовка')!.key,
      findGroup(groups, 'магазин')!.key,
    ])

    expect(
      filterExpensesByNameGroups(expenses, groups, selected).map(
        (item) => item.id
      )
    ).toEqual(['1', '2', '3'])
  })
})

describe('groupExpensesByDate', () => {
  it('groups rows by date and orders date groups newest first without mutating input', () => {
    const expenses = [
      expense('older', 'Старый', '2026-01-01'),
      expense('newer-first', 'Новый 1', '2026-01-31'),
      expense('newer-second', 'Новый 2', '2026-01-31'),
    ]
    const groups = groupExpensesByDate(expenses)

    expect(groups.map((group) => group.date)).toEqual([
      '2026-01-31',
      '2026-01-01',
    ])
    expect(groups[0].expenses.map((item) => item.id)).toEqual([
      'newer-first',
      'newer-second',
    ])
    expect(expenses.map((item) => item.id)).toEqual([
      'older',
      'newer-first',
      'newer-second',
    ])
  })
})

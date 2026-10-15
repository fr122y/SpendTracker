import { getPocketMonthHistory } from '../pocket-history'

import type { Expense, PocketMonthBudget } from '@/shared/types'

function operation(
  id: string,
  date: string,
  amount: number,
  overrides: Partial<Expense> = {}
): Expense {
  return {
    id,
    pocketId: 'pocket-1',
    description: id,
    amount,
    date,
    category: 'Путешествия',
    emoji: '✈️',
    ...overrides,
  }
}

function budget(period: string, value: number): PocketMonthBudget {
  return { pocketId: 'pocket-1', period, budget: value }
}

describe('getPocketMonthHistory', () => {
  it('lists months from creation to the selected month, newest first', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2026, 7, 20).toISOString(),
      budgets: [budget('2026-08', 1000)],
      expenses: [],
      selectedPeriod: '2026-10',
    })

    expect(history.map((month) => month.period)).toEqual([
      '2026-10',
      '2026-09',
      '2026-08',
    ])
  })

  it('carries the latest earlier saved budget into gaps, never a later one', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2026, 2, 1).toISOString(),
      budgets: [budget('2026-04', 20000), budget('2026-06', 24000)],
      expenses: [],
      selectedPeriod: '2026-07',
    })

    expect(
      history.map(({ period, budget, isBudgetSaved }) => [
        period,
        budget,
        isBudgetSaved,
      ])
    ).toEqual([
      ['2026-07', 24000, false],
      ['2026-06', 24000, true],
      ['2026-05', 20000, false],
      ['2026-04', 20000, true],
      ['2026-03', 0, false],
    ])
  })

  it('reduces the remainder by both purchases and transfers without carry-over', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2026, 0, 5).toISOString(),
      budgets: [budget('2026-01', 10000)],
      expenses: [
        operation('purchase', '2026-01-10', 4000),
        operation('transfer', '2026-01-20', 7000, {
          operationType: 'pocket_transfer',
        }),
        operation('small', '2026-02-03', 3000),
      ],
      selectedPeriod: '2026-02',
    })

    expect(history).toEqual([
      {
        period: '2026-02',
        budget: 10000,
        isBudgetSaved: false,
        purchaseTotal: 3000,
        transferTotal: 0,
        spent: 3000,
        remaining: 7000,
      },
      {
        period: '2026-01',
        budget: 10000,
        isBudgetSaved: true,
        purchaseTotal: 4000,
        transferTotal: 7000,
        spent: 11000,
        remaining: -1000,
      },
    ])
  })

  it('assigns operations by calendar month across year boundaries', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2025, 11, 1).toISOString(),
      budgets: [budget('2025-12', 500)],
      expenses: [
        operation('last-day', '2025-12-31', 100),
        operation('first-day', '2026-01-01', 200),
        operation('after-selected', '2026-02-01', 900),
      ],
      selectedPeriod: '2026-01',
    })

    expect(history.map(({ period, spent }) => [period, spent])).toEqual([
      ['2026-01', 200],
      ['2025-12', 100],
    ])
  })

  it('ignores other pockets and non-pocket operations', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2026, 0, 1).toISOString(),
      budgets: [
        budget('2026-01', 100),
        { ...budget('2026-01', 9), pocketId: 'other' },
      ],
      expenses: [
        operation('other', '2026-01-02', 50, { pocketId: 'other' }),
        operation('plain', '2026-01-02', 50, { pocketId: undefined }),
      ],
      selectedPeriod: '2026-01',
    })

    expect(history).toEqual([
      expect.objectContaining({ budget: 100, spent: 0, remaining: 100 }),
    ])
  })

  it('starts at an operation dated before the creation month', () => {
    const history = getPocketMonthHistory({
      pocketId: 'pocket-1',
      pocketCreatedAt: new Date(2026, 4, 1).toISOString(),
      budgets: [],
      expenses: [operation('backdated', '2026-04-15', 300)],
      selectedPeriod: '2026-05',
    })

    expect(history.map(({ period, remaining }) => [period, remaining])).toEqual(
      [
        ['2026-05', 0],
        ['2026-04', -300],
      ]
    )
  })

  it('returns no months when the selected month is before the pocket', () => {
    expect(
      getPocketMonthHistory({
        pocketId: 'pocket-1',
        pocketCreatedAt: new Date(2026, 4, 1).toISOString(),
        budgets: [],
        expenses: [],
        selectedPeriod: '2026-03',
      })
    ).toEqual([])
  })
})

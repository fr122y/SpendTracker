import { buildExpensePatch, getExpenseEditRules } from '../model/edit-rules'

import type { Expense } from '@/shared/types'

const base: Expense = {
  id: 'e1',
  description: 'Обед',
  amount: 500,
  date: '2026-01-31',
  category: 'Еда',
  emoji: '🍔',
}
const categories = [
  { id: 'c1', name: 'Еда', emoji: '🍔' },
  { id: 'c2', name: 'Такси', emoji: '🚕' },
]

describe('getExpenseEditRules', () => {
  it('allows every field of a personal expense', () => {
    expect(getExpenseEditRules(base)).toMatchObject({
      canEditAmount: true,
      canEditCategory: true,
      allowZeroAmount: false,
    })
  })

  it('locks the category of a shared expense', () => {
    expect(
      getExpenseEditRules({ ...base, sharedBudgetId: 's1' })
    ).toMatchObject({ canEditAmount: true, canEditCategory: false })
  })

  it('keeps project movements to description and date', () => {
    expect(
      getExpenseEditRules({ ...base, operationType: 'project_return' })
    ).toMatchObject({ canEditAmount: false, canEditCategory: false })
  })
})

describe('buildExpensePatch', () => {
  it('returns an empty patch when nothing changed', () => {
    expect(
      buildExpensePatch(
        base,
        {
          description: 'Обед ',
          amount: 500,
          date: base.date,
          categoryName: 'Еда',
        },
        categories
      )
    ).toEqual({})
  })

  it('never sends category metadata for a shared expense', () => {
    expect(
      buildExpensePatch(
        { ...base, sharedBudgetId: 's1' },
        {
          description: 'Обед',
          amount: 500,
          date: base.date,
          categoryName: 'Такси',
        },
        categories
      )
    ).toEqual({})
  })

  it('never sends the amount of a project movement', () => {
    expect(
      buildExpensePatch(
        { ...base, operationType: 'project_withdrawal', projectId: 'p1' },
        {
          description: 'Обед',
          amount: 900,
          date: '2026-02-02',
          categoryName: 'Еда',
        },
        categories
      )
    ).toEqual({ date: '2026-02-02' })
  })
})

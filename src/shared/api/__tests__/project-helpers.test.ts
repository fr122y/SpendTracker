jest.mock('@/shared/db', () => ({
  db: {},
  expenses: {
    id: 'expense.id',
    amount: 'expense.amount',
    operationType: 'expense.operationType',
    projectId: 'expense.projectId',
    userId: 'expense.userId',
  },
  projects: { id: 'project.id', userId: 'project.userId' },
}))

jest.mock('drizzle-orm', () => ({
  and: jest.fn(() => ({})),
  eq: jest.fn(() => ({})),
}))

import {
  assertProjectCashCovers,
  getProjectCashBalance,
  getProjectCashEffect,
  PROJECT_RETURN_EXCEEDS_CASH_ERROR,
} from '../project-helpers'

const operations = [
  { id: 'w1', amount: 5000, operationType: 'project_withdrawal' },
  { id: 'r1', amount: 1000, operationType: 'project_return' },
  { id: 'e1', amount: 700, operationType: 'expense' },
]

function createTransaction(
  project: { id: string } | undefined,
  rows: typeof operations
) {
  const forUpdate = jest.fn().mockResolvedValue(project ? [project] : [])
  const select = jest
    .fn()
    .mockImplementationOnce(() => ({
      from: () => ({ where: () => ({ for: forUpdate }) }),
    }))
    .mockImplementationOnce(() => ({
      from: () => ({ where: jest.fn().mockResolvedValue(rows) }),
    }))
  return { transaction: { select } as never, forUpdate }
}

describe('project cash helpers', () => {
  it('counts withdrawals minus returns and ignores project expenses', () => {
    expect(getProjectCashBalance(operations)).toBe(4000)
    expect(getProjectCashBalance(operations, 'r1')).toBe(5000)
    expect(getProjectCashEffect('project_return', 300)).toBe(-300)
    expect(getProjectCashEffect('expense', 300)).toBe(0)
  })

  it('locks the project row and accepts a return up to the cash on hand', async () => {
    const { transaction, forUpdate } = createTransaction(
      { id: 'project-1' },
      operations
    )

    await expect(
      assertProjectCashCovers(transaction, {
        userId: 'user-1',
        projectId: 'project-1',
        delta: -4000,
      })
    ).resolves.toBeUndefined()
    expect(forUpdate).toHaveBeenCalledWith('update')
  })

  it('rejects a return larger than the cash on hand', async () => {
    const { transaction } = createTransaction({ id: 'project-1' }, operations)

    await expect(
      assertProjectCashCovers(transaction, {
        userId: 'user-1',
        projectId: 'project-1',
        delta: -4001,
      })
    ).rejects.toThrow(PROJECT_RETURN_EXCEEDS_CASH_ERROR)
  })

  it('rejects a project that does not belong to the user', async () => {
    const { transaction } = createTransaction(undefined, operations)

    await expect(
      assertProjectCashCovers(transaction, {
        userId: 'user-2',
        projectId: 'project-1',
        delta: 100,
      })
    ).rejects.toThrow('Project not found')
  })
})

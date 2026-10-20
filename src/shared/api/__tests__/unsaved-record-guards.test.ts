import {
  countCategoryExpenses,
  deleteCategoryWithReassign,
  updateCategory,
} from '../category-actions'
import { deleteExpense, updateExpense } from '../expense-actions'
import { deleteKeywordMapping } from '../keyword-actions'
import {
  archivePocket,
  getPocketMonthBudgets,
  initializePocketMonthBudget,
  renamePocket,
  restorePocket,
  setPocketMonthBudget,
} from '../pocket-actions'
import { deleteProject } from '../project-actions'
import {
  archiveSharedBudget,
  setActiveSharedBudget,
  setSharedWeeklyLimitForWeek,
} from '../shared-budget-actions'
import {
  archiveSharedBudgetCategory,
  getSharedBudgetCategories,
  updateSharedBudgetCategory,
} from '../shared-category-actions'
import {
  deleteSharedKeywordMapping,
  getSharedKeywordMappings,
} from '../shared-keyword-actions'

jest.mock('@/shared/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))

// Any database access fails the test: a temporary id names no stored record.
jest.mock('@/shared/db', () => {
  const fail = () => {
    throw new Error('database must not be touched for a temporary id')
  }
  return new Proxy(
    {},
    {
      get: (_target, key) =>
        key === '__esModule'
          ? false
          : key === 'db'
            ? new Proxy({}, { get: fail })
            : {},
    }
  )
})

const TEMP = 'temp-1'

describe('server actions with a temporary id', () => {
  it.each([
    ['getPocketMonthBudgets', () => getPocketMonthBudgets(TEMP), []],
    [
      'initializePocketMonthBudget',
      () => initializePocketMonthBudget(TEMP, '2026-10'),
      null,
    ],
    [
      'setPocketMonthBudget',
      () => setPocketMonthBudget(TEMP, '2026-10', 5),
      null,
    ],
    ['archivePocket', () => archivePocket(TEMP), undefined],
    [
      'renamePocket',
      () => renamePocket(TEMP, 'Море'),
      { status: 'unsaved_record' },
    ],
    ['restorePocket', () => restorePocket(TEMP), { status: 'unsaved_record' }],
    ['deleteExpense', () => deleteExpense(TEMP), { status: 'deleted' }],
    ['updateExpense', () => updateExpense(TEMP, { amount: 5 }), undefined],
    ['countCategoryExpenses', () => countCategoryExpenses(TEMP), 0],
    [
      'deleteCategoryWithReassign',
      () => deleteCategoryWithReassign(TEMP, 'other'),
      { moved: 0 },
    ],
    [
      'deleteCategoryWithReassign into a temporary target',
      () => deleteCategoryWithReassign('other', TEMP),
      { moved: 0 },
    ],
    ['updateCategory', () => updateCategory(TEMP, { name: 'Кафе' }), null],
    ['deleteKeywordMapping', () => deleteKeywordMapping(TEMP), undefined],
    ['getSharedKeywordMappings', () => getSharedKeywordMappings(TEMP), []],
    [
      'deleteSharedKeywordMapping',
      () => deleteSharedKeywordMapping('budget-1', TEMP),
      undefined,
    ],
    ['getSharedBudgetCategories', () => getSharedBudgetCategories(TEMP), []],
    [
      'updateSharedBudgetCategory',
      () => updateSharedBudgetCategory(TEMP, { name: 'Кафе' }),
      undefined,
    ],
    [
      'archiveSharedBudgetCategory',
      () => archiveSharedBudgetCategory(TEMP),
      undefined,
    ],
    ['archiveSharedBudget', () => archiveSharedBudget(TEMP), undefined],
    ['setActiveSharedBudget', () => setActiveSharedBudget(TEMP), undefined],
    [
      'setSharedWeeklyLimitForWeek',
      () => setSharedWeeklyLimitForWeek(TEMP, '2026-10-19', 5),
      undefined,
    ],
    ['deleteProject', () => deleteProject(TEMP), undefined],
  ] as const)('%s answers without an error', async (_name, call, expected) => {
    await expect(call()).resolves.toEqual(expected)
  })
})

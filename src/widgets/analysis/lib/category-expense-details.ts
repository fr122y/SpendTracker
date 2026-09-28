import Fuse from 'fuse.js'

import { getMonthlyExpenses, type ExpenseScope } from '@/shared/lib'

import type { Expense } from '@/shared/types'
import type { IFuseOptions } from 'fuse.js'

const FUZZY_OPTIONS = {
  keys: ['value'],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
} satisfies IFuseOptions<{ value: string }>

const MIN_FUZZY_TOKEN_LENGTH = 6

export interface ExpenseNameVariant {
  description: string
  count: number
}

export interface ExpenseNameGroup {
  key: string
  label: string
  frequency: number
  variantCount: number
  normalizedNames: string[]
  variants: ExpenseNameVariant[]
}

export interface ExpenseDateGroup {
  date: string
  expenses: Expense[]
}

interface NameEntry {
  normalizedName: string
  frequency: number
  spellingCounts: Map<string, number>
}

function compareCodePoints(left: string, right: string): number {
  const leftPoints = Array.from(left, (character) => character.codePointAt(0)!)
  const rightPoints = Array.from(
    right,
    (character) => character.codePointAt(0)!
  )
  const sharedLength = Math.min(leftPoints.length, rightPoints.length)

  for (let index = 0; index < sharedLength; index += 1) {
    const difference = leftPoints[index] - rightPoints[index]
    if (difference !== 0) return difference
  }

  return leftPoints.length - rightPoints.length
}

export function normalizeExpenseDescription(description: string): string {
  return description.trim().toLowerCase()
}

function splitWords(description: string): string[] {
  return description.split(/\s+/).filter(Boolean)
}

function getNumberTokens(description: string): string[] {
  return description.match(/[0-9]+/g) ?? []
}

function getFuzzyScript(token: string): 'cyrillic' | 'latin' | null {
  if (/^[\u0400-\u052F]+$/.test(token)) return 'cyrillic'
  if (/^[a-z]+$/.test(token)) return 'latin'
  return null
}

function getCodePointLength(value: string): number {
  return Array.from(value).length
}

function createNameEntry(expenses: Expense[]): NameEntry[] {
  const entries = new Map<string, NameEntry>()

  for (const expense of expenses) {
    const normalizedName = normalizeExpenseDescription(expense.description)
    const entry = entries.get(normalizedName) ?? {
      normalizedName,
      frequency: 0,
      spellingCounts: new Map<string, number>(),
    }
    const spelling = expense.description.trim()

    entry.frequency += 1
    entry.spellingCounts.set(
      spelling,
      (entry.spellingCounts.get(spelling) ?? 0) + 1
    )
    entries.set(normalizedName, entry)
  }

  return [...entries.values()].sort((a, b) =>
    compareCodePoints(a.normalizedName, b.normalizedName)
  )
}

function createTokenMatcher(entries: NameEntry[]) {
  const tokens = new Set<string>()

  for (const entry of entries) {
    for (const token of splitWords(entry.normalizedName)) {
      if (
        getCodePointLength(token) >= MIN_FUZZY_TOKEN_LENGTH &&
        getFuzzyScript(token)
      ) {
        tokens.add(token)
      }
    }
  }

  const fuse = new Fuse(
    [...tokens].map((value) => ({ value })),
    FUZZY_OPTIONS
  )

  return (query: string, target: string): number => {
    if (query === target) return 0

    return (
      fuse.search(query).find((result) => result.item.value === target)
        ?.score ?? 1
    )
  }
}

function createCompatibilityMatcher(entries: NameEntry[]) {
  const scoreToken = createTokenMatcher(entries)

  return (left: string, right: string): boolean => {
    if (left === right) return true

    const leftWords = splitWords(left)
    const rightWords = splitWords(right)
    const leftNumbers = getNumberTokens(left)
    const rightNumbers = getNumberTokens(right)

    if (
      leftWords.length !== rightWords.length ||
      JSON.stringify(leftNumbers) !== JSON.stringify(rightNumbers)
    ) {
      return false
    }

    return leftWords.every((leftWord, index) => {
      const rightWord = rightWords[index]
      if (leftWord === rightWord) return true

      if (
        getCodePointLength(leftWord) < MIN_FUZZY_TOKEN_LENGTH ||
        getCodePointLength(rightWord) < MIN_FUZZY_TOKEN_LENGTH
      ) {
        return false
      }

      const script = getFuzzyScript(leftWord)
      if (!script || getFuzzyScript(rightWord) !== script) return false

      return (
        scoreToken(leftWord, rightWord) < 0.4 &&
        scoreToken(rightWord, leftWord) < 0.4
      )
    })
  }
}

function createGroups(entries: NameEntry[]): NameEntry[][] {
  const canGroup = createCompatibilityMatcher(entries)
  const entryCount = entries.length
  const adjacency = new Uint8Array(entryCount * entryCount)
  const degrees = new Int32Array(entryCount)

  // Score each unordered name pair once. The indexed matrix also makes the
  // repeated complete-link membership checks cheap during clustering.
  for (let left = 0; left < entryCount; left += 1) {
    for (let right = left + 1; right < entryCount; right += 1) {
      if (
        !canGroup(entries[left].normalizedName, entries[right].normalizedName)
      ) {
        continue
      }

      adjacency[left * entryCount + right] = 1
      adjacency[right * entryCount + left] = 1
      degrees[left] += 1
      degrees[right] += 1
    }
  }

  const isRemaining = new Uint8Array(entryCount).fill(1)
  let remainingCount = entryCount
  const groups: NameEntry[][] = []

  while (remainingCount > 0) {
    let bestGroup: number[] = []

    for (let anchor = 0; anchor < entryCount; anchor += 1) {
      if (!isRemaining[anchor]) continue

      // Entries are sorted by normalized name, so earlier anchors win ties.
      // A remaining node cannot form a group larger than degree + itself.
      if (bestGroup.length > 0 && degrees[anchor] + 1 <= bestGroup.length) {
        continue
      }

      const group = [anchor]
      for (let candidate = 0; candidate < entryCount; candidate += 1) {
        if (
          !isRemaining[candidate] ||
          candidate === anchor ||
          !adjacency[anchor * entryCount + candidate]
        ) {
          continue
        }

        let isCompleteLinkNeighbor = true
        for (const member of group) {
          if (!adjacency[member * entryCount + candidate]) {
            isCompleteLinkNeighbor = false
            break
          }
        }

        if (isCompleteLinkNeighbor) {
          group.push(candidate)
        }
      }

      if (group.length > bestGroup.length) {
        bestGroup = group
      }
    }

    groups.push(bestGroup.map((index) => entries[index]))

    // Keep degrees current so isolated/small groups don't require rebuilding
    // all candidate sets on every clustering pass.
    for (const member of bestGroup) {
      isRemaining[member] = 0
      remainingCount -= 1

      for (let candidate = 0; candidate < entryCount; candidate += 1) {
        if (
          isRemaining[candidate] &&
          adjacency[member * entryCount + candidate]
        ) {
          degrees[candidate] -= 1
        }
      }
    }
  }

  return groups
}

function toNameGroup(entries: NameEntry[]): ExpenseNameGroup {
  const normalizedNames = entries
    .map((entry) => entry.normalizedName)
    .toSorted(compareCodePoints)
  const spellingCounts = new Map<string, number>()

  for (const entry of entries) {
    for (const [spelling, count] of entry.spellingCounts) {
      spellingCounts.set(spelling, (spellingCounts.get(spelling) ?? 0) + count)
    }
  }

  const variants = [...spellingCounts.entries()]
    .map(([description, count]) => ({ description, count }))
    .toSorted(
      (a, b) =>
        b.count - a.count || compareCodePoints(a.description, b.description)
    )
  const label = variants[0]?.description || 'Без описания'
  const frequency = entries.reduce((total, entry) => total + entry.frequency, 0)

  return {
    key: JSON.stringify(normalizedNames),
    label,
    frequency,
    variantCount: normalizedNames.length,
    normalizedNames,
    variants,
  }
}

export function getCategoryExpenseBase(
  expenses: Expense[],
  date: Date,
  scope: ExpenseScope,
  category: string
): Expense[] {
  return getMonthlyExpenses(expenses, date, scope).filter(
    (expense) => expense.category === category
  )
}

export function groupExpenseDescriptions(
  expenses: Expense[]
): ExpenseNameGroup[] {
  const entries = createNameEntry(expenses)

  if (entries.length === 0) return []

  return createGroups(entries)
    .map(toNameGroup)
    .toSorted(
      (a, b) => b.frequency - a.frequency || compareCodePoints(a.label, b.label)
    )
}

export function filterExpensesByNameGroups(
  expenses: Expense[],
  groups: ExpenseNameGroup[],
  selectedGroupKeys: ReadonlySet<string>
): Expense[] {
  if (selectedGroupKeys.size === 0) return expenses

  const selectedNames = new Set(
    groups
      .filter((group) => selectedGroupKeys.has(group.key))
      .flatMap((group) => group.normalizedNames)
  )

  return expenses.filter((expense) =>
    selectedNames.has(normalizeExpenseDescription(expense.description))
  )
}

export function groupExpensesByDate(expenses: Expense[]): ExpenseDateGroup[] {
  const groups = new Map<string, Expense[]>()

  for (const expense of expenses) {
    const group = groups.get(expense.date) ?? []
    group.push(expense)
    groups.set(expense.date, group)
  }

  return [...groups.entries()]
    .toSorted(([leftDate], [rightDate]) =>
      compareCodePoints(rightDate, leftDate)
    )
    .map(([date, groupedExpenses]) => ({ date, expenses: groupedExpenses }))
}

'use client'

import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react'
import { useId, useState } from 'react'

import { Button } from '@/shared/ui'

import type { KeywordMatchType } from '@/shared/types'

export interface CategoryRule {
  id: string
  keyword: string
  matchType: KeywordMatchType
}

interface CategoryRulesProps {
  categoryName: string
  rules: CategoryRule[]
  onDelete: (id: string) => void
}

const MATCH_TYPE_LABEL: Record<KeywordMatchType, string> = {
  exact: 'вся фраза',
  fuzzy: 'по слову',
}

/**
 * Auto-categorization rules of one category: a collapsed toggle with the rule
 * count that expands into the list, each rule with its own delete button.
 */
export function CategoryRules({
  categoryName,
  rules,
  onDelete,
}: CategoryRulesProps) {
  const [isOpen, setIsOpen] = useState(false)
  const listId = useId()
  const Icon = isOpen ? ChevronDown : ChevronRight

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={`Правила категории ${categoryName}: ${rules.length}`}
        className="flex min-h-9 items-center gap-1 self-start rounded px-1 text-xs text-zinc-400 transition hover:text-zinc-100"
      >
        <Icon className="h-3 w-3" aria-hidden="true" />
        Правила автокатегоризации: {rules.length}
      </button>
      {isOpen && (
        <div id={listId}>
          {rules.length === 0 ? (
            <p className="px-1 text-xs text-zinc-500">
              Правил нет. Правило появляется, когда вы вручную выбираете
              категорию для описания.
            </p>
          ) : (
            <ul className="flex flex-col gap-1">
              {rules.map((rule) => (
                <li
                  key={rule.id}
                  className="flex items-center justify-between gap-2 rounded bg-zinc-900/60 px-2 py-1"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-sm text-zinc-200">
                      {rule.keyword}
                    </span>
                    <span className="shrink-0 rounded px-1.5 py-0.5 text-[11px] text-zinc-400 ring-1 ring-zinc-700">
                      {MATCH_TYPE_LABEL[rule.matchType]}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => onDelete(rule.id)}
                    aria-label={`Удалить правило «${rule.keyword}»`}
                    className="shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

/** Groups rules by category id, keeping the order of the source list. */
export function groupRulesByCategory<
  T extends CategoryRule & { categoryId: string },
>(rules: T[]): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const rule of rules) {
    const list = grouped.get(rule.categoryId) ?? []
    list.push(rule)
    grouped.set(rule.categoryId, list)
  }
  return grouped
}

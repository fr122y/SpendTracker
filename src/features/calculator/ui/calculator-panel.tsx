'use client'

import { Check, Copy, Delete, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useBucketStore } from '@/entities/bucket'
import { useSettingsStore } from '@/entities/settings'
import { cn, formatKopecks } from '@/shared/lib'

import {
  appendKey,
  backspace,
  evaluateExpression,
  formatExpressionForDisplay,
  formatResultForCopy,
  formatResultForDisplay,
  insertValue,
} from '../lib/expression'
import { buildSavingsValues, kopecksToPlainRubles } from '../lib/savings-values'

type CopyStatus = 'idle' | 'copied' | 'failed'

interface KeyDef {
  label: string
  ariaLabel?: string
  key: string
  tone?: 'digit' | 'operator' | 'action' | 'equals'
}

const KEYS: KeyDef[] = [
  { label: 'C', ariaLabel: 'Очистить', key: 'clear', tone: 'action' },
  { label: '(', key: '(', tone: 'operator' },
  { label: ')', key: ')', tone: 'operator' },
  { label: '÷', ariaLabel: 'Разделить', key: '/', tone: 'operator' },
  { label: '7', key: '7' },
  { label: '8', key: '8' },
  { label: '9', key: '9' },
  { label: '×', ariaLabel: 'Умножить', key: '*', tone: 'operator' },
  { label: '4', key: '4' },
  { label: '5', key: '5' },
  { label: '6', key: '6' },
  { label: '−', ariaLabel: 'Минус', key: '-', tone: 'operator' },
  { label: '1', key: '1' },
  { label: '2', key: '2' },
  { label: '3', key: '3' },
  { label: '+', ariaLabel: 'Плюс', key: '+', tone: 'operator' },
  { label: ',', ariaLabel: 'Десятичная запятая', key: '.' },
  { label: '0', key: '0' },
  { label: '⌫', ariaLabel: 'Стереть', key: 'backspace', tone: 'action' },
  { label: '=', ariaLabel: 'Равно', key: '=', tone: 'equals' },
]

const KEY_TONES: Record<NonNullable<KeyDef['tone']>, string> = {
  digit: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  operator: 'bg-zinc-800/60 text-emerald-400 hover:bg-zinc-700',
  action: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700',
  equals: 'bg-emerald-600 text-white hover:bg-emerald-500',
}

function money(kopecks: number): string {
  return `${formatKopecks(kopecks).replace(/[  ]/g, ' ')} ₽`
}

interface CalculatorPanelProps {
  onClose: () => void
}

export function CalculatorPanel({ onClose }: CalculatorPanelProps) {
  const [expression, setExpression] = useState('')
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const salary = useSettingsStore((state) => state.salary)
  const buckets = useBucketStore((state) => state.buckets)
  const values = buildSavingsValues(salary, buckets)

  const result = evaluateExpression(expression)

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const update = (next: string) => {
    setExpression(next)
    setCopyStatus('idle')
  }

  const handleKey = (key: string) => {
    if (key === 'clear') return update('')
    if (key === 'backspace') return update(backspace(expression))
    if (key === '=') {
      if (result !== null) update(formatResultForCopy(result))
      return
    }
    update(appendKey(expression, key))
  }

  const handleCopy = async () => {
    if (result === null) return
    try {
      await navigator.clipboard.writeText(formatResultForCopy(result))
      setCopyStatus('copied')
    } catch {
      setCopyStatus('failed')
    }
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setCopyStatus('idle'), 2000)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-zinc-300">Калькулятор</h2>
        <button
          type="button"
          aria-label="Закрыть калькулятор"
          onClick={onClose}
          className="flex h-11 w-11 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="rounded-lg bg-zinc-950 px-3 py-2 text-right">
        <div
          data-testid="calculator-expression"
          className="min-h-6 overflow-x-auto text-sm break-all whitespace-normal text-zinc-400"
        >
          {expression === '' ? '0' : formatExpressionForDisplay(expression)}
        </div>
        <div className="flex items-center justify-end gap-2">
          <output
            data-testid="calculator-result"
            aria-live="polite"
            className="truncate font-mono text-2xl text-zinc-100"
          >
            {result === null ? '—' : formatResultForDisplay(result)}
          </output>
        </div>
        <div className="mt-1 flex items-center justify-end gap-2">
          {copyStatus !== 'idle' && (
            <span
              role="status"
              className={cn(
                'text-xs',
                copyStatus === 'copied' ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {copyStatus === 'copied'
                ? 'Скопировано'
                : 'Не удалось скопировать'}
            </span>
          )}
          <button
            type="button"
            onClick={handleCopy}
            disabled={result === null}
            className="flex min-h-9 items-center gap-1.5 rounded-md border border-zinc-700 px-2.5 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-40"
          >
            {copyStatus === 'copied' ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Скопировать
          </button>
        </div>
      </div>

      {values.length > 0 && (
        <div
          aria-label="Значения из «Накоплений»"
          role="group"
          className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1"
        >
          {values.map((value) => (
            <button
              key={value.id}
              type="button"
              aria-label={`${value.label} · ${money(value.kopecks)}`}
              title={`${value.label} · ${money(value.kopecks)}`}
              onClick={() =>
                update(
                  insertValue(expression, kopecksToPlainRubles(value.kopecks))
                )
              }
              className="flex max-w-[12rem] shrink-0 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-200 hover:border-emerald-600"
            >
              <span className="truncate">{value.label}</span>
              <span aria-hidden="true" className="text-zinc-500">
                ·
              </span>
              <span className="shrink-0 font-mono text-zinc-100">
                {money(value.kopecks)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.map((def) => (
          <button
            key={def.key}
            type="button"
            aria-label={def.ariaLabel}
            onClick={() => handleKey(def.key)}
            className={cn(
              'flex h-11 items-center justify-center rounded-lg text-lg font-medium transition-colors',
              KEY_TONES[def.tone ?? 'digit']
            )}
          >
            {def.key === 'backspace' ? (
              <Delete className="h-5 w-5" aria-hidden="true" />
            ) : (
              def.label
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

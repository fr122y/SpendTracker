'use client'

import { ArrowLeft, ArrowRight, Check, Copy, Delete, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useBucketStore } from '@/entities/bucket'
import { useSettingsStore } from '@/entities/settings'
import { cn, formatKopecks } from '@/shared/lib'
import { Skeleton } from '@/shared/ui'

import {
  displayToken,
  evaluateTokens,
  formatResultForCopy,
  formatResultForDisplay,
  insertSavings,
  refreshAmounts,
  setCaret,
  type Amounts,
  type CalculatorState,
} from '../lib/expression'
import {
  applyCommand,
  keyToCommand,
  shouldHandleKey,
  type CalculatorCommand,
} from '../lib/keyboard'
import { buildSavingsValues } from '../lib/savings-values'
import { updateCalculator, useCalculatorState } from '../model/calculator-store'

type CopyStatus = 'idle' | 'copied' | 'failed'
type Tone = 'digit' | 'operator' | 'action' | 'equals'

interface KeyDef {
  id: string
  label: React.ReactNode
  ariaLabel?: string
  tone?: Tone
  span?: 2 | 3
  command: CalculatorCommand
}

const key = (value: string, extra: Partial<KeyDef> = {}): KeyDef => ({
  id: value,
  label: value,
  command: { type: 'char', value },
  ...extra,
})

const KEYS: KeyDef[] = [
  {
    id: 'left',
    label: <ArrowLeft className="h-5 w-5" aria-hidden="true" />,
    ariaLabel: 'Курсор влево',
    tone: 'action',
    command: { type: 'left' },
  },
  {
    id: 'right',
    label: <ArrowRight className="h-5 w-5" aria-hidden="true" />,
    ariaLabel: 'Курсор вправо',
    tone: 'action',
    command: { type: 'right' },
  },
  {
    id: 'backspace',
    label: <Delete className="h-5 w-5" aria-hidden="true" />,
    ariaLabel: 'Стереть',
    tone: 'action',
    command: { type: 'backspace' },
  },
  {
    id: 'clear',
    label: 'C',
    ariaLabel: 'Очистить',
    tone: 'action',
    command: { type: 'clear' },
  },
  key('/', { label: '÷', ariaLabel: 'Разделить', tone: 'operator' }),
  key('7'),
  key('8'),
  key('9'),
  key('(', { tone: 'operator' }),
  key('*', { label: '×', ariaLabel: 'Умножить', tone: 'operator' }),
  key('4'),
  key('5'),
  key('6'),
  key(')', { tone: 'operator' }),
  key('-', { label: '−', ariaLabel: 'Минус', tone: 'operator' }),
  key('1'),
  key('2'),
  key('3'),
  key('.', { label: ',', ariaLabel: 'Десятичная запятая' }),
  key('+', { ariaLabel: 'Плюс', tone: 'operator' }),
  key('0', { span: 3 }),
  {
    id: 'equals',
    label: '=',
    ariaLabel: 'Равно',
    tone: 'equals',
    span: 2,
    command: { type: 'equals' },
  },
]

const KEY_TONES: Record<Tone, string> = {
  digit: 'bg-zinc-800 text-zinc-100 hover:bg-zinc-700',
  operator: 'bg-zinc-800/60 text-emerald-400 hover:bg-zinc-700',
  action: 'bg-zinc-800/60 text-zinc-300 hover:bg-zinc-700',
  equals: 'bg-emerald-600 text-white hover:bg-emerald-500',
}

function money(kopecks: number): string {
  return `${formatKopecks(kopecks).replace(/[  ]/g, ' ')} ₽`
}

/** Mouse presses keep focus where it was, so Enter keeps meaning «=». */
const keepFocus = (event: React.MouseEvent) => event.preventDefault()

function Caret() {
  return (
    <span
      data-testid="calculator-caret"
      aria-hidden="true"
      className="mx-px inline-block h-5 w-0.5 animate-pulse bg-emerald-400 align-middle"
    />
  )
}

interface CalculatorPanelProps {
  onClose: () => void
}

export function CalculatorPanel({ onClose }: CalculatorPanelProps) {
  const state = useCalculatorState()
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle')
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const salary = useSettingsStore((settings) => settings.salary)
  const isSettingsLoading = useSettingsStore((settings) => settings.isLoading)
  const buckets = useBucketStore((store) => store.buckets)
  const isBucketsLoading = useBucketStore((store) => store.isLoading)

  // Until both sources load, salary and buckets are placeholders; offering
  // them as chips would insert a value that silently changes later.
  const isValuesLoading = isSettingsLoading || isBucketsLoading
  const values = isValuesLoading ? [] : buildSavingsValues(salary, buckets)
  const amounts: Amounts =
    isValuesLoading || values.length === 0
      ? null
      : new Map(values.map((value) => [value.id, value.kopecks]))

  const result = evaluateTokens(state.tokens, amounts)

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    }
  }, [])

  const dispatch = (update: (current: CalculatorState) => CalculatorState) => {
    updateCalculator((current) => update(refreshAmounts(current, amounts)))
    setCopyStatus('idle')
  }

  const runCommand = (command: CalculatorCommand) =>
    dispatch((current) => applyCommand(current, command, amounts))

  // The listener reads the latest render's commands without re-subscribing.
  const runCommandRef = useRef(runCommand)
  runCommandRef.current = runCommand
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shouldHandleKey(event, containerRef.current)) return
      const command = keyToCommand(event)
      if (!command) return
      event.preventDefault()
      runCommandRef.current(command)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleTokenClick = (
    event: React.MouseEvent<HTMLSpanElement>,
    index: number
  ) => {
    event.stopPropagation()
    const rect = event.currentTarget.getBoundingClientRect()
    const after = event.clientX >= rect.left + rect.width / 2
    dispatch((current) => setCaret(current, index + (after ? 1 : 0)))
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

  const items: React.ReactNode[] = state.tokens.map((token, index) => {
    const view = displayToken(token, amounts)
    return (
      <span
        key={index}
        data-testid="calculator-token"
        title={view.title}
        onClick={(event) => handleTokenClick(event, index)}
        className={cn(
          'cursor-text',
          view.isValue &&
            'mx-0.5 rounded bg-emerald-900/50 px-1 text-emerald-200',
          token.kind === 'char' && /[+\-*/]/.test(token.value) && 'mx-0.5'
        )}
      >
        {view.text}
      </span>
    )
  })
  items.splice(state.caret, 0, <Caret key="caret" />)

  return (
    <div ref={containerRef} className="flex flex-col gap-3">
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

      <div className="rounded-lg bg-zinc-950 px-3 py-2">
        <div
          data-testid="calculator-expression"
          data-caret={state.caret}
          onClick={() => dispatch((current) => setCaret(current, Infinity))}
          className="min-h-7 cursor-text text-right text-base break-all text-zinc-300"
        >
          {state.tokens.length === 0 && (
            <span className="text-zinc-600">0</span>
          )}
          {items}
        </div>
        <div className="mt-1 flex items-center justify-end gap-2">
          <div
            data-testid="calculator-result"
            className="min-w-0 truncate font-mono text-2xl text-zinc-100"
          >
            {result === null ? '—' : formatResultForDisplay(result)}
          </div>
          <button
            type="button"
            aria-label="Скопировать"
            title="Скопировать"
            data-copied={copyStatus === 'copied'}
            onClick={handleCopy}
            disabled={result === null}
            className={cn(
              'flex h-11 w-11 shrink-0 items-center justify-center rounded-md text-zinc-400 wide:h-9 wide:w-9 hover:bg-zinc-800 hover:text-zinc-100 disabled:opacity-30',
              copyStatus === 'copied' && 'text-emerald-400',
              copyStatus === 'failed' && 'text-red-400'
            )}
          >
            {copyStatus === 'copied' ? (
              <Check className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Copy className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          <span role="status" aria-live="polite" className="sr-only">
            {copyStatus === 'copied'
              ? 'Скопировано'
              : copyStatus === 'failed'
                ? 'Не удалось скопировать'
                : ''}
          </span>
        </div>
      </div>

      {isValuesLoading && (
        <div
          data-testid="calculator-values-loading"
          aria-label="Значения из «Накоплений» загружаются"
          aria-busy="true"
          role="group"
          className="-mx-1 flex gap-1.5 overflow-hidden px-1 pb-1"
        >
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={index}
              aria-hidden="true"
              className="h-7 w-32 shrink-0 rounded-full"
            />
          ))}
        </div>
      )}

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
              onMouseDown={keepFocus}
              onClick={() =>
                dispatch((current) => insertSavings(current, value))
              }
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-full border border-zinc-700 bg-zinc-800/60 px-3 py-1.5 wide:min-h-0 text-xs whitespace-nowrap text-zinc-200 hover:border-emerald-600"
            >
              <span className="max-w-[11rem] truncate">{value.label}</span>
              <span aria-hidden="true" className="text-zinc-500">
                ·
              </span>
              <span className="font-mono text-zinc-100">
                {money(value.kopecks)}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-1.5">
        {KEYS.map((def) => (
          <button
            key={def.id}
            type="button"
            aria-label={def.ariaLabel}
            onMouseDown={keepFocus}
            onClick={() => runCommand(def.command)}
            className={cn(
              'flex h-11 items-center justify-center rounded-lg text-lg font-medium transition-colors',
              KEY_TONES[def.tone ?? 'digit'],
              def.span === 2 && 'col-span-2',
              def.span === 3 && 'col-span-3'
            )}
          >
            {def.label}
          </button>
        ))}
      </div>
    </div>
  )
}

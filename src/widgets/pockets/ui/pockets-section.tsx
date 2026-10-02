'use client'

import { Archive, ArrowDownToLine, ArrowUpFromLine, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { useExpenses } from '@/entities/expense'
import {
  useArchivePocket,
  usePocketMonthBudget,
  usePockets,
  useSetPocketMonthBudget,
} from '@/entities/pocket'
import { useSessionStore } from '@/entities/session'
import {
  CreatePocketForm,
  PocketOperationForm,
  RenamePocketForm,
} from '@/features/manage-pockets'
import { getPocketMonthSummary } from '@/shared/lib'
import { Button, ConfirmDialog, EmptyState, MathInput } from '@/shared/ui'

import { PocketOperationRow } from './pocket-operation-row'
import { PocketMonthSkeleton, PocketsSkeleton } from './pockets-skeleton'

import type { Expense, PocketMonthBudget } from '@/shared/types'

type HistoryKind = 'purchase' | 'transfer'

function getPeriod(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatCurrency(amount: number) {
  return `${amount.toLocaleString('ru-RU')} ₽`
}

function PocketDetail({
  pocket,
  selectedDate,
  expenses,
  monthBudget,
  isBudgetLoading,
  isBudgetError,
}: {
  pocket: { id: string; name: string; archivedAt?: string | null }
  selectedDate: Date
  expenses: Expense[]
  monthBudget: PocketMonthBudget | null | undefined
  isBudgetLoading: boolean
  isBudgetError: boolean
}) {
  const period = getPeriod(selectedDate)
  const setMonthBudget = useSetPocketMonthBudget()
  const archivePocket = useArchivePocket()
  const [budgetDraft, setBudgetDraft] = useState<{
    period: string
    value: string
  } | null>(null)
  const [historyKind, setHistoryKind] = useState<HistoryKind | null>(null)
  const [operationKind, setOperationKind] = useState<HistoryKind | null>(null)
  const [isRenaming, setIsRenaming] = useState(false)
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false)

  useEffect(() => {
    setBudgetDraft(null)
  }, [period])

  const isArchived = Boolean(pocket.archivedAt)
  const isLoading = isBudgetLoading
  const isError = isBudgetError
  const isMonthLoading = isLoading && !monthBudget
  const canUseMonth = Boolean(monthBudget) && !isLoading
  const budgetInput =
    budgetDraft?.period === period
      ? budgetDraft.value
      : monthBudget
        ? String(monthBudget.budget)
        : ''

  const stats = useMemo(
    () =>
      getPocketMonthSummary(
        expenses,
        pocket.id,
        selectedDate,
        monthBudget?.budget ?? 0
      ),
    [expenses, monthBudget?.budget, pocket.id, selectedDate]
  )
  const selectedOperations =
    historyKind === 'purchase'
      ? stats.purchases
      : historyKind === 'transfer'
        ? stats.transfers
        : []

  const saveBudget = (value: string, evaluated: number | null) => {
    setBudgetDraft({ period, value })
    if (evaluated === null || evaluated < 0 || !monthBudget) return
    if (evaluated === monthBudget.budget) return
    setMonthBudget.mutate({ pocketId: pocket.id, period, budget: evaluated })
  }

  const handleArchive = async () => {
    if (!canUseMonth) return
    try {
      await archivePocket.mutateAsync({ id: pocket.id })
      setIsArchiveDialogOpen(false)
    } catch {
      // The mutation state remains available for retry.
    }
  }

  return (
    <section
      aria-label={`Карман ${pocket.name}`}
      aria-busy={isMonthLoading}
      className="space-y-4 rounded-xl border border-zinc-700 bg-zinc-900/50 p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-zinc-100">
              {pocket.name}
            </h3>
            {isArchived && (
              <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-400">
                Архив
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isArchived && (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsRenaming((value) => !value)}
                disabled={!canUseMonth}
              >
                {isRenaming ? 'Отмена' : 'Переименовать'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsArchiveDialogOpen(true)}
                disabled={!canUseMonth}
              >
                <Archive className="mr-1 h-4 w-4" /> Архивировать
              </Button>
            </>
          )}
        </div>
      </div>

      {isRenaming && !isArchived && canUseMonth && (
        <RenamePocketForm
          pocketId={pocket.id}
          initialName={pocket.name}
          onDone={() => setIsRenaming(false)}
        />
      )}

      {isMonthLoading ? (
        <PocketMonthSkeleton />
      ) : (
        <>
          {isError && !monthBudget && (
            <p role="alert" className="text-sm text-red-300">
              Не удалось загрузить бюджет выбранного месяца.
            </p>
          )}
          {isError && monthBudget && (
            <p role="alert" className="text-xs text-amber-300">
              Не удалось обновить бюджет. Показаны сохранённые данные.
            </p>
          )}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <label
                className="mb-1 block text-xs text-zinc-500"
                htmlFor={`pocket-budget-${pocket.id}`}
              >
                Бюджет
              </label>
              {monthBudget ? (
                <MathInput
                  id={`pocket-budget-${pocket.id}`}
                  aria-label={`Бюджет кармана ${pocket.name}`}
                  value={budgetInput}
                  onValueChange={saveBudget}
                  min={0}
                  disabled={setMonthBudget.isPending}
                />
              ) : (
                <p className="min-h-10 py-2 text-sm text-zinc-500">
                  {isArchived ? 'Бюджет не сохранён' : 'Бюджет недоступен'}
                </p>
              )}
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <span className="block text-xs text-zinc-500">Использовано</span>
              <strong
                data-testid={`pocket-used-${pocket.id}`}
                className="mt-1 block font-mono text-lg text-zinc-100"
              >
                {formatCurrency(stats.used)}
              </strong>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3">
              <span className="block text-xs text-zinc-500">Остаток</span>
              <strong
                data-testid={`pocket-remaining-${pocket.id}`}
                className={`mt-1 block font-mono text-lg ${monthBudget ? (stats.remaining < 0 ? 'text-red-400' : 'text-emerald-300') : 'text-zinc-500'}`}
              >
                {monthBudget ? formatCurrency(stats.remaining) : '—'}
              </strong>
            </div>
          </div>

          {setMonthBudget.isError && (
            <p role="alert" className="text-sm text-red-400">
              Не удалось сохранить бюджет.
            </p>
          )}

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button
              type="button"
              className="flex min-h-11 items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-left text-sm transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded={historyKind === 'purchase'}
              onClick={() =>
                setHistoryKind((kind) =>
                  kind === 'purchase' ? null : 'purchase'
                )
              }
            >
              <span className="flex items-center gap-2 text-zinc-300">
                <ArrowDownToLine className="h-4 w-4 text-emerald-400" /> Покупки
              </span>
              <span className="font-mono text-zinc-100">
                {formatCurrency(stats.purchaseTotal)}
              </span>
            </button>
            <button
              type="button"
              className="flex min-h-11 items-center justify-between rounded-lg border border-zinc-700 bg-zinc-950/50 px-3 py-2 text-left text-sm transition hover:border-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              aria-expanded={historyKind === 'transfer'}
              onClick={() =>
                setHistoryKind((kind) =>
                  kind === 'transfer' ? null : 'transfer'
                )
              }
            >
              <span className="flex items-center gap-2 text-zinc-300">
                <ArrowUpFromLine className="h-4 w-4 text-violet-300" /> Переводы
              </span>
              <span className="font-mono text-zinc-100">
                {formatCurrency(stats.transferTotal)}
              </span>
            </button>
          </div>

          {historyKind && (
            <div
              className="space-y-2"
              aria-label={
                historyKind === 'purchase'
                  ? 'История покупок'
                  : 'История переводов'
              }
            >
              <h4 className="text-sm font-medium text-zinc-300">
                {historyKind === 'purchase'
                  ? 'Покупки за месяц'
                  : 'Переводы за месяц'}
              </h4>
              {selectedOperations.length > 0 ? (
                <ul className="space-y-2">
                  {selectedOperations.map((operation) => (
                    <PocketOperationRow
                      key={operation.id}
                      operation={operation}
                    />
                  ))}
                </ul>
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-800 p-4 text-center text-sm text-zinc-500">
                  Операций за этот месяц нет.
                </p>
              )}
            </div>
          )}

          {!isArchived && (
            <div className="space-y-3 border-t border-zinc-800 pt-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="button"
                  variant={operationKind === 'purchase' ? 'primary' : 'ghost'}
                  disabled={!canUseMonth}
                  onClick={() =>
                    setOperationKind((kind) =>
                      kind === 'purchase' ? null : 'purchase'
                    )
                  }
                >
                  Добавить покупку
                </Button>
                <Button
                  type="button"
                  variant={operationKind === 'transfer' ? 'primary' : 'ghost'}
                  disabled={!canUseMonth}
                  onClick={() =>
                    setOperationKind((kind) =>
                      kind === 'transfer' ? null : 'transfer'
                    )
                  }
                >
                  Перевести в расходы
                </Button>
              </div>
              {operationKind && canUseMonth && (
                <PocketOperationForm
                  key={`${pocket.id}-${operationKind}-${period}`}
                  pocketId={pocket.id}
                  kind={operationKind}
                  selectedDate={selectedDate}
                  onDone={() => setOperationKind(null)}
                />
              )}
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={isArchiveDialogOpen}
        title={`Архивировать карман «${pocket.name}»?`}
        description="История останется доступной, новые операции и месячные бюджеты создавать нельзя."
        confirmLabel="Архивировать"
        isConfirming={archivePocket.isPending}
        onConfirm={handleArchive}
        onClose={() => setIsArchiveDialogOpen(false)}
      />
      {archivePocket.isError && (
        <p role="alert" className="text-sm text-red-400">
          Не удалось архивировать карман.
        </p>
      )}
    </section>
  )
}

export function PocketsSection() {
  const selectedDate = useSessionStore((state) => state.selectedDate)
  const { data: pocketsData, isLoading, isError } = usePockets()
  const {
    data: expensesData,
    isLoading: areExpensesLoading,
    isError: areExpensesError,
  } = useExpenses()
  const pockets = pocketsData ?? []
  const expenses = expensesData ?? []
  const [selectedPocketId, setSelectedPocketId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  const selectedPocket =
    pockets.find((pocket) => pocket.id === selectedPocketId) ?? pockets[0]
  const selectedPeriod = getPeriod(selectedDate)
  const selectedMonthBudget = usePocketMonthBudget(
    selectedPocket?.id ?? '',
    selectedPeriod
  )

  if (isLoading || areExpensesLoading) return <PocketsSkeleton />

  if ((isError && !pocketsData) || (areExpensesError && !expensesData)) {
    return (
      <p
        role="alert"
        className="rounded-lg border border-red-900/60 p-4 text-sm text-red-300"
      >
        Не удалось загрузить карманы.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
          Карманы
        </h2>
        <Button
          type="button"
          variant="ghost"
          onClick={() => setIsCreating((value) => !value)}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-1 h-4 w-4" />{' '}
          {isCreating ? 'Отмена' : 'Создать карман'}
        </Button>
      </div>

      {((isError && pocketsData) || (areExpensesError && expensesData)) && (
        <p role="alert" className="text-xs text-amber-300">
          Не удалось обновить данные. Показаны сохранённые значения.
        </p>
      )}

      {isCreating && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-3 sm:p-4">
          <CreatePocketForm onCreated={() => setIsCreating(false)} />
        </div>
      )}

      {pockets.length === 0 ? (
        <EmptyState
          icon={Archive}
          title="Нет карманов"
          description="Создайте карман, чтобы задать ему месячный бюджет и вести историю покупок."
        />
      ) : (
        <>
          <div
            className="flex gap-2 overflow-x-auto pb-1"
            aria-label="Список карманов"
          >
            {pockets.map((pocket) => (
              <button
                key={pocket.id}
                type="button"
                aria-pressed={selectedPocket?.id === pocket.id}
                onClick={() => setSelectedPocketId(pocket.id)}
                className={`min-h-11 shrink-0 rounded-lg border px-3 py-2 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${selectedPocket?.id === pocket.id ? 'border-blue-500 bg-blue-500/10 text-blue-200' : 'border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-zinc-200'}`}
              >
                {pocket.name}
                {pocket.archivedAt ? ' · архив' : ''}
              </button>
            ))}
          </div>
          {selectedPocket && (
            <PocketDetail
              key={`${selectedPocket.id}-${getPeriod(selectedDate)}`}
              pocket={selectedPocket}
              selectedDate={selectedDate}
              expenses={expenses}
              monthBudget={selectedMonthBudget.data}
              isBudgetLoading={selectedMonthBudget.isLoading}
              isBudgetError={selectedMonthBudget.isError}
            />
          )}
        </>
      )}
    </div>
  )
}

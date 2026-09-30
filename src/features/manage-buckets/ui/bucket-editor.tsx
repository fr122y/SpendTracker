'use client'

import { Trash2 } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

import { useBucketStore } from '@/entities/bucket'
import { useSettingsStore } from '@/entities/settings'
import { cn } from '@/shared/lib'
import { Button, ConfirmDialog, Input, MathInput } from '@/shared/ui'

import { BucketEditorSkeleton } from './bucket-editor-skeleton'
import {
  amountToPercentage,
  assertAllocationRepresentable,
  calculateAllocation,
  formatEditableKopecks,
  formatKopecks,
  formatPercentage,
  getBucketAmountKopecks,
  rublesToKopecks,
} from '../lib/allocation'

import type { AllocationBucket } from '@/shared/types'

type AllocationField = 'percentage' | 'amount'

function areBucketsEqual(
  left: AllocationBucket[],
  right: AllocationBucket[]
): boolean {
  if (left === right) {
    return true
  }

  if (left.length !== right.length) {
    return false
  }

  return left.every((bucket, index) => {
    const other = right[index]

    return (
      bucket.id === other.id &&
      bucket.label === other.label &&
      bucket.percentage === other.percentage
    )
  })
}

function fieldKey(id: string, field: AllocationField): string {
  return `${id}:${field}`
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'Не удалось рассчитать распределение'
}

export function BucketEditor() {
  const {
    buckets,
    isLoading: isBucketsLoading,
    updateBuckets,
  } = useBucketStore((state) => ({
    buckets: state.buckets,
    isLoading: state.isLoading,
    updateBuckets: state.updateBuckets,
  }))
  const {
    salary,
    isLoading: isSettingsLoading,
    setSalary,
  } = useSettingsStore((state) => ({
    salary: state.salary,
    isLoading: state.isLoading,
    setSalary: state.setSalary,
  }))

  const [localBuckets, setLocalBuckets] = useState<AllocationBucket[]>(buckets)
  const localBucketsRef = useRef(localBuckets)
  const [localSalary, setLocalSalary] = useState(salary)
  const [error, setError] = useState('')
  const [inputValues, setInputValues] = useState<Record<string, string>>({})
  const dirtyInputsRef = useRef(new Set<string>())
  const [bucketPendingDelete, setBucketPendingDelete] =
    useState<AllocationBucket | null>(null)
  const [salaryInputValue, setSalaryInputValue] = useState(
    salary ? String(salary) : ''
  )

  useEffect(() => {
    let didBucketsChange = false

    setLocalBuckets((currentBuckets) => {
      if (areBucketsEqual(currentBuckets, buckets)) {
        return currentBuckets
      }

      didBucketsChange = true
      localBucketsRef.current = buckets
      return buckets
    })

    if (didBucketsChange) {
      dirtyInputsRef.current.clear()
      setInputValues({})
    }
  }, [buckets])

  useEffect(() => {
    setLocalSalary(salary)
    setSalaryInputValue(salary ? String(salary) : '')
  }, [salary])

  if (isBucketsLoading || isSettingsLoading) {
    return <BucketEditorSkeleton />
  }

  let incomeKopecks = 0
  let calculationError = ''

  try {
    incomeKopecks = rublesToKopecks(localSalary)
  } catch (caughtError) {
    calculationError = getErrorMessage(caughtError)
  }

  let allocation = { totalKopecks: 0, operationsKopecks: 0 }
  if (!calculationError) {
    try {
      allocation = calculateAllocation(localBuckets, incomeKopecks)
    } catch (caughtError) {
      calculationError = getErrorMessage(caughtError)
    }
  }

  const saveBuckets = (nextBuckets: AllocationBucket[]) => {
    localBucketsRef.current = nextBuckets
    setLocalBuckets(nextBuckets)
    updateBuckets(nextBuckets)
  }

  const handleBucketFieldChange = (
    id: string,
    field: AllocationField,
    value: string,
    evaluated: number | null
  ) => {
    const key = fieldKey(id, field)

    if (evaluated === null) {
      dirtyInputsRef.current.add(key)
      setInputValues((previous) => ({ ...previous, [key]: value }))
      return
    }

    // MathInput also emits a value on blur without an edit and emits twice for
    // Enter followed by blur. Only the first commit after actual typing counts.
    if (!dirtyInputsRef.current.has(key)) return
    dirtyInputsRef.current.delete(key)

    if (!Number.isFinite(evaluated) || evaluated < 0) {
      setError('Введите конечное неотрицательное значение')
      return
    }

    try {
      const nextBuckets = localBucketsRef.current.map((bucket) => {
        if (bucket.id !== id) return bucket

        if (field === 'percentage') {
          return {
            ...bucket,
            percentage: evaluated,
          }
        }

        if (incomeKopecks === 0) {
          throw new RangeError(
            'Укажите месячный доход, чтобы задать категорию суммой'
          )
        }

        const amountKopecks = rublesToKopecks(evaluated)
        const percentage = amountToPercentage(amountKopecks, incomeKopecks)
        if (percentage === null) {
          throw new RangeError(
            'Укажите месячный доход, чтобы задать категорию суммой'
          )
        }

        return {
          ...bucket,
          percentage,
        }
      })

      assertAllocationRepresentable(nextBuckets, incomeKopecks)

      setInputValues((previous) => {
        const next = { ...previous }
        delete next[key]
        return next
      })
      setError('')
      saveBuckets(nextBuckets)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
      setInputValues((previous) => ({ ...previous, [key]: value }))
    }
  }

  const handleLabelChange = (id: string, value: string) => {
    const nextBuckets = localBucketsRef.current.map((bucket) =>
      bucket.id === id ? { ...bucket, label: value } : bucket
    )
    localBucketsRef.current = nextBuckets
    setLocalBuckets(nextBuckets)
  }

  const handleLabelBlur = () => {
    updateBuckets(localBucketsRef.current)
  }

  const handleAddBucket = () => {
    const newBucket: AllocationBucket = {
      id: crypto.randomUUID(),
      label: '',
      percentage: 0,
    }
    saveBuckets([...localBucketsRef.current, newBucket])
  }

  const handleDeleteBucket = (id: string) => {
    saveBuckets(localBucketsRef.current.filter((bucket) => bucket.id !== id))
    setError('')
    setBucketPendingDelete(null)
  }

  const handleSalaryChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      try {
        const nextIncomeKopecks = rublesToKopecks(evaluated)
        assertAllocationRepresentable(
          localBucketsRef.current,
          nextIncomeKopecks
        )
        setLocalSalary(evaluated)
        setSalary(evaluated)
        setSalaryInputValue(String(evaluated))
        setError('')
      } catch (caughtError) {
        setError(getErrorMessage(caughtError))
      }
    } else {
      setSalaryInputValue(value)
    }
  }

  const totalPercentage = localBuckets.reduce(
    (total, bucket) => total + bucket.percentage,
    0
  )
  const operationsPercentage = 100 - totalPercentage

  const overageKopecks = Math.max(0, -allocation.operationsKopecks)

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col gap-2">
        <label
          htmlFor="salary-input"
          className="text-xs text-zinc-400 sm:text-sm"
        >
          Месячный доход
        </label>
        <div className="flex items-center gap-2">
          <MathInput
            id="salary-input"
            value={salaryInputValue}
            onValueChange={handleSalaryChange}
            placeholder="Введите сумму"
            min={0}
          />
          <span className="text-zinc-400">₽</span>
        </div>
      </div>

      <p className="text-xs text-zinc-500">
        Процент сохраняется. Ввод суммы пересчитывает процент для текущего
        дохода.
      </p>

      <ul className="flex flex-col gap-2">
        {localBuckets.map((bucket) => {
          const amountKopecks = getBucketAmountKopecks(bucket, incomeKopecks)
          const percentageKey = fieldKey(bucket.id, 'percentage')
          const amountKey = fieldKey(bucket.id, 'amount')

          return (
            <li
              key={bucket.id}
              className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2"
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  value={bucket.label}
                  onChange={(event) =>
                    handleLabelChange(bucket.id, event.target.value)
                  }
                  onBlur={handleLabelBlur}
                  placeholder="Название"
                  aria-label="Название категории"
                />
                <Button
                  variant="danger"
                  onClick={() => setBucketPendingDelete(bucket)}
                  aria-label={
                    bucket.label
                      ? `Удалить категорию ${bucket.label}`
                      : 'Удалить категорию'
                  }
                  className="shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="hidden lg:inline">Удалить</span>
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="min-w-0">
                  <label
                    htmlFor={`${percentageKey}-input`}
                    className="mb-1 block text-xs text-zinc-400"
                  >
                    Процент
                  </label>
                  <div className="flex items-center gap-1">
                    <MathInput
                      id={`${percentageKey}-input`}
                      aria-label={`Процент категории ${bucket.label || 'без названия'}`}
                      value={
                        inputValues[percentageKey] ??
                        formatPercentage(bucket.percentage)
                      }
                      onValueChange={(value, evaluated) =>
                        handleBucketFieldChange(
                          bucket.id,
                          'percentage',
                          value,
                          evaluated
                        )
                      }
                      placeholder="—"
                      className="min-w-0"
                    />
                    <span className="shrink-0 text-zinc-400">%</span>
                  </div>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor={`${amountKey}-input`}
                    className="mb-1 block text-xs text-zinc-400"
                  >
                    Сумма
                  </label>
                  <div className="flex items-center gap-1">
                    <MathInput
                      id={`${amountKey}-input`}
                      aria-label={`Сумма категории ${bucket.label || 'без названия'}`}
                      disabled={incomeKopecks === 0}
                      value={
                        inputValues[amountKey] ??
                        formatEditableKopecks(amountKopecks)
                      }
                      onValueChange={(value, evaluated) =>
                        handleBucketFieldChange(
                          bucket.id,
                          'amount',
                          value,
                          evaluated
                        )
                      }
                      placeholder="0"
                      className="min-w-0"
                    />
                    <span className="shrink-0 text-zinc-400">₽</span>
                  </div>
                </div>
              </div>
              {incomeKopecks === 0 && (
                <p className="text-xs text-zinc-500">
                  Укажите месячный доход, чтобы распределять суммой.
                </p>
              )}
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        isOpen={Boolean(bucketPendingDelete)}
        title="Удалить категорию бюджета?"
        description={
          bucketPendingDelete?.label
            ? `Категория «${bucketPendingDelete.label}» будет удалена из распределения бюджета.`
            : 'Категория будет удалена из распределения бюджета.'
        }
        confirmLabel="Удалить"
        onConfirm={() => {
          if (bucketPendingDelete) {
            handleDeleteBucket(bucketPendingDelete.id)
          }
        }}
        onClose={() => setBucketPendingDelete(null)}
      />

      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      {calculationError && (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {calculationError}
        </p>
      )}

      {overageKopecks > 0 && (
        <p className="text-sm text-red-400" role="alert" aria-live="polite">
          Распределено больше дохода на {formatKopecks(overageKopecks)} ₽
        </p>
      )}

      <div className="flex flex-col gap-3 rounded-lg border border-zinc-700 bg-zinc-900 p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:p-4">
        <div className="flex flex-col">
          <span className="text-xs text-zinc-400 sm:text-sm">Распределено</span>
          <span className="text-base font-medium text-zinc-200 sm:text-lg">
            {`${formatPercentage(totalPercentage)}%`}
            <span className="ml-2 text-xs text-zinc-400 sm:text-sm">
              ({formatKopecks(allocation.totalKopecks)} ₽)
            </span>
          </span>
        </div>
        <div className="flex flex-col sm:text-right">
          <span className="text-xs text-zinc-400 sm:text-sm">
            Операции (остаток)
          </span>
          <span
            className={cn(
              'text-base font-medium sm:text-lg',
              allocation.operationsKopecks < 0
                ? 'text-red-500'
                : 'text-emerald-500'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {`${formatPercentage(operationsPercentage)}%`}
            <span className="ml-2 text-xs text-zinc-400 sm:text-sm">
              ({formatKopecks(allocation.operationsKopecks)} ₽)
            </span>
          </span>
        </div>
      </div>

      <Button variant="ghost" onClick={handleAddBucket}>
        Добавить категорию
      </Button>
    </div>
  )
}

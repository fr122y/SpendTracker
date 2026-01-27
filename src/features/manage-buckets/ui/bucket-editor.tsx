'use client'

import { useState, useEffect } from 'react'

import { useBucketStore } from '@/entities/bucket'
import { useSettingsStore } from '@/entities/settings'
import { cn } from '@/shared/lib'
import { Button, Input, MathInput } from '@/shared/ui'

import type { AllocationBucket } from '@/shared/types'

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount))
}

export function BucketEditor() {
  const buckets = useBucketStore((state) => state.buckets)
  const updateBuckets = useBucketStore((state) => state.updateBuckets)
  const salary = useSettingsStore((state) => state.salary)
  const setSalary = useSettingsStore((state) => state.setSalary)

  const [localBuckets, setLocalBuckets] = useState<AllocationBucket[]>(buckets)
  const [localSalary, setLocalSalary] = useState(salary)
  const [error, setError] = useState('')

  useEffect(() => {
    setLocalBuckets(buckets)
  }, [buckets])

  useEffect(() => {
    setLocalSalary(salary)
  }, [salary])

  const totalPercentage = localBuckets.reduce(
    (sum, bucket) => sum + bucket.percentage,
    0
  )
  const operationsPercentage = 100 - totalPercentage

  const handlePercentageChange = (
    id: string,
    value: string,
    evaluated: number | null
  ) => {
    const newPercentage =
      evaluated !== null ? evaluated : Math.max(0, Number(value) || 0)
    const newBuckets = localBuckets.map((bucket) =>
      bucket.id === id ? { ...bucket, percentage: newPercentage } : bucket
    )
    setLocalBuckets(newBuckets)
    setError('')

    // If evaluated, also validate and save
    if (evaluated !== null) {
      const newTotal = newBuckets.reduce(
        (sum, bucket) => sum + bucket.percentage,
        0
      )
      if (newTotal > 100) {
        setError('Общая сумма превышает 100%')
        return
      }
      updateBuckets(newBuckets)
    }
  }

  const handlePercentageBlur = () => {
    const newTotal = localBuckets.reduce(
      (sum, bucket) => sum + bucket.percentage,
      0
    )

    if (newTotal > 100) {
      setError('Общая сумма превышает 100%')
      return
    }

    updateBuckets(localBuckets)
  }

  const handleLabelChange = (id: string, value: string) => {
    const newBuckets = localBuckets.map((bucket) =>
      bucket.id === id ? { ...bucket, label: value } : bucket
    )
    setLocalBuckets(newBuckets)
  }

  const handleLabelBlur = () => {
    updateBuckets(localBuckets)
  }

  const handleAddBucket = () => {
    const newBucket: AllocationBucket = {
      id: crypto.randomUUID(),
      label: '',
      percentage: 0,
    }
    const newBuckets = [...localBuckets, newBucket]
    setLocalBuckets(newBuckets)
    updateBuckets(newBuckets)
  }

  const handleDeleteBucket = (id: string) => {
    const newBuckets = localBuckets.filter((bucket) => bucket.id !== id)
    setLocalBuckets(newBuckets)
    updateBuckets(newBuckets)
    setError('')
  }

  const handleSalaryChange = (value: string, evaluated: number | null) => {
    if (evaluated !== null) {
      setLocalSalary(evaluated)
      setSalary(evaluated)
    } else {
      const newSalary = Math.max(0, Number(value) || 0)
      setLocalSalary(newSalary)
    }
  }

  const calculateAmount = (percentage: number) => {
    return (localSalary * percentage) / 100
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <label htmlFor="salary-input" className="text-sm text-zinc-400">
          Месячный доход
        </label>
        <div className="flex items-center gap-2">
          <MathInput
            id="salary-input"
            value={localSalary ? String(localSalary) : ''}
            onValueChange={handleSalaryChange}
            placeholder="Введите сумму (напр. 100000+20000)"
            min={0}
          />
          <span className="text-zinc-400">₽</span>
        </div>
      </div>

      {/* Using rounded-lg consistently for card-like elements */}
      <ul className="flex flex-col gap-3">
        {localBuckets.map((bucket) => (
          <li
            key={bucket.id}
            className="flex items-center gap-4 p-3 bg-zinc-800/50 rounded-lg"
          >
            <div className="flex-1">
              <Input
                value={bucket.label}
                onChange={(e) => handleLabelChange(bucket.id, e.target.value)}
                onBlur={handleLabelBlur}
                placeholder="Название"
              />
            </div>
            <div className="w-24 flex items-center gap-2">
              <MathInput
                value={String(bucket.percentage)}
                onValueChange={(value, evaluated) =>
                  handlePercentageChange(bucket.id, value, evaluated)
                }
                onBlur={handlePercentageBlur}
                min={0}
                max={100}
              />
              <span className="text-zinc-400">%</span>
            </div>
            {localSalary > 0 && (
              <span className="w-28 text-right text-zinc-300">
                {formatAmount(calculateAmount(bucket.percentage))} ₽
              </span>
            )}
            {/* ⚡ Auto-fix: Enhanced aria-label with fallback for empty labels (Principle: Accessibility) */}
            <Button
              variant="danger"
              onClick={() => handleDeleteBucket(bucket.id)}
              aria-label={
                bucket.label
                  ? `Удалить категорию ${bucket.label}`
                  : 'Удалить категорию'
              }
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>

      {/* ⚡ Auto-fix: Added aria-live for screen reader announcement (Principle: Accessibility) */}
      {/* ⚡ Auto-fix: Added role="alert" for critical error messaging */}
      {error && (
        <p className="text-sm text-red-500" role="alert" aria-live="polite">
          {error}
        </p>
      )}

      <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-700">
        <div className="flex flex-col">
          <span className="text-sm text-zinc-400">Распределено</span>
          <span className="text-lg font-medium text-zinc-200">
            {totalPercentage}%
            {localSalary > 0 && (
              <span className="ml-2 text-sm text-zinc-400">
                ({formatAmount(calculateAmount(totalPercentage))} ₽)
              </span>
            )}
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-sm text-zinc-400">Операции (остаток)</span>
          {/* ⚡ Auto-fix: Replaced template string with cn() utility (Principle: Engineering Standards) */}
          {/* ⚡ Auto-fix: Added aria-live for dynamic percentage updates (Principle: Accessibility) */}
          <span
            className={cn(
              'text-lg font-medium',
              operationsPercentage < 0 ? 'text-red-500' : 'text-emerald-500'
            )}
            aria-live="polite"
            aria-atomic="true"
          >
            {operationsPercentage}%
            {localSalary > 0 && (
              <span className="ml-2 text-sm text-zinc-400">
                ({formatAmount(calculateAmount(operationsPercentage))} ₽)
              </span>
            )}
          </span>
        </div>
      </div>

      <Button variant="ghost" onClick={handleAddBucket}>
        Добавить категорию
      </Button>
    </div>
  )
}

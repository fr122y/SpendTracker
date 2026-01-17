'use client'

import { useState, useEffect } from 'react'

import { useBucketStore } from '@/entities/bucket'
import { Button, Input } from '@/shared/ui'

import type { AllocationBucket } from '@/shared/types'

export function BucketEditor() {
  const buckets = useBucketStore((state) => state.buckets)
  const updateBuckets = useBucketStore((state) => state.updateBuckets)

  const [localBuckets, setLocalBuckets] = useState<AllocationBucket[]>(buckets)
  const [error, setError] = useState('')

  useEffect(() => {
    setLocalBuckets(buckets)
  }, [buckets])

  const totalPercentage = localBuckets.reduce(
    (sum, bucket) => sum + bucket.percentage,
    0
  )
  const operationsPercentage = 100 - totalPercentage

  const handlePercentageChange = (id: string, value: string) => {
    const newPercentage = Math.max(0, Number(value) || 0)
    const newBuckets = localBuckets.map((bucket) =>
      bucket.id === id ? { ...bucket, percentage: newPercentage } : bucket
    )
    setLocalBuckets(newBuckets)
    setError('')
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

  return (
    <div className="flex flex-col gap-6">
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
              <Input
                type="number"
                value={bucket.percentage}
                onChange={(e) =>
                  handlePercentageChange(bucket.id, e.target.value)
                }
                onBlur={handlePercentageBlur}
                min={0}
                max={100}
              />
              <span className="text-zinc-400">%</span>
            </div>
            <Button
              variant="danger"
              onClick={() => handleDeleteBucket(bucket.id)}
              aria-label={`Удалить ${bucket.label}`}
            >
              Удалить
            </Button>
          </li>
        ))}
      </ul>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-between p-4 bg-zinc-900 rounded-lg border border-zinc-700">
        <div className="flex flex-col">
          <span className="text-sm text-zinc-400">Распределено</span>
          <span className="text-lg font-medium text-zinc-200">
            {totalPercentage}%
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-sm text-zinc-400">Операции (остаток)</span>
          <span
            className={`text-lg font-medium ${
              operationsPercentage < 0 ? 'text-red-500' : 'text-emerald-500'
            }`}
          >
            {operationsPercentage}%
          </span>
        </div>
      </div>

      <Button variant="ghost" onClick={handleAddBucket}>
        Добавить категорию
      </Button>
    </div>
  )
}

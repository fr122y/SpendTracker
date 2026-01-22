'use client'

import { BucketEditor } from '@/features/manage-buckets'

export function SavingsSection() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-lg font-medium text-zinc-100">
        Распределение дохода
      </h2>
      <BucketEditor />
    </div>
  )
}

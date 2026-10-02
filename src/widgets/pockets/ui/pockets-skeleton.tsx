import { SkeletonRect, SkeletonText } from '@/shared/ui'

function PocketMonthSummarySkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3"
        >
          <SkeletonText widthClassName="w-16" className="h-3" />
          <SkeletonRect className="mt-2 h-7 w-28" />
        </div>
      ))}
    </div>
  )
}

export function PocketMonthSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем бюджет месяца"
      aria-busy="true"
      data-testid="pocket-month-skeleton"
      className="space-y-4"
    >
      <PocketMonthSummarySkeleton />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" aria-hidden="true">
        <SkeletonRect className="h-11" />
        <SkeletonRect className="h-11" />
      </div>
    </div>
  )
}

export function PocketsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Загружаем карманы"
      aria-busy="true"
      data-testid="pockets-skeleton"
      className="flex flex-col gap-3 sm:gap-4"
    >
      <div className="flex items-center justify-between" aria-hidden="true">
        <SkeletonText widthClassName="w-24" className="h-6" />
        <SkeletonRect className="h-11 w-full sm:w-40" />
      </div>
      <div className="flex gap-2" aria-hidden="true">
        <SkeletonRect className="h-11 w-28 shrink-0" />
        <SkeletonRect className="h-11 w-32 shrink-0" />
      </div>
      <div
        className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 sm:p-4"
        aria-hidden="true"
      >
        <SkeletonText widthClassName="w-32" className="h-5" />
        <PocketMonthSummarySkeleton />
        <div className="flex flex-col gap-2 sm:flex-row">
          <SkeletonRect className="h-11 w-full sm:w-36" />
          <SkeletonRect className="h-11 w-full sm:w-40" />
        </div>
      </div>
    </div>
  )
}

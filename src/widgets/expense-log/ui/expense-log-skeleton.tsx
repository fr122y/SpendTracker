import { SkeletonCircle, SkeletonRect, SkeletonText } from '@/shared/ui'

export function ExpenseLogSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="expense-log-skeleton"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText widthClassName="w-56" className="h-6" />
        <SkeletonText widthClassName="w-24" className="h-6" />
      </div>

      <div className="space-y-2">
        <SkeletonRect className="h-11 w-full" />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SkeletonRect className="h-11 w-full" />
          <SkeletonRect className="h-11 w-full" />
          <SkeletonRect className="h-11 w-full" />
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-zinc-800/30 p-3"
          >
            <div className="flex items-center gap-3">
              <SkeletonCircle className="h-8 w-8" />
              <div className="space-y-2">
                <SkeletonText widthClassName="w-28" />
                <SkeletonText widthClassName="w-16" className="h-3" />
              </div>
            </div>
            <SkeletonText widthClassName="w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}

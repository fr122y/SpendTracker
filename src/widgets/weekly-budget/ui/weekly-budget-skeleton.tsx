import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function WeeklyBudgetSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="weekly-budget-skeleton"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText widthClassName="w-40" className="h-6" />
        <SkeletonText widthClassName="w-28" className="h-4" />
      </div>

      <div className="space-y-2">
        <SkeletonRect className="h-2.5 w-full rounded-full" />
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
          <SkeletonText widthClassName="w-32" />
          <SkeletonText widthClassName="w-32" />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <SkeletonText widthClassName="w-14" />
        <SkeletonRect className="h-10 w-24 sm:w-32" />
        <SkeletonText widthClassName="w-4" />
      </div>
    </div>
  )
}

import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function DailySpendingChartSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="daily-spending-chart-skeleton"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText widthClassName="w-52" className="h-6" />
        <SkeletonText widthClassName="w-24" className="h-6" />
      </div>
      <SkeletonRect className="h-48 w-full sm:h-64" />
    </div>
  )
}

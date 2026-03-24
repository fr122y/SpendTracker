import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function AnalysisSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="analysis-skeleton"
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText widthClassName="w-48" className="h-6" />
        <SkeletonText widthClassName="w-20" className="h-6" />
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonRect key={i} className="h-20 w-20 sm:h-24 sm:w-24" />
        ))}
      </div>
    </div>
  )
}

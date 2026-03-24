import { SkeletonCircle, SkeletonRect, SkeletonText } from '@/shared/ui'

export function CategoryManagerSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 sm:gap-6"
      data-testid="category-manager-skeleton"
    >
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-lg bg-zinc-800/50 p-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:p-3"
          >
            <div className="flex items-center gap-3">
              <SkeletonCircle className="h-6 w-6" />
              <SkeletonText widthClassName="w-28" />
            </div>
            <SkeletonRect className="h-9 w-full sm:w-24" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <SkeletonRect className="h-10 w-full" />
          <SkeletonRect className="h-10 w-full sm:w-24" />
        </div>
        <SkeletonRect className="h-10 w-full sm:w-48" />
      </div>
    </div>
  )
}

import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function CalendarSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="calendar-skeleton"
    >
      <div className="flex items-center justify-between">
        <SkeletonRect className="h-10 w-10 rounded" />
        <SkeletonText widthClassName="w-36" className="h-6" />
        <SkeletonRect className="h-10 w-10 rounded" />
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: 7 }).map((_, i) => (
          <SkeletonText key={i} widthClassName="w-full" className="h-3" />
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {Array.from({ length: 42 }).map((_, i) => (
          <SkeletonRect key={i} className="h-12 sm:h-14" />
        ))}
      </div>

      <SkeletonRect className="h-12 w-full" />
    </div>
  )
}

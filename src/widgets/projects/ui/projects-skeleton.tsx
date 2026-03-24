import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function ProjectsSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="projects-skeleton"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SkeletonText widthClassName="w-24" className="h-6" />
        <SkeletonRect className="h-10 w-full sm:w-36" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-zinc-800 p-3">
            <SkeletonText widthClassName="w-28" className="h-5" />
            <SkeletonText widthClassName="w-20" className="mt-2" />
            <SkeletonRect className="mt-4 h-2.5 w-full rounded-full" />
            <SkeletonText widthClassName="w-24" className="mt-3" />
          </div>
        ))}
      </div>
    </div>
  )
}

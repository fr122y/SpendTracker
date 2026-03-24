import { SkeletonCircle, SkeletonRect, SkeletonText } from '@/shared/ui'

export function BucketEditorSkeleton() {
  return (
    <div
      className="flex flex-col gap-4 sm:gap-6"
      data-testid="bucket-editor-skeleton"
    >
      <div className="flex flex-col gap-2">
        <SkeletonText widthClassName="w-28" className="h-4" />
        <div className="flex items-center gap-2">
          <SkeletonRect className="h-10 w-full" />
          <SkeletonText widthClassName="w-4" />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-zinc-800/50 p-2">
            <SkeletonRect className="h-10 w-full" />
            <div className="mt-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <SkeletonRect className="h-9 w-20" />
                <SkeletonText widthClassName="w-3" />
              </div>
              <div className="flex items-center gap-2">
                <SkeletonText widthClassName="w-16" />
                <SkeletonCircle className="h-9 w-9" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <SkeletonRect className="h-20 w-full" />
      <SkeletonRect className="h-10 w-full" />
    </div>
  )
}

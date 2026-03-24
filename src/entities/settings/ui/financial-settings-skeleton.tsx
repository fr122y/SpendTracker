import { SkeletonRect, SkeletonText } from '@/shared/ui'

export function FinancialSettingsSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 sm:gap-4"
      data-testid="financial-settings-skeleton"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText widthClassName="w-36" className="h-4" />
          <SkeletonRect className="h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

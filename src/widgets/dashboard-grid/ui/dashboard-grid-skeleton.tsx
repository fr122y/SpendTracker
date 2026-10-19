'use client'

import { DEFAULT_LAYOUT } from '@/features/layout-editor'
import { cn } from '@/shared/lib'
import { Skeleton, SkeletonRect, SkeletonText } from '@/shared/ui'

function PanelSkeleton() {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/30 shadow-lg">
      <div className="flex items-center gap-2 border-b border-zinc-800/50 p-3">
        <Skeleton className="h-4 w-4 rounded" />
        <SkeletonText widthClassName="w-28" />
      </div>
      <div className="space-y-3 p-4">
        <SkeletonRect className="h-8 w-full" />
        <SkeletonRect className="h-20 w-full" />
        <SkeletonText widthClassName="w-2/3" />
      </div>
    </div>
  )
}

/**
 * Layout placeholder that picks its shape with CSS media queries, not with
 * `useViewport`, so it is correct on the first server-rendered paint at any
 * width. Breakpoints match `useViewport`: `md` = 768px, `xl` = 1280px.
 */
export function DashboardGridSkeleton() {
  const widgets = DEFAULT_LAYOUT.columns.flatMap((column) => column.widgets)
  const col1 = widgets.filter((_, i) => i % 2 === 0)
  const col2 = widgets.filter((_, i) => i % 2 === 1)

  return (
    <div className="h-full" data-testid="dashboard-grid-skeleton">
      <div
        className="flex flex-col gap-3 bg-zinc-950 p-4 md:hidden"
        data-skeleton-layout="mobile"
      >
        {widgets.map((widgetId) => (
          <PanelSkeleton key={widgetId} />
        ))}
      </div>

      <div
        className="hidden h-full grid-cols-2 gap-4 overflow-y-auto p-4 md:grid xl:hidden"
        data-skeleton-layout="tablet"
      >
        <div className="flex flex-col gap-4">
          {col1.map((widgetId) => (
            <PanelSkeleton key={widgetId} />
          ))}
        </div>
        <div className="flex flex-col gap-4">
          {col2.map((widgetId) => (
            <PanelSkeleton key={widgetId} />
          ))}
        </div>
      </div>

      <div
        className="hidden h-full overflow-hidden p-4 xl:flex"
        data-skeleton-layout="desktop"
      >
        {DEFAULT_LAYOUT.columns.map((column) => (
          <div
            key={column.id}
            className={cn('flex h-full overflow-hidden', 'pr-3 last:pr-0')}
            style={{ width: `${column.width}%` }}
          >
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
              {column.widgets.map((widgetId) => (
                <PanelSkeleton key={widgetId} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

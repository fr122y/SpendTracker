'use client'

import { ChevronRight } from 'lucide-react'

import { WIDGET_REGISTRY } from '@/features/widget-registry'
import { cn } from '@/shared/lib'

import type { WidgetId } from '@/shared/types'

interface MobileWidgetListProps {
  widgets: WidgetId[]
  onSelect: (widgetId: WidgetId) => void
}

export function MobileWidgetList({ widgets, onSelect }: MobileWidgetListProps) {
  return (
    <nav
      className="flex flex-col divide-y divide-zinc-800"
      aria-label="Виджеты"
    >
      {widgets.map((widgetId) => {
        const widget = WIDGET_REGISTRY[widgetId]
        if (!widget) return null

        const Icon = widget.icon

        return (
          <button
            key={widgetId}
            type="button"
            onClick={() => onSelect(widgetId)}
            className={cn(
              'flex items-center gap-3 px-4 py-3',
              'min-h-12 w-full text-left',
              'bg-zinc-900/50 transition-colors',
              'hover:bg-zinc-800/50 active:bg-zinc-700/50 active:scale-95',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500'
            )}
          >
            <Icon className="h-5 w-5 shrink-0 text-emerald-400" />
            <span className="flex-1 font-mono text-sm text-zinc-100">
              {widget.title}
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" />
          </button>
        )
      })}
    </nav>
  )
}

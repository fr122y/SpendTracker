'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

import { WIDGET_REGISTRY } from '@/features/widget-registry'
import { cn } from '@/shared/lib'

import type { WidgetId } from '@/shared/types'

interface MobileWidgetAccordionProps {
  widgets: WidgetId[]
  expandedWidgets: Set<WidgetId>
  onToggle: (widgetId: WidgetId, shouldExpand: boolean) => void
}

export function MobileWidgetAccordion({
  widgets,
  expandedWidgets,
  onToggle,
}: MobileWidgetAccordionProps) {
  // A widget mounts on its first expansion and stays mounted after collapsing,
  // so collapsed widgets never fetch data and an opened one keeps its state.
  const [openedWidgets, setOpenedWidgets] = useState<ReadonlySet<WidgetId>>(
    () => new Set(expandedWidgets)
  )
  const hasNewlyExpanded = [...expandedWidgets].some(
    (widgetId) => !openedWidgets.has(widgetId)
  )
  if (hasNewlyExpanded) {
    setOpenedWidgets(new Set([...openedWidgets, ...expandedWidgets]))
  }

  return (
    <nav
      data-testid="mobile-widget-list"
      className="flex flex-col divide-y divide-zinc-800"
      aria-label="Виджеты"
    >
      {widgets.map((widgetId) => {
        const widget = WIDGET_REGISTRY[widgetId]
        if (!widget) return null

        const Icon = widget.icon
        const Component = widget.component
        const isExpanded = expandedWidgets.has(widgetId)
        const isMounted = isExpanded || openedWidgets.has(widgetId)
        const ChevronIcon = isExpanded ? ChevronUp : ChevronDown

        return (
          <div
            key={widgetId}
            data-accordion-item={widgetId}
            className="bg-zinc-900/50"
          >
            {/* Toggle Button */}
            <button
              type="button"
              onClick={() => onToggle(widgetId, !isExpanded)}
              aria-expanded={isExpanded}
              className={cn(
                'flex items-center gap-3 px-4 py-3',
                'min-h-12 w-full text-left',
                'transition-colors',
                'hover:bg-zinc-800/50 active:bg-zinc-700/50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500'
              )}
            >
              <Icon className="h-5 w-5 shrink-0 text-emerald-400" />
              <span className="flex-1 font-mono text-sm text-zinc-100">
                {widget.title}
              </span>
              <ChevronIcon className="h-5 w-5 shrink-0 text-zinc-500" />
            </button>

            {/* Collapsible Content */}
            <div
              data-accordion-content={widgetId}
              inert={!isExpanded}
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out',
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                {isMounted ? (
                  <div className="p-4">
                    <Component />
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

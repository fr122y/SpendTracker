'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'

import { cn } from '@/shared/lib'
import { WIDGET_REGISTRY } from '@/shared/lib/widget-registry'

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
        const ChevronIcon = isExpanded ? ChevronUp : ChevronDown

        return (
          <div key={widgetId} className="bg-zinc-900/50">
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
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out',
                isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <div className="p-4">
                  <Component />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}

'use client'

import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { useState } from 'react'

import { useSessionStore } from '@/entities/session'
import { useLayoutStore } from '@/features/layout-editor'
import { cn } from '@/shared/lib'
import { WIDGET_REGISTRY } from '@/shared/lib/widget-registry'
import { Button } from '@/shared/ui'

import type { WidgetId } from '@/shared/types'

// Header Component
function Header() {
  const { viewDate, nextMonth, prevMonth } = useSessionStore()
  const { isEditMode, toggleEditMode } = useLayoutStore()

  const monthYear = viewDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-6 py-4">
      <h1 className="font-mono text-xl font-bold text-emerald-400">
        SmartSpend Terminal
      </h1>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={prevMonth}
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[160px] text-center font-mono text-sm capitalize">
          {monthYear}
        </span>
        <Button
          variant="ghost"
          onClick={nextMonth}
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <Button
        variant={isEditMode ? 'primary' : 'ghost'}
        onClick={toggleEditMode}
      >
        <Edit3 className="mr-2 h-4 w-4" />
        {isEditMode ? 'Готово' : 'Редактировать'}
      </Button>
    </header>
  )
}

// Dashboard Grid Component
function DashboardGrid() {
  const { layoutConfig, isEditMode, moveWidget, moveWidgetInColumn } =
    useLayoutStore()

  const [draggedWidget, setDraggedWidget] = useState<{
    widgetId: WidgetId
    fromColumnId: string
    fromIndex: number
  } | null>(null)

  const [dropTarget, setDropTarget] = useState<{
    columnId: string
    index: number
  } | null>(null)

  const handleDragStart = (
    e: React.DragEvent,
    widgetId: WidgetId,
    columnId: string,
    index: number
  ) => {
    if (!isEditMode) return
    e.dataTransfer.effectAllowed = 'move'
    setDraggedWidget({ widgetId, fromColumnId: columnId, fromIndex: index })
  }

  const handleDragOver = (
    e: React.DragEvent,
    columnId: string,
    index: number
  ) => {
    if (!isEditMode || !draggedWidget) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTarget({ columnId, index })
  }

  const handleDragLeave = () => {
    setDropTarget(null)
  }

  const handleDrop = (
    e: React.DragEvent,
    toColumnId: string,
    toIndex: number
  ) => {
    e.preventDefault()
    if (!draggedWidget) return

    const { widgetId, fromColumnId, fromIndex } = draggedWidget

    if (fromColumnId === toColumnId) {
      // Same column - reorder
      if (fromIndex !== toIndex) {
        moveWidgetInColumn(fromColumnId, fromIndex, toIndex)
      }
    } else {
      // Different column - move
      moveWidget(widgetId, fromColumnId, toColumnId)
    }

    setDraggedWidget(null)
    setDropTarget(null)
  }

  const handleDragEnd = () => {
    setDraggedWidget(null)
    setDropTarget(null)
  }

  return (
    <div className="flex h-full gap-4 p-4">
      {layoutConfig.columns.map((column) => (
        <div
          key={column.id}
          className="flex flex-col gap-4"
          style={{ width: `${column.width}%` }}
        >
          {column.widgets.map((widgetId, index) => {
            const widget = WIDGET_REGISTRY[widgetId]
            if (!widget) return null

            const Component = widget.component
            const Icon = widget.icon
            const isDragging =
              draggedWidget?.widgetId === widgetId &&
              draggedWidget?.fromColumnId === column.id
            const isDropTarget =
              dropTarget?.columnId === column.id && dropTarget?.index === index

            return (
              <div
                key={widgetId}
                draggable={isEditMode}
                onDragStart={(e) =>
                  handleDragStart(e, widgetId, column.id, index)
                }
                onDragOver={(e) => handleDragOver(e, column.id, index)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.id, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all',
                  isEditMode && 'cursor-grab ring-1 ring-zinc-700',
                  isDragging && 'opacity-50',
                  isDropTarget && 'ring-2 ring-emerald-500'
                )}
              >
                {isEditMode && (
                  <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
                    <Icon className="h-4 w-4 text-zinc-500" />
                    <span className="text-xs font-medium text-zinc-400">
                      {widget.title}
                    </span>
                  </div>
                )}
                <div
                  className={cn(isEditMode && 'pointer-events-none opacity-60')}
                >
                  <Component />
                </div>
              </div>
            )
          })}

          {/* Drop zone at end of column */}
          {isEditMode && draggedWidget && (
            <div
              onDragOver={(e) =>
                handleDragOver(e, column.id, column.widgets.length)
              }
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.id, column.widgets.length)}
              className={cn(
                'min-h-[100px] rounded-lg border-2 border-dashed border-zinc-700 transition-colors',
                dropTarget?.columnId === column.id &&
                  dropTarget?.index === column.widgets.length &&
                  'border-emerald-500 bg-emerald-500/10'
              )}
            />
          )}
        </div>
      ))}
    </div>
  )
}

// Main Dashboard Page
export function Dashboard() {
  return (
    <div className="flex h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-auto">
        <DashboardGrid />
      </main>
    </div>
  )
}

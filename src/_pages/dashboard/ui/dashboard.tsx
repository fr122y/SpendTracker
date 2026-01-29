'use client'

import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { useState } from 'react'

import { useSessionStore } from '@/entities/session'
import { ColumnResizer, useLayoutStore } from '@/features/layout-editor'
import { cn, useViewport, isTabletOrSmaller, isMobile } from '@/shared/lib'
import { WIDGET_REGISTRY } from '@/shared/lib/widget-registry'
import { Button, TerminalPanel } from '@/shared/ui'

import type { WidgetId } from '@/shared/types'

// Header Component
function Header() {
  const { viewDate, nextMonth, prevMonth } = useSessionStore()
  const { isEditMode, toggleEditMode } = useLayoutStore()
  const viewport = useViewport()
  const mobile = isMobile(viewport)

  const monthYear = viewDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <header
      className={cn(
        'border-b border-zinc-800 bg-zinc-900/50 px-3 py-3 sm:px-4 sm:py-4',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      {/* Top row: Title and Edit button on mobile */}
      <div className="flex items-center justify-between sm:justify-start">
        <h1 className="font-mono text-lg font-bold text-emerald-400 sm:text-xl">
          SmartSpend Terminal
        </h1>
        {/* Edit button - visible on mobile in top row */}
        <Button
          variant={isEditMode ? 'primary' : 'ghost'}
          onClick={toggleEditMode}
          className="sm:hidden"
          aria-label={isEditMode ? 'Готово' : 'Редактировать'}
        >
          <Edit3 className="h-4 w-4" />
          {!mobile && (isEditMode ? 'Готово' : 'Редактировать')}
        </Button>
      </div>

      {/* Month navigation - centered on mobile, middle on desktop */}
      <div className="flex items-center justify-center gap-2">
        <Button
          variant="ghost"
          onClick={prevMonth}
          aria-label="Предыдущий месяц"
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[140px] text-center font-mono text-sm capitalize sm:min-w-[160px]">
          {monthYear}
        </span>
        <Button
          variant="ghost"
          onClick={nextMonth}
          aria-label="Следующий месяц"
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit button - visible on desktop only */}
      <Button
        variant={isEditMode ? 'primary' : 'ghost'}
        onClick={toggleEditMode}
        className="hidden sm:flex"
      >
        <Edit3 className="mr-2 h-4 w-4" />
        {isEditMode ? 'Готово' : 'Редактировать'}
      </Button>
    </header>
  )
}

// Dashboard Grid Component
function DashboardGrid() {
  const {
    layoutConfig,
    isEditMode,
    moveWidget,
    moveWidgetInColumn,
    resizeColumn,
  } = useLayoutStore()
  const viewport = useViewport()
  const mobile = isMobile(viewport)
  const tabletOrSmaller = isTabletOrSmaller(viewport)

  const handleColumnResize = (columnId: string, deltaPercent: number) => {
    const column = layoutConfig.columns.find((c) => c.id === columnId)
    if (column) {
      const newWidth = column.width + deltaPercent
      resizeColumn(columnId, newWidth)
    }
  }

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
    // Disable drag on mobile/tablet
    if (!isEditMode || tabletOrSmaller) return
    e.dataTransfer.effectAllowed = 'move'
    setDraggedWidget({ widgetId, fromColumnId: columnId, fromIndex: index })
  }

  const handleDragOver = (
    e: React.DragEvent,
    columnId: string,
    index: number
  ) => {
    if (!isEditMode || !draggedWidget || tabletOrSmaller) return
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

  // Flatten all widgets for mobile view
  const allWidgets = layoutConfig.columns.flatMap((column) =>
    column.widgets.map((widgetId) => ({ widgetId, columnId: column.id }))
  )

  // Mobile layout: Single column with all widgets stacked
  if (mobile) {
    return (
      <div
        data-grid-container
        className="flex h-full flex-col gap-4 overflow-y-auto p-4"
      >
        {allWidgets.map(({ widgetId }) => {
          const widget = WIDGET_REGISTRY[widgetId]
          if (!widget) return null

          const Component = widget.component
          const Icon = widget.icon

          return (
            <TerminalPanel
              key={widgetId}
              title={widget.title}
              icon={<Icon className="h-4 w-4" />}
              isEditMode={false}
            >
              <Component />
            </TerminalPanel>
          )
        })}
      </div>
    )
  }

  // Tablet layout: Max 2 columns, equal width
  if (viewport === 'tablet') {
    // Distribute widgets into 2 columns
    const col1Widgets: typeof allWidgets = []
    const col2Widgets: typeof allWidgets = []
    allWidgets.forEach((w, i) => {
      if (i % 2 === 0) col1Widgets.push(w)
      else col2Widgets.push(w)
    })

    return (
      <div
        data-grid-container
        className="grid h-full grid-cols-2 gap-4 overflow-y-auto p-4"
      >
        <div className="flex flex-col gap-4">
          {col1Widgets.map(({ widgetId }) => {
            const widget = WIDGET_REGISTRY[widgetId]
            if (!widget) return null

            const Component = widget.component
            const Icon = widget.icon

            return (
              <TerminalPanel
                key={widgetId}
                title={widget.title}
                icon={<Icon className="h-4 w-4" />}
                isEditMode={false}
              >
                <Component />
              </TerminalPanel>
            )
          })}
        </div>
        <div className="flex flex-col gap-4">
          {col2Widgets.map(({ widgetId }) => {
            const widget = WIDGET_REGISTRY[widgetId]
            if (!widget) return null

            const Component = widget.component
            const Icon = widget.icon

            return (
              <TerminalPanel
                key={widgetId}
                title={widget.title}
                icon={<Icon className="h-4 w-4" />}
                isEditMode={false}
              >
                <Component />
              </TerminalPanel>
            )
          })}
        </div>
      </div>
    )
  }

  // Desktop layout: Original multi-column with drag-and-drop
  return (
    <div data-grid-container className="flex h-full overflow-hidden p-4">
      {layoutConfig.columns.map((column, columnIndex) => (
        <div
          key={column.id}
          className="flex h-full overflow-hidden"
          style={{ width: `${column.width}%` }}
        >
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
            {column.widgets.map((widgetId, index) => {
              const widget = WIDGET_REGISTRY[widgetId]
              if (!widget) return null

              const Component = widget.component
              const Icon = widget.icon
              const isDragging =
                draggedWidget?.widgetId === widgetId &&
                draggedWidget?.fromColumnId === column.id
              const isDropTarget =
                dropTarget?.columnId === column.id &&
                dropTarget?.index === index

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
                    'relative transition-all',
                    isEditMode && 'cursor-grab active:cursor-grabbing',
                    isDragging && 'opacity-50',
                    isDropTarget && 'ring-2 ring-emerald-500 rounded-lg'
                  )}
                >
                  {/* Drag handle - desktop only */}
                  {isEditMode && (
                    <button
                      type="button"
                      aria-label="Перетащить виджет"
                      className="absolute right-2 top-2 z-10 min-h-11 min-w-11 flex items-center justify-center cursor-grab rounded-md bg-zinc-700/80 p-2 hover:bg-zinc-600 active:bg-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-zinc-300"
                        aria-hidden="true"
                      >
                        <circle cx="9" cy="5" r="1" />
                        <circle cx="9" cy="12" r="1" />
                        <circle cx="9" cy="19" r="1" />
                        <circle cx="15" cy="5" r="1" />
                        <circle cx="15" cy="12" r="1" />
                        <circle cx="15" cy="19" r="1" />
                      </svg>
                    </button>
                  )}
                  <TerminalPanel
                    title={widget.title}
                    icon={<Icon className="h-4 w-4" />}
                    isEditMode={isEditMode}
                  >
                    <Component />
                  </TerminalPanel>
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

          {/* Column Resizer - desktop only, between columns */}
          {columnIndex < layoutConfig.columns.length - 1 && (
            <div className="mx-2">
              <ColumnResizer
                columnId={column.id}
                onResize={handleColumnResize}
                isEditMode={isEditMode}
              />
            </div>
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
      <main className="flex-1 overflow-hidden">
        <DashboardGrid />
      </main>
    </div>
  )
}

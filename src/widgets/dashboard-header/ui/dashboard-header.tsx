'use client'

import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'

import { useSessionStore } from '@/entities/session'
import { useLayoutStore } from '@/features/layout-editor'
import { cn, useViewport, isMobile } from '@/shared/lib'
import { Button } from '@/shared/ui'

export function DashboardHeader() {
  const { viewDate, nextMonth, prevMonth } = useSessionStore()
  const { isEditMode, toggleEditMode } = useLayoutStore()
  const viewport = useViewport()
  const mobile = isMobile(viewport)

  const monthYear = viewDate.toLocaleDateString('ru-RU', {
    month: 'long',
    year: 'numeric',
  })

  // Enhanced header border contrast with zinc-700
  return (
    <header
      className={cn(
        'border-b border-zinc-700 bg-zinc-900/50 px-3 py-3 sm:px-4 sm:py-4',
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

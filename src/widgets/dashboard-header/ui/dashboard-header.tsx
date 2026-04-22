'use client'

import { ChevronLeft, ChevronRight, Edit3 } from 'lucide-react'
import { useState } from 'react'

import { useSessionStore } from '@/entities/session'
import { useLayoutStore } from '@/features/layout-editor'
import { MonthPickerModal } from '@/features/month-picker'
import { cn, useViewport, isMobile } from '@/shared/lib'
import { Button } from '@/shared/ui'

export function DashboardHeader() {
  const { selectedDate, nextDay, prevDay, setSelectedDate, setToday } =
    useSessionStore()
  const { isEditMode, toggleEditMode } = useLayoutStore()
  const viewport = useViewport()
  const mobile = isMobile(viewport)
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const formattedDate = selectedDate.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const isToday = selectedDate.toDateString() === new Date().toDateString()

  // Enhanced header border contrast with zinc-700
  return (
    <>
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
          <div className="flex items-center gap-2 sm:hidden">
            {!isToday && (
              <Button
                variant="ghost"
                onClick={setToday}
                className="min-h-[44px] px-3 text-xs"
              >
                Сегодня
              </Button>
            )}
            <Button
              variant={isEditMode ? 'primary' : 'ghost'}
              onClick={toggleEditMode}
              aria-label={isEditMode ? 'Готово' : 'Редактировать'}
            >
              <Edit3 className="h-4 w-4" />
              {!mobile && (isEditMode ? 'Готово' : 'Редактировать')}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            onClick={prevDay}
            aria-label="Предыдущий день"
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(true)}
            className="min-w-[180px] rounded px-2 py-1 text-center font-mono text-sm capitalize transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-w-[220px]"
            aria-label="Выбрать месяц"
          >
            {formattedDate}
          </button>
          <Button
            variant="ghost"
            onClick={nextDay}
            aria-label="Следующий день"
            className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {!isToday && (
            <Button variant="ghost" onClick={setToday}>
              Сегодня
            </Button>
          )}
          <Button
            variant={isEditMode ? 'primary' : 'ghost'}
            onClick={toggleEditMode}
          >
            <Edit3 className="mr-2 h-4 w-4" />
            {isEditMode ? 'Готово' : 'Редактировать'}
          </Button>
        </div>
      </header>

      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        currentDate={selectedDate}
        onSelectMonth={(date) => {
          setSelectedDate(date)
          setIsMonthPickerOpen(false)
        }}
        onClose={() => setIsMonthPickerOpen(false)}
      />
    </>
  )
}

'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { cn } from '@/shared/lib'

interface MonthPickerModalProps {
  isOpen: boolean
  currentDate: Date
  onSelectMonth: (date: Date) => void
  onClose: () => void
}

const MONTHS = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]

export function MonthPickerModal({
  isOpen,
  currentDate,
  onSelectMonth,
  onClose,
}: MonthPickerModalProps) {
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [isVisible, setIsVisible] = useState(false)

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  // Calculate year boundaries from actual current year (not viewed date)
  const actualCurrentYear = new Date().getFullYear()
  const minYear = actualCurrentYear - 5
  const maxYear = actualCurrentYear + 5

  // Sync selected year with currentDate when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedYear(currentDate.getFullYear())
      // Trigger fade in animation
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
    } else {
      setIsVisible(false)
    }
  }, [isOpen, currentDate])

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleMonthClick = (monthIndex: number) => {
    // Preserve the day of the month from currentDate
    const newDate = new Date(
      selectedYear,
      monthIndex,
      currentDate.getDate(),
      currentDate.getHours(),
      currentDate.getMinutes(),
      currentDate.getSeconds()
    )
    onSelectMonth(newDate)
  }

  const handlePrevYear = () => {
    if (selectedYear > minYear) {
      setSelectedYear(selectedYear - 1)
    }
  }

  const handleNextYear = () => {
    if (selectedYear < maxYear) {
      setSelectedYear(selectedYear + 1)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Enhanced backdrop opacity to 70%, improved backdrop-blur, animate-fade-in for smooth appearance
  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md',
        'transition-opacity duration-200',
        isVisible ? 'opacity-100 animate-fade-in' : 'opacity-0'
      )}
      onClick={handleBackdropClick}
    >
      {/* ⚡ Auto-fix: Enhanced modal panel with zinc-700 border and shadow-2xl (Principle: Proximity) */}
      {/* ⚡ Auto-fix: Added animate-slide-up for modal entrance (Principle: Interaction States) */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Выбор месяца"
        className={cn(
          'bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl p-4 sm:p-6 max-w-sm w-full mx-4',
          'relative',
          isVisible && 'animate-slide-up'
        )}
      >
        {/* Header with Close Button */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-100">Выбор месяца</h3>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center',
              'min-h-11 min-w-11 rounded-lg',
              'text-zinc-400 transition-colors',
              'hover:bg-zinc-800 hover:text-zinc-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
            )}
            aria-label="Закрыть"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Year Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={handlePrevYear}
            disabled={selectedYear <= minYear}
            className={cn(
              'flex items-center justify-center',
              'min-h-11 min-w-11 rounded-lg',
              'text-zinc-400 transition-colors',
              'hover:bg-zinc-800 hover:text-zinc-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400'
            )}
            aria-label="Предыдущий год"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <span className="text-xl font-semibold text-zinc-100">
            {selectedYear}
          </span>

          <button
            type="button"
            onClick={handleNextYear}
            disabled={selectedYear >= maxYear}
            className={cn(
              'flex items-center justify-center',
              'min-h-11 min-w-11 rounded-lg',
              'text-zinc-400 transition-colors',
              'hover:bg-zinc-800 hover:text-zinc-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-zinc-400'
            )}
            aria-label="Следующий год"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Month Grid (3x4) */}
        <div className="grid grid-cols-3 gap-2">
          {MONTHS.map((month, index) => {
            const isCurrentMonth =
              index === currentMonth && selectedYear === currentYear

            return (
              <button
                key={month}
                type="button"
                onClick={() => handleMonthClick(index)}
                className={cn(
                  'min-h-[44px] px-4 py-2 rounded-lg text-sm font-medium',
                  'transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  isCurrentMonth
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                )}
              >
                {month}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

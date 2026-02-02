'use client'

import { useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
import { MonthPickerModal } from '@/features/month-picker'
import { cn } from '@/shared/lib'

const WEEKDAY_HEADERS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

interface CalendarDay {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  hasExpense: boolean
  isSalaryDay: boolean
  isAdvanceDay: boolean
  isWeekend: boolean
}

function getCalendarDays(
  viewDate: Date,
  selectedDate: Date,
  expenseDates: Set<string>,
  salaryDay: number,
  advanceDay: number
): CalendarDay[] {
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const today = new Date()

  // First day of the month
  const firstDayOfMonth = new Date(year, month, 1)
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  // Convert to Monday-based (0 = Monday, 6 = Sunday)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek < 0) startDayOfWeek = 6

  // Last day of the month
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()

  // Days from previous month
  const prevMonth = new Date(year, month, 0)
  const prevMonthDays = prevMonth.getDate()

  const days: CalendarDay[] = []

  // Add days from previous month
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i
    const date = new Date(year, month - 1, day)
    const dayOfWeek = date.getDay()
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    const dayOfWeek = date.getDay()
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    const dayOfWeek = date.getDay()
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    })
  }

  return days
}

const MONTH_NAMES = [
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

export function Calendar() {
  const {
    viewDate,
    selectedDate,
    setSelectedDate,
    setViewDate,
    nextMonth,
    prevMonth,
  } = useSessionStore()
  const expenses = useExpenseStore((state) => state.expenses)
  const { salaryDay, advanceDay, setSalaryDay, setAdvanceDay } =
    useSettingsStore()

  const [editingField, setEditingField] = useState<'salary' | 'advance' | null>(
    null
  )
  const [editValue, setEditValue] = useState('')
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const handleStartEdit = (field: 'salary' | 'advance') => {
    setEditingField(field)
    setEditValue(String(field === 'salary' ? salaryDay : advanceDay))
  }

  const handleSaveEdit = () => {
    const value = Math.min(31, Math.max(1, parseInt(editValue) || 1))
    if (editingField === 'salary') {
      setSalaryDay(value)
    } else if (editingField === 'advance') {
      setAdvanceDay(value)
    }
    setEditingField(null)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      setEditingField(null)
    }
  }

  // Create set of dates with expenses
  const expenseDates = new Set(expenses.map((e) => e.date))

  const days = getCalendarDays(
    viewDate,
    selectedDate,
    expenseDates,
    salaryDay,
    advanceDay
  )

  const monthName = MONTH_NAMES[viewDate.getMonth()]
  const year = viewDate.getFullYear()

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="min-h-[44px] min-w-[44px] rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:min-w-0"
          aria-label="Предыдущий месяц"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <button
          onClick={() => setIsMonthPickerOpen(true)}
          className="text-base font-medium text-zinc-100 sm:text-lg hover:text-zinc-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded px-2 py-1"
          aria-label="Выбрать месяц"
        >
          {monthName} {year}
        </button>
        <button
          onClick={nextMonth}
          className="min-h-[44px] min-w-[44px] rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100 active:bg-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-h-0 sm:min-w-0"
          aria-label="Следующий месяц"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {WEEKDAY_HEADERS.map((day, index) => (
          <div
            key={day}
            className={cn(
              'py-1 text-center text-xs font-medium sm:py-2',
              index >= 5 ? 'text-red-400' : 'text-zinc-500'
            )}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDate(day.date)}
            className={cn(
              'relative flex min-h-[48px] items-center justify-center rounded text-sm transition-colors sm:h-14 sm:text-base',
              /* ⚡ Auto-fix: Added background highlight for salary/advance days (Principle: Contrast) */
              day.isSalaryDay &&
                day.isCurrentMonth &&
                !day.isSelected &&
                'bg-emerald-950/30 ring-1 ring-emerald-500/30',
              day.isAdvanceDay &&
                day.isCurrentMonth &&
                !day.isSelected &&
                'bg-amber-950/30 ring-1 ring-amber-500/30',
              !day.isCurrentMonth && !day.isWeekend && 'text-zinc-600',
              !day.isCurrentMonth && day.isWeekend && 'text-red-700',
              day.isCurrentMonth && !day.isWeekend && 'text-zinc-300',
              day.isCurrentMonth && day.isWeekend && 'text-red-400',
              day.isToday && !day.isSelected && 'bg-zinc-700 text-zinc-100',
              day.isSelected && 'bg-blue-600 text-white ring-2 ring-blue-400',
              !day.isSelected &&
                !day.isToday &&
                'hover:bg-zinc-800 hover:text-zinc-100',
              /* ⚡ Auto-fix: Added focus-visible state for keyboard accessibility (Principle: Interaction States) */
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900'
            )}
          >
            {day.day}
            {/* Expense indicator dot */}
            {day.hasExpense && (
              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-green-400 shadow-sm shadow-green-400/50 sm:bottom-1 sm:h-1.5 sm:w-1.5" />
            )}
          </button>
        ))}
      </div>

      {/* ⚡ Auto-fix: Enhanced legend visibility with larger indicators and better spacing (Principle: Contrast + Repetition) */}
      {/* ⚡ Auto-fix: Enhanced border contrast with zinc-700 (Principle: Contrast) */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-zinc-700 bg-zinc-900/70 shadow-md p-2 text-xs text-zinc-400 sm:gap-4 sm:p-3 sm:text-sm">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
          <span>Расход</span>
        </div>
        <button
          onClick={() => handleStartEdit('salary')}
          className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
        >
          <span className="h-3 w-3 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50 ring-1 ring-emerald-400/50" />
          {editingField === 'salary' ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              min={1}
              max={31}
              autoFocus
              aria-label="День зарплаты"
              className="w-12 rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 outline-none ring-2 ring-emerald-400"
            />
          ) : (
            <span>
              Зарплата:{' '}
              <span className="font-medium text-emerald-400">{salaryDay}</span>
            </span>
          )}
        </button>
        <button
          onClick={() => handleStartEdit('advance')}
          className="flex items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-zinc-800 hover:text-zinc-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          <span className="h-3 w-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50 ring-1 ring-amber-400/50" />
          {editingField === 'advance' ? (
            <input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSaveEdit}
              onKeyDown={handleKeyDown}
              min={1}
              max={31}
              autoFocus
              aria-label="День аванса"
              className="w-12 rounded bg-zinc-800 px-2 py-0.5 text-zinc-100 outline-none ring-2 ring-amber-400"
            />
          ) : (
            <span>
              Аванс:{' '}
              <span className="font-medium text-amber-400">{advanceDay}</span>
            </span>
          )}
        </button>
      </div>

      <MonthPickerModal
        isOpen={isMonthPickerOpen}
        currentDate={viewDate}
        onSelectMonth={(date) => {
          setViewDate(date)
          setIsMonthPickerOpen(false)
        }}
        onClose={() => setIsMonthPickerOpen(false)}
      />
    </div>
  )
}

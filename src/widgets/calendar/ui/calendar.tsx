'use client'

import { useState } from 'react'

import { useExpenseStore } from '@/entities/expense'
import { useSessionStore } from '@/entities/session'
import { useSettingsStore } from '@/entities/settings'
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
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
    })
  }

  // Add days from current month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      day,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
    })
  }

  // Add days from next month to complete the grid (6 rows)
  const remainingDays = 42 - days.length
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      day,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: isSameDay(date, selectedDate),
      hasExpense: expenseDates.has(formatDate(date)),
      isSalaryDay: day === salaryDay,
      isAdvanceDay: day === advanceDay,
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
  const { viewDate, selectedDate, setSelectedDate, nextMonth, prevMonth } =
    useSessionStore()
  const expenses = useExpenseStore((state) => state.expenses)
  const { salaryDay, advanceDay, setSalaryDay, setAdvanceDay } =
    useSettingsStore()

  const [editingField, setEditingField] = useState<'salary' | 'advance' | null>(
    null
  )
  const [editValue, setEditValue] = useState('')

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
    <div className="flex flex-col gap-4 p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
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
        <h2 className="text-lg font-medium text-zinc-100">
          {monthName} {year}
        </h2>
        <button
          onClick={nextMonth}
          className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-100"
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
      <div className="grid grid-cols-7 gap-2">
        {WEEKDAY_HEADERS.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-medium text-zinc-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDate(day.date)}
            className={cn(
              'relative flex h-12 items-center justify-center rounded text-sm transition-colors',
              !day.isCurrentMonth && 'text-zinc-600',
              day.isCurrentMonth && 'text-zinc-300',
              day.isToday && !day.isSelected && 'bg-zinc-700 text-zinc-100',
              day.isSelected && 'bg-blue-600 text-white',
              !day.isSelected &&
                !day.isToday &&
                'hover:bg-zinc-800 hover:text-zinc-100'
            )}
          >
            {day.day}
            {/* Indicator Dots */}
            <div className="absolute bottom-1 flex gap-0.5">
              {day.hasExpense && (
                <span className="h-1 w-1 rounded-full bg-green-500" />
              )}
              {day.isSalaryDay && day.isCurrentMonth && (
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
              )}
              {day.isAdvanceDay && day.isCurrentMonth && (
                <span className="h-1 w-1 rounded-full bg-amber-400" />
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-500">
        <div className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          <span>Расход</span>
        </div>
        <button
          onClick={() => handleStartEdit('salary')}
          className="flex items-center gap-1 rounded px-1 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
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
              className="w-12 rounded bg-zinc-800 px-1 text-zinc-100 outline-none ring-1 ring-emerald-400"
            />
          ) : (
            <span>
              Зарплата: <span className="text-emerald-400">{salaryDay}</span>
            </span>
          )}
        </button>
        <button
          onClick={() => handleStartEdit('advance')}
          className="flex items-center gap-1 rounded px-1 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
        >
          <span className="h-2 w-2 rounded-full bg-amber-400" />
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
              className="w-12 rounded bg-zinc-800 px-1 text-zinc-100 outline-none ring-1 ring-amber-400"
            />
          ) : (
            <span>
              Аванс: <span className="text-amber-400">{advanceDay}</span>
            </span>
          )}
        </button>
      </div>
    </div>
  )
}

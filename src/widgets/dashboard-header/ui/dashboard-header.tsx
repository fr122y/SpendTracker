'use client'

import { useState } from 'react'

import { useSessionStore } from '@/entities/session'
import { useEditMode } from '@/features/layout-editor'
import { MonthPickerModal } from '@/features/month-picker'

import { DashboardHeaderView } from './dashboard-header-view'

function formatDashboardHeaderDate(date: Date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function isSameCalendarDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function DashboardHeader() {
  const { selectedDate, nextDay, prevDay, setSelectedDate, setToday } =
    useSessionStore()
  const { isEditMode, toggleEditMode } = useEditMode()
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false)

  const formattedDate = formatDashboardHeaderDate(selectedDate)
  const isToday = isSameCalendarDay(selectedDate, new Date())

  return (
    <>
      <DashboardHeaderView
        formattedDate={formattedDate}
        isEditMode={isEditMode}
        isToday={isToday}
        onNextDay={nextDay}
        onOpenMonthPicker={() => setIsMonthPickerOpen(true)}
        onPreviousDay={prevDay}
        onSetToday={setToday}
        onToggleEditMode={toggleEditMode}
      />

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

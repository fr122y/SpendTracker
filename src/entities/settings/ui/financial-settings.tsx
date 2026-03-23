'use client'

import { useEffect, useState } from 'react'

import { Input } from '@/shared/ui'

import { useSettingsStore } from '../model/queries'

export function FinancialSettings() {
  const {
    weeklyLimit,
    salaryDay,
    advanceDay,
    setWeeklyLimit,
    setSalaryDay,
    setAdvanceDay,
  } = useSettingsStore()

  const [weeklyLimitInput, setWeeklyLimitInput] = useState(String(weeklyLimit))
  const [salaryDayInput, setSalaryDayInput] = useState(String(salaryDay))
  const [advanceDayInput, setAdvanceDayInput] = useState(String(advanceDay))

  useEffect(() => {
    setWeeklyLimitInput(String(weeklyLimit))
  }, [weeklyLimit])

  useEffect(() => {
    setSalaryDayInput(String(salaryDay))
  }, [salaryDay])

  useEffect(() => {
    setAdvanceDayInput(String(advanceDay))
  }, [advanceDay])

  const commitWeeklyLimit = () => {
    const value = Number(weeklyLimitInput)
    const nextValue = Number.isFinite(value) ? Math.max(0, value) : 0
    setWeeklyLimit(nextValue)
    setWeeklyLimitInput(String(nextValue))
  }

  const commitSalaryDay = () => {
    const value = Number.parseInt(salaryDayInput, 10)
    const nextValue = Math.min(
      31,
      Math.max(1, Number.isFinite(value) ? value : 1)
    )
    setSalaryDay(nextValue)
    setSalaryDayInput(String(nextValue))
  }

  const commitAdvanceDay = () => {
    const value = Number.parseInt(advanceDayInput, 10)
    const nextValue = Math.min(
      31,
      Math.max(1, Number.isFinite(value) ? value : 1)
    )
    setAdvanceDay(nextValue)
    setAdvanceDayInput(String(nextValue))
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <Input
        label="Недельный лимит (₽)"
        type="number"
        value={weeklyLimitInput}
        onChange={(e) => setWeeklyLimitInput(e.target.value)}
        onBlur={commitWeeklyLimit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitWeeklyLimit()
            e.currentTarget.blur()
          }
        }}
        min={0}
      />
      <Input
        label="День зарплаты"
        type="number"
        value={salaryDayInput}
        onChange={(e) => setSalaryDayInput(e.target.value)}
        onBlur={commitSalaryDay}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitSalaryDay()
            e.currentTarget.blur()
          }
        }}
        min={1}
        max={31}
      />
      <Input
        label="День аванса"
        type="number"
        value={advanceDayInput}
        onChange={(e) => setAdvanceDayInput(e.target.value)}
        onBlur={commitAdvanceDay}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commitAdvanceDay()
            e.currentTarget.blur()
          }
        }}
        min={1}
        max={31}
      />
    </div>
  )
}

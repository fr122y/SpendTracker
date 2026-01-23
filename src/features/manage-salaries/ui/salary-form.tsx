'use client'

import { useState, useEffect } from 'react'

import { useSettingsStore } from '@/entities/settings'
import { Button, Input } from '@/shared/ui'

export function SalaryForm() {
  const { salaryDay, advanceDay, setSalaryDay, setAdvanceDay } =
    useSettingsStore()

  const [localSalaryDay, setLocalSalaryDay] = useState(salaryDay)
  const [localAdvanceDay, setLocalAdvanceDay] = useState(advanceDay)
  const [showSuccess, setShowSuccess] = useState(false)

  // Sync local state with store when store changes
  useEffect(() => {
    setLocalSalaryDay(salaryDay)
  }, [salaryDay])

  useEffect(() => {
    setLocalAdvanceDay(advanceDay)
  }, [advanceDay])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    if (!localSalaryDay || !localAdvanceDay) return
    if (localSalaryDay < 1 || localSalaryDay > 31) return
    if (localAdvanceDay < 1 || localAdvanceDay > 31) return

    // Update store
    setSalaryDay(localSalaryDay)
    setAdvanceDay(localAdvanceDay)

    // Show success message
    setShowSuccess(true)
    setTimeout(() => {
      setShowSuccess(false)
    }, 3000)
  }

  const isSalaryDayValid = localSalaryDay >= 1 && localSalaryDay <= 31
  const isAdvanceDayValid = localAdvanceDay >= 1 && localAdvanceDay <= 31
  const isFormValid =
    localSalaryDay && localAdvanceDay && isSalaryDayValid && isAdvanceDayValid

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        label="День зарплаты"
        type="number"
        value={localSalaryDay}
        onChange={(e) => setLocalSalaryDay(Number(e.target.value))}
        min={1}
        max={31}
      />
      <Input
        label="День аванса"
        type="number"
        value={localAdvanceDay}
        onChange={(e) => setLocalAdvanceDay(Number(e.target.value))}
        min={1}
        max={31}
      />
      <Button type="submit" disabled={!isFormValid}>
        Сохранить
      </Button>
      {showSuccess && (
        <div className="text-green-600 text-sm">Настройки сохранены</div>
      )}
    </form>
  )
}

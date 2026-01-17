'use client'

import { Input } from '@/shared/ui'

import { useSettingsStore } from '../model/store'

export function FinancialSettings() {
  const {
    weeklyLimit,
    salaryDay,
    advanceDay,
    setWeeklyLimit,
    setSalaryDay,
    setAdvanceDay,
  } = useSettingsStore()

  return (
    <div className="flex flex-col gap-4">
      <Input
        label="Недельный лимит (₽)"
        type="number"
        value={weeklyLimit}
        onChange={(e) => setWeeklyLimit(Number(e.target.value))}
        min={0}
      />
      <Input
        label="День зарплаты"
        type="number"
        value={salaryDay}
        onChange={(e) => setSalaryDay(Number(e.target.value))}
        min={1}
        max={31}
      />
      <Input
        label="День аванса"
        type="number"
        value={advanceDay}
        onChange={(e) => setAdvanceDay(Number(e.target.value))}
        min={1}
        max={31}
      />
    </div>
  )
}

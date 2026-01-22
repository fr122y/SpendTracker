'use client'

import { FinancialSettings } from '@/entities/settings'

export function FinancialSettingsSection() {
  return (
    <div className="flex flex-col gap-4 p-6">
      <h2 className="text-lg font-medium text-zinc-100">
        Финансовые настройки
      </h2>
      <FinancialSettings />
    </div>
  )
}

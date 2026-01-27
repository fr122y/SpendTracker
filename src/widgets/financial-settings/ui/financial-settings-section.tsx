'use client'

import { FinancialSettings } from '@/entities/settings'

export function FinancialSettingsSection() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <h2 className="text-base font-medium text-zinc-100 sm:text-lg">
        Финансовые настройки
      </h2>
      <FinancialSettings />
    </div>
  )
}

import { cn } from '@/shared/lib'

import { HeaderActions } from './header-actions'
import { HeaderBrand } from './header-brand'
import { HeaderDateNavigation } from './header-date-navigation'

export interface DashboardHeaderViewProps {
  formattedDate: string
  isEditMode: boolean
  isToday: boolean
  onNextDay: () => void
  onOpenMonthPicker: () => void
  onPreviousDay: () => void
  onSetToday: () => void
  onToggleEditMode: () => void
  title?: string
}

export function DashboardHeaderView({
  formattedDate,
  isEditMode,
  isToday,
  onNextDay,
  onOpenMonthPicker,
  onPreviousDay,
  onSetToday,
  onToggleEditMode,
  title = 'SmartSpend Terminal',
}: DashboardHeaderViewProps) {
  return (
    <header
      className={cn(
        'border-b border-zinc-700 bg-zinc-900/50 px-3 py-3 sm:px-4 sm:py-4',
        'flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
      )}
    >
      <div className="flex items-center justify-between sm:justify-start">
        <HeaderBrand title={title} />

        <div className="flex items-center gap-2 sm:hidden">
          <HeaderActions
            isEditMode={isEditMode}
            isToday={isToday}
            onSetToday={onSetToday}
            onToggleEditMode={onToggleEditMode}
            showEditLabel={false}
          />
        </div>
      </div>

      <HeaderDateNavigation
        formattedDate={formattedDate}
        onNextDay={onNextDay}
        onOpenMonthPicker={onOpenMonthPicker}
        onPreviousDay={onPreviousDay}
      />

      <div className="hidden items-center gap-2 sm:flex">
        <HeaderActions
          isEditMode={isEditMode}
          isToday={isToday}
          onSetToday={onSetToday}
          onToggleEditMode={onToggleEditMode}
          showEditLabel
        />
      </div>
    </header>
  )
}

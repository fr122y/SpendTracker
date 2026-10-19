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

/**
 * One flex row from the tablet breakpoint (`md`, 768 px) up: brand and actions
 * take the side slots, the date navigation stays in the middle, and the actions
 * never shrink below their content, so controls cannot overlap. Below `md` the
 * date navigation wraps to a second row under the brand and actions.
 */
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
        'flex flex-wrap items-center gap-x-2 gap-y-3 md:flex-nowrap md:gap-x-3'
      )}
    >
      <div className="order-1 flex min-w-0 flex-1 items-center">
        <HeaderBrand title={title} />
      </div>

      <HeaderDateNavigation
        formattedDate={formattedDate}
        onNextDay={onNextDay}
        onOpenMonthPicker={onOpenMonthPicker}
        onPreviousDay={onPreviousDay}
        className="order-3 w-full md:order-2 md:w-auto md:flex-none"
      />

      <div
        data-testid="header-actions"
        className="order-2 flex shrink-0 items-center justify-end gap-2 md:order-3 md:flex-1"
      >
        <HeaderActions
          isEditMode={isEditMode}
          isToday={isToday}
          onSetToday={onSetToday}
          onToggleEditMode={onToggleEditMode}
        />
      </div>
    </header>
  )
}

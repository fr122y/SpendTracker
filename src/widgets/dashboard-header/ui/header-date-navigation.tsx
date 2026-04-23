import { ChevronLeft, ChevronRight } from 'lucide-react'

import { Button } from '@/shared/ui'

export interface HeaderDateNavigationProps {
  formattedDate: string
  onNextDay: () => void
  onOpenMonthPicker: () => void
  onPreviousDay: () => void
}

export function HeaderDateNavigation({
  formattedDate,
  onNextDay,
  onOpenMonthPicker,
  onPreviousDay,
}: HeaderDateNavigationProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="ghost"
        onClick={onPreviousDay}
        aria-label="Предыдущий день"
        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <button
        type="button"
        onClick={onOpenMonthPicker}
        className="min-w-[180px] rounded px-2 py-1 text-center font-mono text-sm capitalize transition-colors hover:text-zinc-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 sm:min-w-[220px]"
        aria-label="Выбрать месяц"
      >
        {formattedDate}
      </button>

      <Button
        variant="ghost"
        onClick={onNextDay}
        aria-label="Следующий день"
        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}

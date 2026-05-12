import { Edit3 } from 'lucide-react'

import { Button } from '@/shared/ui'

export interface HeaderActionsProps {
  isEditMode: boolean
  isToday: boolean
  onSetToday: () => void
  onToggleEditMode: () => void
  showEditLabel: boolean
}

export function HeaderActions({
  isEditMode,
  isToday,
  onSetToday,
  onToggleEditMode,
  showEditLabel,
}: HeaderActionsProps) {
  return (
    <>
      {!isToday && (
        <Button
          variant="ghost"
          onClick={onSetToday}
          className={showEditLabel ? undefined : 'min-h-[44px] px-3 text-xs'}
        >
          Сегодня
        </Button>
      )}

      <Button
        variant={isEditMode ? 'primary' : 'ghost'}
        onClick={onToggleEditMode}
        aria-label={isEditMode ? 'Готово' : 'Редактировать'}
        className={showEditLabel ? undefined : 'min-w-[44px]'}
      >
        <Edit3 className={showEditLabel ? 'mr-2 h-4 w-4' : 'h-4 w-4'} />
        {showEditLabel ? (isEditMode ? 'Готово' : 'Редактировать') : null}
      </Button>
    </>
  )
}

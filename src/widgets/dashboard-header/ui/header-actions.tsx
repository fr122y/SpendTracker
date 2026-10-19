import { CalendarCheck, Edit3, UserCircle } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'

export interface HeaderActionsProps {
  accountHref?: string
  isEditMode: boolean
  isToday: boolean
  onSetToday: () => void
  onToggleEditMode: () => void
}

/** Text labels appear only from `xl` (1280 px); below it actions are icons. */
const labelClassName = 'hidden xl:inline'

/** Square icon button below `xl`, fixed-width labelled button from `xl`. */
const actionSizeClassName = 'min-h-11 w-11 shrink-0 px-0'

export function HeaderActions({
  accountHref = '/account',
  isEditMode,
  isToday,
  onSetToday,
  onToggleEditMode,
}: HeaderActionsProps) {
  const editLabel = isEditMode ? 'Готово' : 'Редактировать'

  return (
    <>
      {/* The slot stays in the layout when the selected day is today, so the
          other actions do not move when the button appears. */}
      <div
        data-testid="header-today-slot"
        className={cn('shrink-0', isToday && 'invisible')}
        aria-hidden={isToday || undefined}
      >
        <Button
          variant="ghost"
          onClick={onSetToday}
          aria-label="Сегодня"
          title="Сегодня"
          tabIndex={isToday ? -1 : undefined}
          className={cn(actionSizeClassName, 'xl:w-32')}
        >
          <CalendarCheck className="h-4 w-4 xl:hidden" aria-hidden="true" />
          <span className={labelClassName}>Сегодня</span>
        </Button>
      </div>

      <Link
        href={accountHref}
        aria-label="Аккаунт"
        title="Аккаунт"
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          actionSizeClassName,
          'xl:w-32'
        )}
      >
        <UserCircle className="h-4 w-4" aria-hidden="true" />
        <span className={labelClassName}>Аккаунт</span>
      </Link>

      {/* The layout editor is not available on phones (below 768 px). */}
      <Button
        variant={isEditMode ? 'primary' : 'ghost'}
        onClick={onToggleEditMode}
        aria-label={editLabel}
        title={editLabel}
        className={cn(actionSizeClassName, 'hidden md:inline-flex xl:w-44')}
      >
        <Edit3 className="h-4 w-4" aria-hidden="true" />
        <span className={labelClassName}>{editLabel}</span>
      </Button>
    </>
  )
}

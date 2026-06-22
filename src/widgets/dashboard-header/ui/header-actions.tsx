import { Edit3, UserCircle } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/shared/lib'
import { Button } from '@/shared/ui'

export interface HeaderActionsProps {
  accountHref?: string
  isEditMode: boolean
  isToday: boolean
  onSetToday: () => void
  onToggleEditMode: () => void
  showEditLabel: boolean
}

export function HeaderActions({
  accountHref = '/account',
  isEditMode,
  isToday,
  onSetToday,
  onToggleEditMode,
  showEditLabel,
}: HeaderActionsProps) {
  return (
    <>
      <Link
        href={accountHref}
        aria-label="Аккаунт"
        className={cn(
          'inline-flex min-h-11 items-center justify-center gap-2 rounded-md border border-zinc-700 bg-zinc-800/50 px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-zinc-400 transition-all hover:border-zinc-600 hover:bg-zinc-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950',
          showEditLabel ? undefined : 'min-w-[44px] px-3'
        )}
      >
        <UserCircle className="h-4 w-4" />
        {showEditLabel ? 'Аккаунт' : null}
      </Link>

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

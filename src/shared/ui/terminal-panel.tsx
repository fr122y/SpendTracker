import { X } from 'lucide-react'
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react'

import { cn } from '@/shared/lib'

export interface TerminalPanelProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  icon?: ReactNode
  isEditMode?: boolean
  onDelete?: () => void
}

export const TerminalPanel = forwardRef<HTMLDivElement, TerminalPanelProps>(
  (
    {
      className,
      title,
      icon,
      isEditMode = false,
      onDelete,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col rounded-md overflow-hidden',
          'border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm shadow-lg',
          isEditMode && 'border-2 border-blue-500/50 border-dashed',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800/50">
          <div className="flex items-center gap-2">
            {icon && <span className="text-blue-500">{icon}</span>}
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
              {title}
            </h2>
          </div>

          {isEditMode && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors"
              aria-label="Удалить виджет"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className={cn('flex-1 p-4 overflow-auto', isEditMode && 'grayscale')}
        >
          {children}
        </div>
      </div>
    )
  }
)

TerminalPanel.displayName = 'TerminalPanel'

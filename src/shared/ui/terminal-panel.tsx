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
          'relative flex flex-col rounded-lg overflow-hidden',
          'bg-zinc-900/80 backdrop-blur-sm border border-zinc-800',
          'shadow-lg shadow-black/20',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {icon && <span className="text-emerald-500">{icon}</span>}
            <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">
              {title}
            </h2>
          </div>

          {isEditMode && onDelete && (
            <button
              onClick={onDelete}
              className="p-1 rounded hover:bg-red-600/20 text-zinc-500 hover:text-red-500 transition-colors"
              aria-label="Delete widget"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-4 overflow-auto">{children}</div>
      </div>
    )
  }
)

TerminalPanel.displayName = 'TerminalPanel'

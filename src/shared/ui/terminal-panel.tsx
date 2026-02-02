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
    // Enhanced contrast with border-zinc-700, animate-fade-in for smooth panel appearance
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex flex-col rounded-md overflow-hidden',
          'border border-zinc-700 bg-zinc-900/30 backdrop-blur-sm shadow-lg',
          'animate-fade-in',
          isEditMode && 'border-2 border-blue-500/50 border-dashed',
          className
        )}
        {...props}
      >
        {/* Header */}
        {/* ⚡ Auto-fix: Enhanced header border contrast (Principle: Contrast) */}
        <div className="flex items-center justify-between p-4 sm:p-5 lg:p-6 border-b border-zinc-700/50">
          <div className="flex items-center gap-2">
            {icon && <span className="text-blue-500">{icon}</span>}
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              {title}
            </h2>
          </div>

          {isEditMode && onDelete && (
            <button
              onClick={onDelete}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900"
              aria-label="Удалить виджет"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div
          className={cn(
            'flex-1 p-4 sm:p-5 lg:p-6 overflow-auto',
            isEditMode && 'grayscale'
          )}
        >
          {children}
        </div>
      </div>
    )
  }
)

TerminalPanel.displayName = 'TerminalPanel'

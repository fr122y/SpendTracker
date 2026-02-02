import { forwardRef, type HTMLAttributes } from 'react'

import { cn } from '@/shared/lib'

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number
  max: number
  label?: string
  showPercentage?: boolean
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max, label, showPercentage = false, ...props }, ref) => {
    const isOverBudget = value > max
    const percentage = Math.min((value / max) * 100, 100)
    const displayPercentage = Math.round((value / max) * 100)

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex justify-between items-center mb-1.5">
            {label && <span className="text-sm text-zinc-400">{label}</span>}
            {showPercentage && (
              <span
                className={cn(
                  'text-sm font-mono font-medium',
                  isOverBudget ? 'text-red-500' : 'text-zinc-300'
                )}
              >
                {displayPercentage}%
              </span>
            )}
          </div>
        )}

        {/* ⚡ Auto-fix: Increased height to h-2.5 for better visibility (Principle: Contrast) */}
        {/* ⚡ Auto-fix: Added shadow-inner to track for depth (Principle: Proximity) */}
        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className="h-2.5 bg-zinc-800 shadow-inner shadow-black/30 rounded-full overflow-hidden"
        >
          {/* ⚡ Auto-fix: Added gradient and glow for visual depth (Principle: Proximity) */}
          <div
            className={cn(
              'h-full transition-all duration-500 ease-out',
              isOverBudget
                ? 'bg-gradient-to-r from-red-600 to-red-500 shadow-sm shadow-red-500/50'
                : 'bg-gradient-to-r from-blue-600 to-blue-500 shadow-sm shadow-blue-500/50'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'

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
    const percentage = Math.min((value / max) * 100, 100)
    const displayPercentage = Math.round((value / max) * 100)

    // Color based on percentage
    const getColor = () => {
      if (percentage < 50) return 'bg-emerald-500'
      if (percentage < 80) return 'bg-yellow-500'
      return 'bg-red-500'
    }

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(label || showPercentage) && (
          <div className="flex justify-between items-center mb-1.5">
            {label && <span className="text-sm text-zinc-400">{label}</span>}
            {showPercentage && (
              <span className="text-sm font-medium text-zinc-300">
                {displayPercentage}%
              </span>
            )}
          </div>
        )}

        <div
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          className="h-2 bg-zinc-800 rounded-full overflow-hidden"
        >
          <div
            className={cn(
              'h-full rounded-full transition-all duration-300',
              getColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)

ProgressBar.displayName = 'ProgressBar'
